/**
 * Cross-tab mutex for token-refresh triggers.
 *
 * `authenticatedFetch`'s reactive 401 handler and `SessionTimeoutWarning`'s
 * proactive timer are two independent client-side entry points that can each
 * fire a refresh for the same session at the same time — from the same tab
 * or different tabs. The backend's refresh tokens are single-use, so when
 * both requests reach the server before either response has updated the
 * session cookie, one gets a fresh token pair and the other gets a
 * definitive "invalid/revoked" rejection for a token that was never actually
 * dead — it just lost a rotation race. That false rejection is what forces
 * an unwanted logout right after a valid refresh just succeeded.
 *
 * Serializing every refresh trigger through one lock — shared across tabs
 * via the Web Locks API — means only one of these calls is ever in flight at
 * a time. The second caller acquires the lock only after the first's
 * request has fully resolved and the session cookie reflects the outcome,
 * so it can check freshness first and skip a redundant/racing call entirely
 * instead of firing a second request against an already-rotated token.
 */

const REFRESH_LOCK_NAME = "wrext-admin:token-refresh";

// Fallback for environments without the Web Locks API (older Safari, non-browser
// contexts): a simple in-process promise chain. It only serializes calls within
// this one tab/JS realm, not across tabs, but that's still strictly better than
// no coordination at all.
let fallbackChain: Promise<unknown> = Promise.resolve();

export async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    const run = fallbackChain.then(fn, fn);
    // Swallow errors here so one failed refresh doesn't wedge the chain for
    // subsequent callers; the real error still propagates via `run` below.
    fallbackChain = run.catch(() => undefined);
    return run;
  }

  return navigator.locks.request(REFRESH_LOCK_NAME, fn);
}
