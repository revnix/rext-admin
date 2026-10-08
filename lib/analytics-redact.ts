/**
 * What analytics may know of an address. Links in our emails carry credentials in their query
 * (an unsubscribe, verification, reset or invitation token) and sign-in pages carry an email, so
 * those values are replaced before an event leaves the browser: PostHog adds the current address
 * to every event it sends, not only to page views (rext-control#541).
 */

/**
 * Query parameters whose values never go to analytics: these, and any whose name ends in "token"
 * (invitation_token, access_token, refresh_token, id_token).
 */
const SECRET_PARAMS = new Set(["token", "code", "state", "email"]);

function isSecretParam(key: string): boolean {
  const name = key.toLowerCase();
  return SECRET_PARAMS.has(name) || name.endsWith("token");
}

/**
 * The event properties PostHog fills with an address. The session-entry ones ride on every event
 * of a session that began on an emailed link (posthog.com/docs/data/sessions, session entry
 * properties); the rest of PostHog's session and initial properties hold a path, a host or a
 * campaign tag, never a query.
 */
const URL_PROPERTIES = [
  // Not PostHog's: an event of ours that carries the page's address in "url" gets the same care.
  "url",
  "$current_url",
  "$referrer",
  "$initial_current_url",
  "$initial_referrer",
  "$session_entry_url",
  "$session_entry_referrer",
];

/** The address with every secret parameter's value replaced by "redacted". */
export function redactUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  let changed = false;
  for (const key of [...parsed.searchParams.keys()]) {
    if (isSecretParam(key)) {
      parsed.searchParams.set(key, "redacted");
      changed = true;
    }
  }
  return changed ? parsed.toString() : url;
}

type PropertyBag = Record<string, unknown> | undefined;

/** PostHog's before_send: redacts the addresses in an event's properties, $set and $set_once. */
export function redactEventUrls<
  T extends {
    properties?: PropertyBag;
    $set?: PropertyBag;
    $set_once?: PropertyBag;
  },
>(event: T | null): T | null {
  if (!event) return event;
  for (const bag of [event.properties, event.$set, event.$set_once]) {
    if (!bag) continue;
    for (const key of URL_PROPERTIES) {
      const value = bag[key];
      if (typeof value === "string") bag[key] = redactUrl(value);
    }
  }
  redactHeatmapAddresses(event.properties);
  return event;
}

/**
 * A heatmap event holds where people clicked, listed under the address of the page they were on
 * (`$heatmap_data: { "<address>": [{ x, y, … }] }`). The address is a key there, not a property,
 * so it is rewritten here: positions clicked on a sign-in or an invitation page never leave
 * under an address that carries the link's token or the email.
 */
function redactHeatmapAddresses(properties: PropertyBag): void {
  const data = properties?.$heatmap_data;
  if (!properties || !data || typeof data !== "object" || Array.isArray(data)) {
    return;
  }
  const redacted: Record<string, unknown[]> = {};
  for (const [address, clicks] of Object.entries(data)) {
    const key = redactUrl(address);
    // Two addresses that differed only by what was taken out are one page.
    redacted[key] = [
      ...(redacted[key] ?? []),
      ...(Array.isArray(clicks) ? clicks : [clicks]),
    ];
  }
  properties.$heatmap_data = redacted;
}

/** A page's route parameters, as Next's `useParams` gives them. */
type RouteParams = Record<string, string | string[] | undefined>;

/**
 * A page's path with every dynamic part replaced by its name: `/w/acme/content/6f1c…` with
 * `{ workspaceSlug: "acme", id: "6f1c…" }` becomes `/w/:workspaceSlug/content/:id`. What analytics
 * may know of a page for someone who said no to being measured (lib/analytics-consent.ts): which
 * kind of page was opened, never whose. It comes from the route itself, so a new page needs no
 * entry here; a fixed part that happens to equal a parameter's value is replaced too, the safe
 * side.
 */
export function anonymousRoute(pathname: string, params: RouteParams): string {
  const names = new Map<string, string>();
  for (const [name, value] of Object.entries(params)) {
    for (const part of Array.isArray(value) ? value : [value]) {
      if (!part) continue;
      // The path is encoded; the parameter may be either way.
      names.set(part, `:${name}`);
      names.set(encodeURIComponent(part), `:${name}`);
      try {
        names.set(decodeURIComponent(part), `:${name}`);
      } catch {
        // Not an encoded value: the two forms above cover it.
      }
    }
  }
  return pathname
    .split("/")
    .map((segment) => names.get(segment) ?? segment)
    .join("/");
}

