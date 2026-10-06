/**
 * The desktop sidebar's saved state, readable on the server (the shell layout reads the cookie
 * so the first paint is right) and in the browser.
 *
 * "auto", no choice yet, is expanded from 1280 px and icons only from 1024 to 1279 px. A click
 * on the trigger saves "expanded" or "collapsed", which then holds at every desktop width.
 */
export type SidebarPreference = "auto" | "expanded" | "collapsed";

export const SIDEBAR_COOKIE_NAME = "sidebar_state";

/** The cookie's value as a preference: "true" and "false" are what shadcn's sidebar writes. */
export function parseSidebarPreference(value?: string): SidebarPreference {
  if (value === "true") return "expanded";
  if (value === "false") return "collapsed";
  return "auto";
}
