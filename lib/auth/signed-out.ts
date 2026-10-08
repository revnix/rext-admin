/**
 * A page that is still open after its session ended (revnix/rext-control#858).
 *
 * The route guard looks only when a page loads. A session can end while the page stays: the
 * person signed out in another tab, or a sign-out's own navigation was held back by a form with
 * unsaved changes ("Leave site?", answered "Stay"). Requests then left with no Authorization
 * header, the API answered 422 "Authorization: Field required", and that sentence is what the
 * person read. Two rules instead: a request from a signed-in page never leaves without its token
 * (`authenticatedFetch` in lib/auth-utils.ts), and the page says what happened and holds the way
 * back in (components/auth/signed-out-notice.tsx).
 */

import { goTo } from "@/lib/auth/go-to";
import {
  leaveGuardInForce,
  liftLeaveGuards,
  restoreLeaveGuards,
} from "@/lib/leave-guard";

/** The code and the words of the answer a request gets when the page has no session to send. */
export const SIGNED_OUT = "signed_out";
export const SIGNED_OUT_MESSAGE =
  "You've been signed out. Sign in again to carry on.";

/** The same for a session that could be neither refreshed nor found wanting: try again. */
export const SESSION_UNCONFIRMED = "session_unconfirmed";
export const SESSION_UNCONFIRMED_MESSAGE =
  "We couldn't confirm your session just now. Try again in a moment.";

/** How long after a sign-out's navigation a page that is still open says it is signed out. */
const STILL_HERE_AFTER_MS = 3000;

let signedOut = false;
// Where the sign-out was heading, when one was under way.
let signInUrl: string | null = null;
// True while a sign-out's navigation is under way: the page is about to be replaced, and a
// request it refuses to send meanwhile is no news to anyone.
let leaving = false;
const listeners = new Set<() => void>();

const tell = () => {
  for (const listener of listeners) listener();
};

export const isSignedOut = (): boolean => signedOut;

export function subscribeSignedOut(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The page is open and has no session. `url` is the sign-in page a sign-out was heading for. */
export function reportSignedOut(url?: string): void {
  if (url) signInUrl = url;
  if (signedOut || leaving) return;
  signedOut = true;
  tell();
}

/**
 * A session with a token was read: the person signed in again in another tab, or the empty read
 * was a passing failure. The notice goes, and a form on the page asks before it is left again.
 */
export function reportSignedIn(): void {
  restoreLeaveGuards();
  if (!signedOut) return;
  signedOut = false;
  signInUrl = null;
  tell();
}

/** The sign-in page, with the way back to the page the person is on. */
export function signInUrlFromHere(
  errorCode: string = "SessionExpired",
): string {
  const { pathname, search } = window.location;
  return pathname !== "/login" && pathname !== "/"
    ? `/login?redirect=${encodeURIComponent(pathname + search)}&error=${errorCode}`
    : `/login?error=${errorCode}`;
}

/** The notice's button: the person chose to leave, so no "Leave site?" is put in the way. */
export function signInAgain(): void {
  liftLeaveGuards();
  goTo(signInUrl ?? signInUrlFromHere());
}

/**
 * Leaves for the sign-in page once a sign-out has cleared the session.
 *
 * With unsaved changes on the page the browser would ask "Leave site?" in words that say nothing
 * of a sign-out, and "Stay" left a page that looked alive and could do nothing. So the page isn't
 * left then: the notice says what happened, and the person copies what they need and goes. On any
 * other page the navigation is asked for at once; if the page is still open a moment later
 * (something else held it), it says so too.
 */
export function leaveSignedOut(url: string): void {
  if (leaveGuardInForce()) {
    reportSignedOut(url);
    return;
  }
  leaving = true;
  goTo(url);
  setTimeout(() => {
    leaving = false;
    reportSignedOut(url);
  }, STILL_HERE_AFTER_MS);
}
