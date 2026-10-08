import type { Page } from "@playwright/test";

/**
 * A form's field by the name it is sent under ("email", "password"), as the visitor sees it. Not by a
 * role: a password field has none of its own. Not by its label either: the label's words are followed
 * by "(required)" for screen readers.
 *
 * The visible one. When the scripts are already in the browser's cache, React draws the form before
 * the server's last streamed piece arrives; that piece, the same form in a hidden `div#S:0`, then sits
 * in the page for under a tenth of a second before it is dropped. Measured on the live sign-in page on
 * 8 October 2026: 6 of 12 reloads, 63 to 98 ms, never on screen. A lookup that took both fields failed
 * a deploy's smoke on a healthy page.
 */
export const field = (page: Page, name: string) =>
  page.locator(`input[name="${name}"]:visible`);

/**
 * Waits until the page has taken its form over: the submit button a visitor sees carries React's own
 * keys from then on. A field filled before that can be emptied when React takes the form over.
 */
export const formIsReady = (page: Page) =>
  page.waitForFunction(() =>
    [...document.querySelectorAll<HTMLElement>('button[type="submit"]')].some(
      (button) =>
        button.offsetParent !== null &&
        Object.keys(button).some((key) => key.startsWith("__react")),
    ),
  );
