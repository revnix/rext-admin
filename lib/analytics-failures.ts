/**
 * What the app reports when something fails in front of a person (rext-control task 894): that an
 * error screen came up or a page wasn't there, where, and what kind of failure it was. Never an
 * error's own message, which can be a stack line, a backend detail or something the person typed,
 * and never a part of an address that isn't one of the app's own words.
 */
import { ApiError } from "@/lib/api-client/core";

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
 * What an event says about an error: its class, the backend's status where it answered, and the
 * digest of a server error. Nothing else of it.
 */
export function errorProperties(error: unknown): {
  error_kind: string;
  status?: number;
  digest?: string;
} {
  const digest = (error as { digest?: unknown } | null | undefined)?.digest;
  return {
    error_kind: errorKind(error),
    ...(ApiError.is(error) ? { status: error.statusCode } : {}),
    ...(typeof digest === "string" && DIGEST.test(digest) ? { digest } : {}),
  };
}

/**
 * The fixed parts of the app's page addresses: every folder under `app/` that is a word of ours
 * (not a parameter, a group or the API). A test reads the folders and fails when one is missing
 * here, so a new page can't quietly fall out of the list.
 */
export const ROUTE_WORDS: ReadonlySet<string> = new Set([
  "accept",
  "accept-admin-invitation",
  "accept-invitation",
  "account-recovery",
  "admin",
  "audit-logs",
  "brand-voice",
  "calendar",
  "cancel",
  "checkout",
  "content",
  "create",
  "danger-zone",
  "data",
  "dev",
  "edit",
  "email-analytics",
  "fonts",
  "forgot-password",
  "generate-content",
  "integrations",
  "invitations",
  "invoices",
  "keywords",
  "legal",
  "login",
  "maintenance",
  "members",
  "monitoring",
  "notifications",
  "personas",
  "plan",
  "plans",
  "platform",
  "pricing",
  "primitives",
  "privacy",
  "refund-policy",
  "refunds",
  "reset-password",
  "roles",
  "security",
  "settings",
  "signup",
  "status",
  "subscription-terms",
  "subscriptions",
  "success",
  "terms",
  "tokens",
  "unauthorized",
  "unsubscribe",
  "usage",
  "users",
  "verify-email",
  "w",
  "webhooks",
]);

/**
 * The shape of an address: each part that is one of the app's own words is kept, and every other
 * part (a workspace's name, an id, a mistyped word) becomes a star. `/w/acme/content/6f1c` keeps
 * `w` and `content` and turns the other two into stars: enough to see which kind of page failed
 * or which kind of link is broken, with nothing of whose it was.
 */
export function pathShape(pathname: string): string {
  const parts = pathname.split("/").filter((part) => part !== "");
  if (parts.length === 0) return "/";
  // A long address says no more than its first parts do.
  const kept = parts
    .slice(0, 6)
    .map((part) =>
      ROUTE_WORDS.has(part.toLowerCase()) ? part.toLowerCase() : "*",
    );
  return `/${kept.join("/")}${parts.length > 6 ? "/…" : ""}`;
}