/**
 * PostHog's before_send for someone who said no: only page views and page leaves are kept, each
 * with the page's route for an address (`route`, from `anonymousRoute`) and with nothing that
 * describes the person. Every other address the library adds (the session's first page, the
 * referrer) is removed; without a route the event is dropped.
 */
export function anonymousEvent<
  T extends {
    event?: string;
    properties?: PropertyBag;
    $set?: PropertyBag;
    $set_once?: PropertyBag;
  },
>(event: T | null, route: string | null): T | null {
  if (!event) return event;
  if (event.event !== "$pageview" && event.event !== "$pageleave") return null;
  if (route === null) return null;
  delete event.$set;
  delete event.$set_once;
  const bag = event.properties;
  if (!bag) return event;
  for (const key of Object.keys(bag)) {
    if (
      key === "$set" ||
      key === "$set_once" ||
      URL_PROPERTIES.includes(key) ||
      key.endsWith("pathname")
    ) {
      delete bag[key];
    }
  }
  const host = typeof bag.$host === "string" ? bag.$host : "";
  bag.$current_url = host ? `https://${host}${route}` : route;
  bag.$pathname = route;
  return event;
}

/**
 * posthog-js options that go with `redactStoredAddresses`. With `save_referrer` on, every event
 * writes the page's raw referrer into the tab's session storage, a second store the function below
 * doesn't reach. The session's and the person's first referrer are still kept (redacted, below)
 * and sent as `$session_entry_referrer` and `$initial_referrer`.
 */
export const STORED_ADDRESS_OPTIONS = { save_referrer: false } as const;

/**
 * Where posthog-js keeps what it knows of the visitor: in the browser's storage and in its own
 * cookie for `.rext.ai`. rext.ai keeps the same cookie (one PostHog project, one key), so someone
 * who reads the website and then signs up here is one person, and the page they first landed on
 * there is on their account. Where that cookie and this browser's stored copy disagree (the
 * person signed in or out on the other host meanwhile), the cookie is right: without that rule a
 * returning visitor would keep the id stored here and never be joined.
 *
 * Nothing is written before the person allows it. The provider starts posthog-js only then, and
 * under `cookieless_mode: "on_reject"` a "no" keeps neither the cookie nor the stored copy.
 */
export const VISITOR_STORE_OPTIONS = {
  persistence: "localStorage+cookie",
  __preview_cookie_wins_on_conflict: true,
} as const;

/** What the provider needs of posthog-js to read and replace what it keeps in the browser. */
interface StoredProperties {
  get_property: (name: string) => unknown;
  persistence?: { register: (properties: Record<string, unknown>) => unknown };
}

/** An address pair as posthog-js stores it: `u` is the page, `r` its referrer. */
function redactedPair(pair: unknown): Record<string, unknown> | null {
  if (!pair || typeof pair !== "object") return null;
  const copy = { ...(pair as Record<string, unknown>) };
  let changed = false;
  for (const key of ["u", "r"]) {
    const value = copy[key];
    if (typeof value !== "string") continue;
    const redacted = redactUrl(value);
    if (redacted !== value) {
      copy[key] = redacted;
      changed = true;
    }
  }
  return changed ? copy : null;
}

/**
 * posthog-js keeps the first address and referrer of the person, and of each session, in the
 * browser's storage, raw, before `before_send` sees any event. This replaces them with redacted
 * copies. The provider calls it when the SDK starts (what an earlier visit left is cleaned too)
 * and whenever a session begins.
 */
export function redactStoredAddresses(client: StoredProperties): void {
  const person = redactedPair(client.get_property("$initial_person_info"));
  if (person) client.persistence?.register({ $initial_person_info: person });

  // The session's pair sits one level down, beside the session's id.
  const session = client.get_property("$client_session_props");
  if (!session || typeof session !== "object") return;
  const props = redactedPair((session as { props?: unknown }).props);
  if (props) {
    client.persistence?.register({
      $client_session_props: { ...session, props },
    });
  }
}
