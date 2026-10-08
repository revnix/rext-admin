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
