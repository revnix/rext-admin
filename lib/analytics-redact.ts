/**
 * What analytics may know of an address. Links in our emails carry credentials in their query
 * (an unsubscribe, verification, reset or invitation token) and sign-in pages carry an email, so
 * those values are replaced before an event leaves the browser: PostHog adds the current address
 * to every event it sends, not only to page views (rext-control#541).
 *
 * An address also carries what a person wrote (rext-control#942). A list keeps its search in the
 * query (`?q=…`), and a keyword's page and the link that starts an article from the Library name
 * the keyword itself. So a query parameter's value leaves only when the parameter is one of the
 * app's own listed below and the value looks as that parameter's does, and a part of the app's
 * own path that stands where a route takes a parameter leaves only when it is a workspace's
 * address name or an id.
 */
import { ROUTE_TREE, type RouteTree } from "@/lib/analytics-failures";

/**
 * Query parameters whose values never go to analytics: these, and any whose name ends in "token"
 * (invitation_token, access_token, refresh_token, id_token).
 */
const SECRET_PARAMS = new Set(["token", "code", "state", "email"]);

function isSecretParam(key: string): boolean {
  const name = key.toLowerCase();
  return SECRET_PARAMS.has(name) || name.endsWith("token");
}

/** A campaign tag, or one of the app's own fixed words (`month`, `created_at.desc`). */
const WORD = /^[A-Za-z0-9_.~:-]{1,64}$/;
/** Several of them, as a list's filter writes the ones chosen. */
const WORDS = /^[A-Za-z0-9_.~:-]{1,64}(?:,[A-Za-z0-9_.~:-]{1,64}){0,19}$/;
const NUMBER = /^\d{1,9}$/;
const ID_SHAPE =
  "(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{16,64}|\\d{1,12})";
/** What the backend names a thing by: a uuid, a long hexadecimal number, or a number. */
const ID = new RegExp(`^${ID_SHAPE}$`, "i");
const IDS = new RegExp(`^${ID_SHAPE}(?:,${ID_SHAPE}){0,19}$`, "i");

/**
 * The query parameters whose values may go to analytics, each with what its value has to look
 * like. A parameter that isn't here leaves as its name alone: a list's search (`q`) is what a
 * person typed, a Library item's key (`library`) is its keyword. A new parameter is added here
 * only when its values are the app's own words, numbers or ids.
 */
const KEPT_PARAMS: Record<string, RegExp> = {
  // Campaign tags: written into a link by whoever shared it.
  ref: WORD,
  utm_source: WORD,
  utm_medium: WORD,
  utm_campaign: WORD,
  utm_content: WORD,
  // The lists' own words and numbers (components/ui/data-table/url-state.ts, lib/search-params/).
  sort: WORD,
  page: NUMBER,
  size: NUMBER,
  status: WORDS,
  role: WORDS,
  action: WORDS,
  resource: WORDS,
  view: WORD,
  month: /^\d{4}-\d{2}$/,
  // What a page was opened for, or from: one of a few words the code writes
  // (`?publish=schedule` from the editor, `?from=description` on the create-workspace form).
  error: WORD,
  session: WORD,
  reason: WORD,
  drafted: WORD,
  intent: WORD,
  publish: WORD,
  from: WORD,
  // What the backend names a run, a thread or a persona by.
  thread: ID,
  runId: ID,
  persona: IDS,
};
/** Parameters that hold one of the app's own addresses: kept as that address's path, redacted. */
const PATH_PARAMS = new Set(["redirect", "callbackUrl"]);

/** The value an address may carry for a parameter, or null when it carries the value it has. */
function redactedValue(key: string, value: string): string | null {
  if (isSecretParam(key)) return value === "redacted" ? null : "redacted";
  if (value === "" || value === "redacted") return null;
  if (PATH_PARAMS.has(key)) {
    const path = value.startsWith("/")
      ? sharedPath(value.split(/[?#]/)[0])
      : "redacted";
    return path === value ? null : path;
  }
  const shape = Object.hasOwn(KEPT_PARAMS, key) ? KEPT_PARAMS[key] : undefined;
  return shape?.test(value) ? null : "redacted";
}

/** Where the routes take a workspace's own address name (`/w/acme`, `/edit/acme/…`). */
const WORKSPACE_UNDER = new Set(["w", "edit"]);

/**
 * One of the app's own paths as it may leave. A part the routes have by name stays. A part that
 * stands where a route takes a parameter, or past the routes the app has, stays only when it is
 * a workspace's address name (kept like the workspace's id, which every event carries) or an id;
 * anything else there is a star. `/w/acme/keywords/best crm for dentists` leaves as
 * `/w/acme/keywords/*`: the keyword is the person's, the rest says which page it was.
 */
export function sharedPath(pathname: string): string {
  let node: RouteTree | undefined = ROUTE_TREE;
  let depth = 0;
  let first = "";
  return pathname
    .split("/")
    .map((part) => {
      if (part === "") return part;
      const fixed: RouteTree | undefined =
        node && part !== "*" && Object.hasOwn(node, part)
          ? node[part]
          : undefined;
      const place = depth;
      depth += 1;
      if (place === 0) first = part;
      node = fixed ?? node?.["*"];
      if (fixed) return part;
      if (place === 1 && WORKSPACE_UNDER.has(first)) return part;
      return ID.test(part) ? part : "*";
    })
    .join("/");
}

/** Whether an address is one of the app's own pages: the path rule is the app's routes'. */
function ownHost(host: string): boolean {
  return typeof window !== "undefined" && host === window.location.host;
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

/**
 * The address as it may leave: every query value that is a secret, or isn't one of the app's own
 * listed ones, replaced by "redacted", and one of the app's own paths with a star where a person's
 * words stood. An address that needs neither, and anything that isn't an address, is returned as
 * it was.
 */
export function redactUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  let changed = false;
  for (const key of new Set(parsed.searchParams.keys())) {
    const given = parsed.searchParams.getAll(key);
    const allowed = given.map((value) => redactedValue(key, value));
    if (allowed.every((value) => value === null)) continue;
    // One value where the first stood: a parameter given twice, with a value that has to go,
    // leaves as one "redacted".
    parsed.searchParams.set(
      key,
      given.length === 1 && allowed[0] !== null ? allowed[0] : "redacted",
    );
    changed = true;
  }
  if (ownHost(parsed.host)) {
    const path = sharedPath(parsed.pathname);
    if (path !== parsed.pathname) {
      parsed.pathname = path;
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
    redactPaths(bag);
  }
  redactHeatmapAddresses(event.properties);
  return event;
}

/**
 * PostHog also writes the path alone: the page's (`$pathname`), the one before it, the session's
 * first and the person's first. Each is one of the app's own unless the host written beside it
 * (`$session_entry_host` beside `$session_entry_pathname`) says it was the website's.
 */
function redactPaths(bag: NonNullable<PropertyBag>): void {
  for (const key of Object.keys(bag)) {
    if (!key.endsWith("pathname")) continue;
    const value = bag[key];
    if (typeof value !== "string") continue;
    const host = bag[`${key.slice(0, -"pathname".length)}host`];
    if (typeof host === "string" && !ownHost(host)) continue;
    bag[key] = sharedPath(value);
  }
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
