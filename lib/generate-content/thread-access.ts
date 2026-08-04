import { Client, type Thread } from "@langchain/langgraph-sdk";

import { auth } from "@/auth";
import { resolveApiBaseUrl } from "@/lib/api-base-url";

/** The LangGraph client shared by every `/api/generate/*` proxy route. */
export const getGenerationClient = <TState = unknown>() =>
  new Client<TState>({
    apiUrl: resolveApiBaseUrl({
      explicitBaseUrl: process.env.LANGGRAPH_API_URL,
    }),
  });

export type ThreadAccess =
  | { ok: true; userId: string; thread: Thread | null }
  | { ok: false; response: Response };

const deny = (error: string, status: number): ThreadAccess => ({
  ok: false,
  response: Response.json({ error }, { status }),
});

/**
 * Session + ownership gate for the `/api/generate/[threadId]/*` routes.
 *
 * Threads are stamped with `metadata.owner` when they are created in
 * `/api/generate/threads`. LangGraph's own `add_owner` hook does not do this for
 * us — `langgraph.json` declares no `auth` entry, so that hook is never loaded
 * and the server applies no per-user filtering of its own. This stamp is the
 * only record of who a thread belongs to.
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return deny("Unauthorized", 401);

  let thread: Thread;
  try {
    thread = await getGenerationClient().threads.get(threadId);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) {
      return { ok: true, userId, thread: null };
    }

    return deny("Unable to verify thread ownership", 502);
  }

  if (thread.metadata?.owner !== userId) return deny("Forbidden", 403);

  return { ok: true, userId, thread };
}
