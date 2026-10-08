/**
 * What the app reports when something fails in front of a person (rext-control task 894): that an
 * error screen came up or a page wasn't there, where, and what kind of failure it was. Never an
 * error's own message, which can be a stack line, a backend detail or something the person typed,
 * and never a part of an address that isn't one of the app's own words.
 */
import { analytics } from "@/lib/analytics";
import { ownWords, wordsLoaded } from "@/lib/analytics-recording";

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
export function pathShape(pathname: string): string {
  const parts = pathname.split("/").filter((part) => part !== "");
  if (parts.length === 0) return "/";
  let node: RouteTree | undefined = ROUTE_TREE;
  const shape: string[] = [];
  // A long address says no more than its first parts do.
  for (const part of parts.slice(0, 8)) {
    const fixed: RouteTree | undefined =
      node && part !== "*" && Object.hasOwn(node, part)
        ? node[part]
        : undefined;
    shape.push(fixed ? part : "*");
    node = fixed ?? node?.["*"];
  }
  return `/${shape.join("/")}${parts.length > 8 ? "/…" : ""}`;
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
