/**
 * A Google or GitHub sign-in the backend didn't accept (revnix/rext-control#858). The server's
 * sign-in marks the session with one of these, the route guard turns a marked session away, and
 * the sign-in page says which it was. The backend's limiter is kept apart from every other
 * failure: it counts ten such sign-ins in five minutes for everyone who signs in through this
 * server, so a person it refuses did nothing wrong and only needs to hear when to try again.
 */

/** The backend's call failed: its own error, an answer that couldn't be read, a refusal. */
export const OAUTH_BACKEND_ERROR = "OAuthBackendError";
/** The backend's limiter refused the call (429). */
export const OAUTH_RATE_LIMITED = "OAuthRateLimited";

/** The session's error for a sign-in call the backend answered with `status`. */
export function oauthSignInError(status: number): string {
  return status === 429 ? OAUTH_RATE_LIMITED : OAUTH_BACKEND_ERROR;
}

/** Whether a session's error is a Google or GitHub sign-in that didn't go through. */
export function isOAuthSignInError(error: unknown): boolean {
  return error === OAUTH_BACKEND_ERROR || error === OAUTH_RATE_LIMITED;
}

/** The sign-in page's `error` for a session the route guard turns away. */
export function signInPageError(sessionError: unknown): string {
  if (sessionError === OAUTH_RATE_LIMITED) return "OAuthRateLimited";
  if (sessionError === OAUTH_BACKEND_ERROR) return "OAuthError";
  return "SessionExpired";
}
