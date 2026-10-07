/**
 * Riding out a backend deploy (task 759). Each deploy restarts the API for about a minute: the
 * proxy answers 502, then 503, and a request already under way loses its connection. From the
 * browser most of that reads as a network error, since the proxy's own answers carry no CORS
 * headers. A request that changes nothing is tried again; one that might isn't, and says so in a
 * plain sentence. When the retries run out, the shell says Rext is updating and watches for the
 * API's return (`components/server-away-notice.tsx`).
 */

import { resolveApiBaseUrl } from "@/lib/api-base-url";

/** The code on the error a request ends on when the server couldn't be reached. */
export const SERVER_UNREACHABLE = "SERVER_UNREACHABLE";

export const SERVER_UNREACHABLE_MESSAGE =
  "We couldn't reach the server. Try again.";

/** The waits before the second, third and fourth try of a request that changes nothing. */
export const AWAY_RETRY_DELAYS_MS = [1000, 3000, 8000] as const;

/** What the proxy answers while the API restarts. */
export const isAwayStatus = (status: number) =>
  status === 502 || status === 503;

/** GET and HEAD change nothing, so sending one again is safe. */
export const isIdempotent = (method: string | undefined) =>
  ["GET", "HEAD"].includes((method ?? "GET").toUpperCase());

/**
 * `fetch` rejects with a TypeError when no answer came at all, in each engine's words ("Failed to
 * fetch", "NetworkError when attempting to fetch resource.", "Load failed", and on the server
 * "fetch failed" or "terminated"). Any other TypeError is a bug, and an abort is the caller's doing.
 */
export const isNetworkFailure = (error: unknown) =>
  error instanceof TypeError &&
  /fetch|network|load failed|terminated/i.test(error.message);

/**
 * The browser says it has no connection: that's its side, not a deploy, so there is nothing to
 * wait out. Only its plain "no" counts; the server has no such word.
 */
export const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

/** A wait an abort ends at once, rejecting as the aborted fetch would have. */
export function waitFor(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    const aborted = () =>
      reject(
        signal?.reason ??
          new DOMException("The request was aborted.", "AbortError"),
      );
    if (signal?.aborted) return aborted();
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      aborted();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// The errors a request ended on after its retries ran out, so nothing above the API client (a
// query's own retry) repeats the wait. A request that was never retried (a POST behind a query)
// isn't here, and keeps the query's retries.
const retried = new WeakSet<object>();
export const markRetried = (error: object) => {
  retried.add(error);
};
export const alreadyRetried = (error: unknown) =>
  typeof error === "object" && error !== null && retried.has(error);

// Whether the server is taken to be away: set when a request's retries run out, cleared when the
// notice's watch sees the API answer again or gives up. Two rules keep the notice from coming back
// in a loop while one request keeps failing though the API is up, or through a long outage: for a
// minute after the watch saw the API answer, a failure reports nothing; and once the watch has
// given up, nothing is reported until a request is answered again.
const QUIET_AFTER_BACK_MS = 60_000;
let away = false;
let quietUntil = 0;
let gaveUp = false;
const listeners = new Set<() => void>();

const setAway = (next: boolean) => {
  if (away === next) return;
  away = next;
  for (const listener of listeners) listener();
};

/** Only the browser keeps this: on the server no notice watches for the API's return. */
export const reportServerAway = () => {
  if (typeof window === "undefined" || gaveUp || Date.now() < quietUntil) {
    return;
  }
  setAway(true);
};
/** The watch saw the API answer. */
export const reportServerBack = () => {
  quietUntil = Date.now() + QUIET_AFTER_BACK_MS;
  setAway(false);
};
/** The watch gave up waiting. */
export const stopWatchingServer = () => {
  gaveUp = true;
  setAway(false);
};
/** A request was answered: the API is there, whatever the watch concluded. */
export const noteServerAnswered = () => {
  gaveUp = false;
};
export const isServerAway = () => away;
export function subscribeServerAway(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Whether the API itself answers again: its liveness address, with no session. While it restarts
 * the proxy answers in its place, and that answer carries no CORS headers, so the fetch rejects.
 */
export async function serverAnswers(): Promise<boolean> {
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/health/live`, {
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
