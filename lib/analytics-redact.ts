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
  return event;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The path segment after each of these names a workspace, an article, a keyword, a person. */
const NAMED_AFTER: Record<string, string> = {
  w: ":workspace",
  content: ":id",
  keywords: ":keyword",
  personas: ":id",
  users: ":id",
};
/** Fixed pages that sit where a name would. */
const FIXED_SEGMENTS = new Set(["create", "new", "edit", "accept"]);

/**
 * An address reduced to its route: no query, no fragment, and no workspace, article, keyword or
 * person in the path (`/w/acme/content/6f1c…` becomes `/w/:workspace/content/:id`). What analytics
 * may know of a page for someone who said no to being measured (lib/analytics-consent.ts): which
 * kind of page was opened, never whose.
 */
export function anonymousAddress(address: string): string {
  let parsed: URL | null = null;
  try {
    parsed = new URL(address);
  } catch {
    if (!address.startsWith("/")) return address;
  }
  const path = parsed ? parsed.pathname : address.split(/[?#]/)[0];
  const segments = path.split("/");
  const route = segments.map((segment, index) => {
    if (!segment) return segment;
    const named = NAMED_AFTER[segments[index - 1]];
    if (named && !FIXED_SEGMENTS.has(segment)) return named;
    return UUID.test(segment) || /^\d+$/.test(segment) ? ":id" : segment;
  });
  return (parsed ? parsed.origin : "") + route.join("/");
}

/**
 * PostHog's before_send for someone who said no: only page views and page leaves are kept, each
 * with its addresses reduced to routes and with nothing that describes the person.
 */
export function anonymousEvent<
  T extends {
    event?: string;
    properties?: PropertyBag;
    $set?: PropertyBag;
    $set_once?: PropertyBag;
  },
>(event: T | null): T | null {
  if (!event) return event;
  if (event.event !== "$pageview" && event.event !== "$pageleave") return null;
  delete event.$set;
  delete event.$set_once;
  const bag = event.properties;
  if (!bag) return event;
  for (const key of Object.keys(bag)) {
    const value = bag[key];
    if (key === "$set" || key === "$set_once") {
      delete bag[key];
    } else if (
      typeof value === "string" &&
      (URL_PROPERTIES.includes(key) || key.endsWith("pathname"))
    ) {
      bag[key] = anonymousAddress(value);
    }
  }
  return event;
}

/**
 * posthog-js options that go with `redactStoredAddresses`. With `save_referrer` on, every event
 * writes the page's raw referrer into the tab's session storage, a second store the function below
 * doesn't reach. The session's and the person's first referrer are still kept (redacted, below)
 * and sent as `$session_entry_referrer` and `$initial_referrer`.
 */
export const STORED_ADDRESS_OPTIONS = { save_referrer: false } as const;

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
