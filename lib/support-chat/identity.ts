// Server only: it reads a server secret, and node:crypto keeps it out of the browser bundle.
import { createHmac } from "node:crypto";
import type { Session } from "next-auth";

import { resolveApiBaseUrl } from "@/lib/api-base-url";

/**
 * Who opens the support chat (revnix/rext-control#711). Crisp's free plan doesn't verify a
 * user's identity, so the chat is tied to the account by a session token: an HMAC of the
 * user's id under a server-only secret. It can't be guessed, it's the same on every device,
 * and it needs no stored state. The team never acts on billing or account changes from a
 * chat alone.
 *
 * The user is the one the backend verifies the session's access token for, never a claim
 * read from the token here: a session's token can be replaced from the browser (the
 * impersonation swap), so only the backend's check of its signature says who it belongs to.
 */
type Subscription = { plan_display_name?: unknown; plan_name?: unknown };

export interface SupportChatIdentity {
  tokenId: string;
  userId: string;
  email: string | null;
  name: string | null;
  /** The plan's name as the customer sees it ("Growth", "Trial"), when the backend gives one. */
  plan: string | null;
}

/** The session's token for Crisp: hex HMAC-SHA256 of the user id. */
export function supportChatTokenId(userId: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`rext-support:${userId}`)
    .digest("hex");
}

export type IdentityOutcome =
  | { ok: true; identity: SupportChatIdentity }
  | { ok: false; status: 401 | 403 | 404 };

type Envelope<T> = { data?: T };
type Profile = {
  id?: unknown;
  email?: unknown;
  full_name?: unknown;
  display_name?: unknown;
};

async function backendGet<T>(
  path: string,
  accessToken: string,
  fetchImpl: typeof fetch,
): Promise<T | null> {
  const base = resolveApiBaseUrl({ allowWindowOriginFallback: false });
  const response = await fetchImpl(`${base}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return ((await response.json()) as Envelope<T>).data ?? null;
}

const text = (value: unknown) =>
  typeof value === "string" && value ? value : null;

/**
 * The identity for a session: none without a user the backend accepts (401), never while an
 * admin impersonates someone (403: the admin would chat as the customer), and none when the
 * chat isn't configured (404).
 */
export async function resolveSupportChatIdentity(
  session: Session | null,
  secret: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<IdentityOutcome> {
  if (!secret) return { ok: false, status: 404 };
  const accessToken = session?.user?.accessToken;
  if (!accessToken) return { ok: false, status: 401 };

  const [status, profile, plan] = await Promise.all([
    backendGet<{ is_impersonating?: unknown }>(
      "/api/v1/user/impersonate/status",
      accessToken,
      fetchImpl,
    ),
    // The backend answers `{ data: { profile: {...} } }` (lib/api-client/profile.ts reads
    // it the same way). Reading the id one level up found none, so every signed-in user was
    // answered 401 and the chat never opened.
    backendGet<{ profile?: Profile }>(
      "/api/v1/user/profile",
      accessToken,
      fetchImpl,
    ).then((data) => data?.profile ?? null),
    // The plan's name, for the person who answers the chat. Without it the chat still opens.
    backendGet<{ subscription?: Subscription }>(
      "/api/v1/subscriptions/current",
      accessToken,
      fetchImpl,
    ).then(
      (data) =>
        text(data?.subscription?.plan_display_name) ??
        text(data?.subscription?.plan_name),
      () => null,
    ),
  ]);
  const userId = text(profile?.id);
  if (!status || !userId) return { ok: false, status: 401 };
  if (status.is_impersonating !== false) return { ok: false, status: 403 };

  return {
    ok: true,
    identity: {
      tokenId: supportChatTokenId(userId, secret),
      userId,
      email: text(profile?.email),
      name: text(profile?.full_name) ?? text(profile?.display_name),
      plan,
    },
  };
}
