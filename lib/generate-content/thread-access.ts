import { Client, type Thread } from "@langchain/langgraph-sdk";

import { auth } from "@/auth";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { generationIdentity } from "@/lib/generate-content/generation-identity";

/**
 * The LangGraph client shared by every `/api/generate/*` proxy route. It sends
 * the caller's backend access token: the backend refuses anonymous requests to
 * the LangGraph routes and only shows a user the threads they own.
 */
export const getGenerationClient = <TState = unknown>(accessToken: string) =>
  new Client<TState>({
    apiUrl: resolveApiBaseUrl({
      explicitBaseUrl: process.env.LANGGRAPH_API_URL,
    }),
    defaultHeaders: { Authorization: `Bearer ${accessToken}` },
  });

export type ThreadAccess =
  | { ok: true; userId: string; accessToken: string; thread: Thread | null }
  | { ok: false; response: Response };

const deny = (error: string, status: number, code?: string): ThreadAccess => ({
  ok: false,
  response: Response.json(code ? { error, code } : { error }, { status }),
});

/**
 * LangGraph refused the session's access token because it has expired. Only
 * the browser rotates backend tokens, so the routes answer with the code
 * `authenticatedFetch` reads as "refresh the session and try again" — a tab
 * left in the background past the token's lifetime would otherwise fail every
 * status poll until the user came back to it.
 */
const isExpiredTokenError = (error: unknown) =>
  /token has expired/i.test((error as { message?: string })?.message ?? "");

/**
 * Session + ownership gate for the `/api/generate/[threadId]/*` routes.
 *
 * Threads are stamped with `metadata.owner` when they are created in
 * `/api/generate/threads`, with the user the access token speaks for. The
 * backend's LangGraph auth handler stamps and filters the same field from the
 * same token, so another user's thread reads as missing there; this check is
 * the dashboard's own gate on top of it.
 *
 * A thread with no owner (created before the stamp existed) is refused rather
 * than grandfathered: an unowned thread cannot be told apart from another
 * tenant's. Those age out with the checkpointer TTL.
 *
 * A thread that is *gone* is reported as `thread: null` instead of an error —
 * there is nothing left to own, and cancelling an already-finished generation
 * must still succeed. Every other lookup failure denies, so a LangGraph outage
 * closes the gate instead of opening it.
 */
export async function requireThreadOwner(
  threadId: string,
): Promise<ThreadAccess> {
  const identity = generationIdentity(await auth());
  if (!identity) return deny("Unauthorized", 401);
  const { userId, accessToken } = identity;

  let thread: Thread;
  try {
    thread = await getGenerationClient(accessToken).threads.get(threadId);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) {
      return { ok: true, userId, accessToken, thread: null };
    }
    if (isExpiredTokenError(error)) {
      return deny("Authentication token has expired", 401, "TOKEN_EXPIRED");
    }

    return deny("Unable to verify thread ownership", 502);
  }

  if (thread.metadata?.owner !== userId) return deny("Forbidden", 403);

  return { ok: true, userId, accessToken, thread };
}
