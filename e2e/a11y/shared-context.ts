import {
  test as base,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
} from "@playwright/test";
import { STORAGE_STATE } from "../auth-state";

/**
 * The page checks share one browser context per worker (one per width), instead of a fresh one per page.
 *
 * Signed in, the session's refresh token rotates whenever the dashboard refreshes it (a 401 from the
 * event stream forces one). A fresh context per page started every check from the token saved at sign-in,
 * which the backend had already rotated, so it read it as a replay and ended the session: the rest of the
 * run landed on /login (C10a, 2026-10-07). One context keeps the rotated token, and it's saved back for
 * the next width's worker. Signed out (pr-checks), each page keeps Playwright's own fresh context.
 */
export const test = base.extend<
  { page: Page },
  { shared: BrowserContext | null }
>({
  shared: [
    async ({ browser }, use, workerInfo) => {
      const options = workerInfo.project.use as BrowserContextOptions;
      if (!options.storageState) {
        await use(null);
        return;
      }
      const context = await browser.newContext({
        baseURL: options.baseURL,
        viewport: options.viewport,
        userAgent: options.userAgent,
        deviceScaleFactor: options.deviceScaleFactor,
        hasTouch: options.hasTouch,
        isMobile: options.isMobile,
        storageState: options.storageState,
        // Every page opens with reduced motion, so the motion check sees what such a visitor gets and
        // the other checks read finished states.
        reducedMotion: "reduce",
      });
      await use(context);
      await context.storageState({ path: STORAGE_STATE });
      await context.close();
    },
    { scope: "worker" },
  ],
  page: async ({ shared, context }, use) => {
    const page = await (shared ?? context).newPage();
    await use(page);
    await page.close();
  },
});
