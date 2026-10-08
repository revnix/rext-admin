/**
 * The leave guard in force on the page, if a form on it holds unsaved changes (`useLeaveGuard`
 * puts its own here while dirty). A link click is held by the guard itself; a navigation made in
 * code is not a click, so whatever leaves the page that way from outside the form (the shell's
 * workspace switcher, its Generate shortcut, the run dock's "Open article") goes through here and
 * is asked about first.
 */
type Guard = (action: () => void) => void;

let inForce: Guard | null = null;

/** Puts a guard in force; the answer takes it out again, if it is still the one in force. */
export function putLeaveGuard(guard: Guard): () => void {
  inForce = guard;
  return () => {
    if (inForce === guard) inForce = null;
  };
}

/** Runs a navigation at once on a clean page; with a guard in force, the guard asks first. */
export function leaveThroughGuard(action: () => void): void {
  if (inForce) inForce(action);
  else action();
}

/** Whether a form on the page holds unsaved changes right now. */
export const leaveGuardInForce = (): boolean => inForce !== null;

// Set once the person has chosen, knowingly, to leave a page that can save nothing any more (the
// signed-out notice's "Sign in again"): the browser's own "Leave site?" would only ask again.
let lifted = false;

/** Lets the page be left without the browser's prompt, from here on. */
export function liftLeaveGuards(): void {
  lifted = true;
}

/** Puts the prompt back: the page has a session again, so what is on it can be saved. */
export function restoreLeaveGuards(): void {
  lifted = false;
}

export const leaveGuardsLifted = (): boolean => lifted;
