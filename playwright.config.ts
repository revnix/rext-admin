import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./e2e/auth-state";

/**
 * The accessibility checks (task C10, design/app-language.md §11 and §12), `pnpm a11y`.
 *
 * In pr-checks there is no backend, so the checks start the production build (`pnpm start`, built with
 * REXT_DEV_PAGES=1) and open the pages that render without one: the signed-out pages and
 * /dev/primitives (e2e/a11y/routes.ts).
 *
 * Against the local stack, A11Y_BASE_URL names a running dashboard and A11Y_ROUTES_FILE the pages
 * (rext-control's tools/app-shots/routes.txt, {ws} read from A11Y_WORKSPACE); A11Y_EMAIL and
 * A11Y_PASSWORD sign in first (e2e/global-setup.ts). Nothing here prints them.
 */
const external = process.env.A11Y_BASE_URL;
const port = 3100;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : 1,
  timeout: 120_000,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: external ?? `http://localhost:${port}`,
    // e2e/global-setup.ts writes it before the first page, when it has a login.
    storageState:
      external && process.env.A11Y_EMAIL ? STORAGE_STATE : undefined,
    trace: "off",
  },
  // Two of the widths the language checks (§9): the desktop and the phone.
  projects: [
    {
      name: "1440",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "390",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      },
    },
  ],
  webServer: external
    ? undefined
    : {
        command: `pnpm start -p ${port}`,
        url: `http://localhost:${port}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
