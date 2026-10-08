/**
 * What the app reports when something fails in front of a person (rext-control task 894): that an
 * error screen came up or a page wasn't there, where, and what kind of failure it was. Never an
 * error's own message, which can be a stack line, a backend detail or something the person typed,
 * and never a part of an address that isn't one of the app's own words.
 */
import { analytics } from "@/lib/analytics";
import { ownWords, wordsLoaded } from "@/lib/analytics-recording";
import { API_ROUTE_TREE } from "@/lib/api-client/route-tree";

/** A class from the code (`TypeError`, `ApiError`, `ChunkLoadError`): letters and digits only. */
const CLASS = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
/** Next's digest of a server error: an opaque id, shown on the screen for support. */
const DIGEST = /^[A-Za-z0-9_-]{1,64}$/;

/** The error's class, as an event may carry it; anything that isn't a plain class name is "other". */
export function errorKind(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  return CLASS.test(name) ? name : "other";
}

/**
 * The backend's status on the API client's own error (lib/api-client/core.ts), told by its shape:
 * an error screen must not pull the API client in to say what it was shown.
 */
function statusOf(error: unknown): number | undefined {
  if (!(error instanceof Error) || error.name !== "ApiError") return undefined;
  const status = (error as { statusCode?: unknown }).statusCode;
  return typeof status === "number" ? status : undefined;
}

/**
 * What an event says about an error: its class, the backend's status where it answered, and the
 * digest of a server error. Nothing else of it.
 */
export function errorProperties(error: unknown): {
  error_kind: string;
  status?: number;
  digest?: string;
} {
  const digest = (error as { digest?: unknown } | null | undefined)?.digest;
  const status = statusOf(error);
  return {
    error_kind: errorKind(error),
    ...(status !== undefined ? { status } : {}),
    ...(typeof digest === "string" && DIGEST.test(digest) ? { digest } : {}),
  };
}

/** One level of the app's page addresses: its fixed parts by name, and "*" where a parameter sits. */
export interface RouteTree {
  [part: string]: RouteTree;
}

/**
 * The app's page addresses, as the folders under `app/` lay them out: a fixed part under its own
 * name, a parameter (`[workspaceSlug]`, `[key]`) as "*". Route groups are passed through and the
 * API is left out. A test reads the folders and fails when this differs from them, so a new page
 * can't quietly fall out of it.
 */
// biome-ignore format: one line per top-level part reads as the map it is
export const ROUTE_TREE: RouteTree = {
  "accept-admin-invitation": {},
  "accept-invitation": {},
  "account-recovery": {},
  admin: { "audit-logs": {}, "email-analytics": {}, monitoring: {}, platform: { invitations: {} }, refunds: {}, roles: {}, security: {}, status: {}, subscriptions: { plans: {} }, users: {}, webhooks: {} },
  checkout: { cancel: {}, success: {} },
  dev: { primitives: {}, tokens: {} },
  edit: { "*": { "*": {} } },
  fonts: {},
  "forgot-password": {},
  invitations: { accept: {} },
  legal: { privacy: {}, "refund-policy": {}, "subscription-terms": {}, terms: {} },
  login: {},
  maintenance: {},
  pricing: {},
  "reset-password": {},
  settings: { data: {}, invoices: {}, notifications: {}, plan: {}, security: {}, usage: {} },
  signup: {},
  unauthorized: {},
  unsubscribe: {},
  "verify-email": {},
  w: { "*": { content: { "*": {}, calendar: {} }, "generate-content": {}, integrations: {}, keywords: { "*": {} }, personas: { "*": { edit: {} }, create: {} }, settings: { "brand-voice": {}, "danger-zone": {}, members: {} }, setup: {} }, create: {} },
};

/**
 * The shape of an address: a part is kept only where the app's own routes have that very word at
 * that very place, and every other part is a star. What stands where a route takes a parameter (a
 * workspace's name, an id, a keyword) is a star whatever it says: a keyword that happens to be
 * "security" is not the settings page of that name. Past the routes the app has, everything is a
 * star. `/w/acme/content/6f1c` keeps `w` and `content`: enough to see which kind of page failed
 * or which kind of link is broken, with nothing of whose it was.
 */
