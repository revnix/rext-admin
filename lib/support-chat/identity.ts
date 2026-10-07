// Server only: it reads a server secret, and node:crypto keeps it out of the browser bundle.
import { createHmac } from "node:crypto";
import type { Session } from "next-auth";

/**
 * Who opens the support chat (revnix/rext-control#711). Crisp's free plan doesn't verify a
 * user's identity, so the chat is tied to the account by a session token: an HMAC of the
 * user's id under a server-only secret. It can't be guessed, it's the same on every device,
 * and it needs no stored state. The email and name are what the browser shows Crisp; the
 * team never acts on billing or account changes from a chat alone.
 */
export interface SupportChatIdentity {
  tokenId: string;
  userId: string;
  email: string | null;
  name: string | null;
}

type Claims = { id?: unknown; is_impersonating?: unknown };

/** A backend access token's claims, unverified: the session holding it is server-side. */
function claims(accessToken: string): Claims | null {
  const payload = accessToken.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Claims;
  } catch {
    return null;
  }
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

/**
 * The identity for a session: none without a signed-in user (401), never while an admin
 * impersonates someone (403: the admin would chat as the customer), and none when the chat
 * isn't configured (404).
 */
export function supportChatIdentity(
  session: Session | null,
  secret: string | undefined,
): IdentityOutcome {
  if (!secret) return { ok: false, status: 404 };
  const accessToken = session?.user?.accessToken;
  const tokenClaims = accessToken ? claims(accessToken) : null;
  const userId = typeof tokenClaims?.id === "string" ? tokenClaims.id : null;
  if (!userId) return { ok: false, status: 401 };
  if (tokenClaims?.is_impersonating === true) return { ok: false, status: 403 };
  return {
    ok: true,
    identity: {
      tokenId: supportChatTokenId(userId, secret),
      userId,
      email: session?.user?.email ?? null,
      name: session?.user?.name ?? null,
    },
  };
}
