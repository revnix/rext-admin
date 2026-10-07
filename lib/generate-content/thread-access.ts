import { Client, type Thread } from "@langchain/langgraph-sdk";

import { auth } from "@/auth";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import {
  type GenerationIdentity,
  generationIdentity,
} from "@/lib/generate-content/generation-identity";
import { TOO_MANY_RUNS } from "@/lib/generate-content/run-events";

/**
 * The backend's refusal to start a run, with its sentence for the user. The backend answers 429
 * when a user already has two runs in flight (rext-backend G62); that's a refusal to show, not a
 * rate limit to wait out.
 */
export class RunRefusedError extends Error {
  readonly status = 429;
}

const REFUSAL_FALLBACK =
  "You already have as many articles generating as your account allows. Wait for one to finish, then start another.";

/**
 * A 429's body, kept before the SDK reads it: the SDK turns a failed response into its own error
 * (reading the body) before its failed-response hook runs, so the hook finds the sentence here.
 */
const refusalBodies = new WeakMap<Response, Promise<string>>();

const fetchKeepingRefusals = async (
  ...args: Parameters<typeof fetch>
): Promise<Response> => {
  const response = await fetch(...args);
  if (response.status === 429) {
    refusalBodies.set(response, response.clone().text());
  }
  return response;
};

/** The sentence a 429 carries (`{"detail": "..."}`), or a plain fallback. */
export async function refusalMessage(
  body: string | undefined,
): Promise<string> {
  try {
    const detail = (JSON.parse(body ?? "") as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
  } catch {
    // Not JSON: the fallback below.
  }
  return REFUSAL_FALLBACK;
}

/**
 * What a stream route sends when its run fails to start or stops: the error's message, and for the
 * backend's refusal its code, so the page can tell "two runs already going" from a failure.
 */
export function streamErrorPayload(error: unknown): {
  error: string;
  code?: string;
} {
  if (error instanceof RunRefusedError) {
    return { error: error.message, code: TOO_MANY_RUNS };
  }
  return { error: error instanceof Error ? error.message : "Stream error" };
}

/**
 * The LangGraph client shared by every `/api/generate/*` proxy route. It sends
 * the caller's backend access token: the backend refuses anonymous requests to
 * the LangGraph routes and only shows a user the threads they own. A 429 isn't
 * retried: the SDK would retry it five times with backoff, about half a minute
 * of nothing before the refusal showed.
 */
export const getGenerationClient = <TState = unknown>(accessToken: string) =>
  new Client<TState>({
    apiUrl: resolveApiBaseUrl({
      explicitBaseUrl: process.env.LANGGRAPH_API_URL,
    }),
    defaultHeaders: { Authorization: `Bearer ${accessToken}` },
    callerOptions: {
      fetch: fetchKeepingRefusals,
      // A throw here ends the SDK's retries; anything else lets it retry as usual.
      onFailedResponseHook: async (response) => {
        if (response?.status === 429) {
          throw new RunRefusedError(
            await refusalMessage(await refusalBodies.get(response)),
          );
        }
        return false;
      },
    },
  });

type Denied = { ok: false; response: Response };

export type GenerationAccess = ({ ok: true } & GenerationIdentity) | Denied;

export type ThreadAccess =
  | { ok: true; userId: string; accessToken: string; thread: Thread | null }
  | Denied;

const deny = (error: string, status: number, code?: string): Denied => ({
  ok: false,
  response: Response.json(code ? { error, code } : { error }, { status }),
});

/**
 * LangGraph refused the session's access token because it has expired. Only
 * the browser rotates backend tokens, so the routes answer with the code
 * `authenticatedFetch` reads as "refresh the session and try again" — a tab
 * left in the background past the token's lifetime would otherwise fail every
 * call until the user came back to it.
 */
export const isExpiredTokenError = (error: unknown) =>
  /token has expired/i.test((error as { message?: string })?.message ?? "");

export const tokenExpired = (): Response =>
  deny("Authentication token has expired", 401, "TOKEN_EXPIRED").response;

/** The user and token a generate route acts with, or the reply to send. */
export async function requireGenerationIdentity(): Promise<GenerationAccess> {
  const identity = generationIdentity(await auth());
  return identity ? { ok: true, ...identity } : deny("Unauthorized", 401);
}

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
  const identity = await requireGenerationIdentity();
  if (!identity.ok) return identity;
  const { userId, accessToken } = identity;

  let thread: Thread;
  try {
    thread = await getGenerationClient(accessToken).threads.get(threadId);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) {
      return { ok: true, userId, accessToken, thread: null };
    }
    if (isExpiredTokenError(error)) {
      return { ok: false, response: tokenExpired() };
    }

    return deny("Unable to verify thread ownership", 502);
  }

  if (thread.metadata?.owner !== userId) return deny("Forbidden", 403);

  return { ok: true, userId, accessToken, thread };
}
