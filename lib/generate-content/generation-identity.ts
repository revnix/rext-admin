import type { Session } from "next-auth";

export interface GenerationIdentity {
  /** The backend user the access token speaks for. */
  userId: string;
  accessToken: string;
}

/**
 * Who a session speaks for on the LangGraph API, and with which token.
 *
 * The backend authenticates every LangGraph request by its bearer token and
 * stamps and filters `metadata.owner` with the token's `id` claim, so thread
 * ownership here follows the same claim rather than `session.user.id`. The two
 * agree except while a super admin impersonates someone: the session keeps the
 * admin's id, the token is the impersonated user's.
 *
 * The claim is read, not verified. The backend verifies the same token on
 * every request, so a forged claim reaches nothing.
 */
export function generationIdentity(
  session: Session | null,
): GenerationIdentity | null {
  const accessToken = session?.user?.accessToken;
  if (!accessToken) return null;

  const userId = tokenUserId(accessToken);
  return userId ? { userId, accessToken } : null;
}

function tokenUserId(accessToken: string): string | null {
  const payload = accessToken.split(".")[1];
  if (!payload) return null;

  try {
    const claims = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { id?: unknown };
    return typeof claims.id === "string" && claims.id ? claims.id : null;
  } catch {
    return null;
  }
}
