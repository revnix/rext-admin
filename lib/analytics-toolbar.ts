/**
 * PostHog's toolbar on the app (rext-control task 712): the bar one of our admins opens from
 * PostHog ("Open in toolbar") to see a page's heatmap laid over the page itself.
 *
 * The toolbar is PostHog's own code, fetched from PostHog's servers, and the app loads no outside
 * code (lib/csp.ts, providers/posthog-provider.tsx). So it is let in for one case only: a
 * signed-in admin of ours whose browser arrived with PostHog's launch link. The link carries its
 * state in the address's fragment, which a browser never sends to a server, so the page's own
 * code has to see it: it then marks the browser with a short-lived cookie and loads the page once
 * more. For a request that carries the mark from a signed-in admin, the server answers with a
 * policy that also allows PostHog's script and its API (proxy.ts), and posthog-js is started
 * allowed to fetch the toolbar. Closing the toolbar, signing out or two hours ends it. Nobody
 * else, signed out or a customer, ever gets that policy: a mark set by hand changes nothing,
 * because the server checks the role on every request.
 */

import { ROLES } from "@/lib/permissions";

/** The mark on a browser whose admin opened the toolbar: present or absent, nothing in it. */
export const TOOLBAR_COOKIE = "rext-toolbar";

/** Two hours, after which the launch link has to be used again. */
const TOOLBAR_SECONDS = 60 * 60 * 2;

/** Where posthog-js itself keeps a launch's state between pages; it removes it when the toolbar is closed. */
const LAUNCH_STATE_KEY = "_postHogToolbarParams";
/** When this browser's launch runs out (a time in milliseconds). */
const UNTIL_KEY = "rext-toolbar-until";
/** Set for the one reload that follows the mark, so a browser that refuses the cookie isn't reloaded for ever. */
const RELOADED_KEY = "rext-toolbar-reloaded";

// Read when this code first runs, as posthog-js does: it takes the state out of the address
// when it starts.
const LAUNCHED =
  typeof window !== "undefined" && /[#&]__posthog=/.test(window.location.hash);

let stamped = false;

/** Whether a person with this role may have the toolbar: our own admins, never a customer. */
export function mayUseToolbar(role: string | null | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

/** Whether this browser carries the mark. */
export function toolbarMarked(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${TOOLBAR_COOKIE}=1`);
}

function writeMark(seconds: number): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  // Lax, not Strict: the mark has to ride on the visit that comes from PostHog's own page.
  // biome-ignore lint/suspicious/noDocumentCookie: a present-or-absent mark the server reads on the next request
  document.cookie = `${TOOLBAR_COOKIE}=${seconds > 0 ? "1" : ""}; Max-Age=${seconds}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Whether a launch of the toolbar is under way in this browser: the launch link was just used,
 * or posthog-js still holds the state of one that hasn't run out. A state left over with no
 * time against it (from before this existed, or older than two hours) is removed, so the
 * toolbar is not asked for on every page for ever.
 */
function launchUnderWay(now: number): boolean {
  try {
    const store = window.localStorage;
    if (LAUNCHED && !stamped) {
      // The link was used on this page load: its two hours start now.
      store.setItem(UNTIL_KEY, String(now + TOOLBAR_SECONDS * 1000));
      stamped = true;
    }
    const until = Number(store.getItem(UNTIL_KEY));
    const live = Number.isFinite(until) && until > now;
    if (LAUNCHED) return live;
    if (store.getItem(LAUNCH_STATE_KEY) !== null && live) return true;
    store.removeItem(LAUNCH_STATE_KEY);
    store.removeItem(UNTIL_KEY);
    return false;
  } catch {
    // No storage: posthog-js can't keep a launch either.
    return false;
  }
}

/**
 * Keeps the mark in step with the launch, for the person the page knows now. Returns true when
 * the page has to be loaded once more for the server to answer with the toolbar's policy.
 *
 * `allowed`: signed in, one of our admins, and not acting as a customer.
 */
export function syncToolbarMark(allowed: boolean, now = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  const wanted = allowed && launchUnderWay(now);
  const marked = toolbarMarked();
  if (wanted && !marked) {
    writeMark(TOOLBAR_SECONDS);
    let reloaded = true;
    try {
      reloaded = window.sessionStorage.getItem(RELOADED_KEY) === "1";
      window.sessionStorage.setItem(RELOADED_KEY, "1");
    } catch {
      // No storage to remember the reload in: don't risk a loop.
    }
    return toolbarMarked() && !reloaded;
  }
  if (!wanted && marked) writeMark(0);
  if (wanted) {
    try {
      window.sessionStorage.removeItem(RELOADED_KEY);
    } catch {
      // Nothing to forget.
    }
  }
  return false;
}