export function pathShape(
  pathname: string,
  tree: RouteTree = ROUTE_TREE,
  longest = 8,
): string {
  const parts = pathname.split("/").filter((part) => part !== "");
  if (parts.length === 0) return "/";
  let node: RouteTree | undefined = tree;
  const shape: string[] = [];
  // A long address says no more than its first parts do.
  for (const part of parts.slice(0, longest)) {
    const fixed: RouteTree | undefined =
      node && part !== "*" && Object.hasOwn(node, part)
        ? node[part]
        : undefined;
    shape.push(fixed ? part : "*");
    node = fixed ?? node?.["*"];
  }
  return `/${shape.join("/")}${parts.length > longest ? "/…" : ""}`;
}

/**
 * The shape of a request to the backend: its route as the backend's own spec names it
 * (lib/api-client/route-tree.ts), with a star wherever the route takes a parameter and past
 * anything the spec doesn't have. The query is dropped whole.
 */
export function apiPathShape(endpoint: string): string {
  return pathShape(endpoint.split(/[?#]/)[0], API_ROUTE_TREE, 12);
}

/**
 * The code on the API client's error when the server couldn't be reached (SERVER_UNREACHABLE in
 * lib/api-client/server-away.ts). Written out here so that an error screen doesn't pull the
 * client's modules in; a test holds the two to each other.
 */
export const UNREACHABLE_CODE = "SERVER_UNREACHABLE";

// A page reports each kind of failed request once, and no more than a handful in all: while the
// backend restarts, every open tab meets the same failures on every route it polls.
const failuresReported = new Set<string>();
const FAILURES_PER_PAGE = 30;

/**
 * Says that the backend failed a request: an answer of 500 or over, or none at all once the tries
 * a restart is given had run out. Which route (apiPathShape), the method, the status, and `away`
 * when it was the server not being reachable. Never the answer's words. A refusal the backend
 * meant (400 to 499) is not a failure of its own and says nothing here; nor does a browser that
 * is offline, whose failure is its connection's.
 */
export function reportApiFailure(
  method: string | undefined,
  endpoint: string,
  error: unknown,
): void {
  if (typeof window === "undefined") return;
  if (!(error instanceof Error) || error.name !== "ApiError") return;
  const away = (error as { code?: unknown }).code === UNREACHABLE_CODE;
  const status = statusOf(error) ?? 0;
  if (status < 500 && !away) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const route = apiPathShape(endpoint);
  const verb = (method ?? "GET").toUpperCase();
  const kind = `${verb} ${route} ${status}`;
  if (failuresReported.has(kind)) return;
  if (failuresReported.size >= FAILURES_PER_PAGE) return;
  failuresReported.add(kind);
  analytics.track("api_request_failed", {
    route,
    method: verb,
    status,
    ...(away ? { away: true } : {}),
  });
}

/** For the tests: a fresh page. */
export function forgetReportedFailures(): void {
  failuresReported.clear();
}

/** Says that the app's own error screen came up for a person: where, and the error's class. */
export function reportErrorScreen(
  where: "page" | "part",
  error: unknown,
  context?: string,
): void {
  analytics.track("error_screen_shown", {
    where,
    ...(context ? { context } : {}),
    route: pathShape(window.location.pathname),
    ...errorProperties(error),
  });
}

/** An id the code gave a toast (`sign-in-backend-away`): a name of ours, never a number sonner made. */
const TOAST_NAME = /^[a-z][a-z0-9-]{1,59}$/;

/**
 * What an event says about an error toast: where it came up, the name the code gave it where it
 * gave one, and its sentence only when that is one of the app's own fixed texts, as the build
 * listed them from the source (lib/recording-words.ts). A toast that carries a backend's answer,
 * or anything put together from a person's data, is on no such list: it is counted and not quoted.
 *
 * Worked out there and then, with no waiting: the event has to leave while the page, the
 * workspace and the person are still the ones the toast came up for. So while the list hasn't
 * been read, the event says nothing of whose words they were (`own_words` is left out).
 */
export function errorToastProperties(
  id: string | number,
  title: unknown,
  pathname: string,
): {
  route: string;
  toast?: string;
  own_words?: boolean;
  message?: string;
} {
  const listed = wordsLoaded();
  const own = listed && typeof title === "string" ? ownWords(title) : null;
  return {
    route: pathShape(pathname),
    ...(typeof id === "string" && TOAST_NAME.test(id) ? { toast: id } : {}),
    ...(listed ? { own_words: own !== null } : {}),
    ...(own !== null ? { message: own } : {}),
  };
}
