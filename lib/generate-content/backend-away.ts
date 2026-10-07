import {
  isNetworkFailure,
  SERVER_UNREACHABLE,
  SERVER_UNREACHABLE_MESSAGE,
} from "@/lib/api-client/server-away";

/**
 * The generation flow while the backend is away (task 759): a deploy restarts it for about a
 * minute, and a run goes on once it's back. The `/api/generate/*` routes then answer 502 or 503
 * themselves (they couldn't reach LangGraph), or the host answers 504 for them.
 */
export const isAwayResponse = (status: number) =>
  status === 502 || status === 503 || status === 504;

/**
 * In a generate route: LangGraph couldn't be reached, or the proxy answered in its place. The SDK
 * puts the answer's status on its error; no answer at all is `fetch`'s TypeError.
 */
export const isBackendAway = (error: unknown) =>
  isAwayResponse((error as { status?: number })?.status ?? 0) ||
  isNetworkFailure(error);

/** What a generate route answers when it couldn't reach the backend. */
export const backendAwayResponse = () =>
  Response.json(
    { error: SERVER_UNREACHABLE_MESSAGE, code: SERVER_UNREACHABLE },
    { status: 503 },
  );

/** A status read that found the backend away: nothing is known to have failed. */
export class BackendAwayError extends Error {
  constructor() {
    super(SERVER_UNREACHABLE_MESSAGE);
    this.name = "BackendAwayError";
  }
}

export const isAwayFailure = (error: unknown) =>
  error instanceof BackendAwayError || isNetworkFailure(error);

/** How often a restore asks again while the backend is away, and for how long before it gives up. */
export const AWAY_RETRY_MS = 5000;
export const AWAY_PATIENCE_MS = 3 * 60 * 1000;

/** Whether a restore that first found the backend away at `awaySince` keeps waiting at `now`. */
export const keepsWaiting = (awaySince: number, now: number) =>
  now - awaySince < AWAY_PATIENCE_MS;
