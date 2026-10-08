import { defineConfig, devices } from "@playwright/test";

/**
 * The smoke test a deploy ends with (task FB2.34): `pnpm exec playwright test -c playwright.smoke.config.ts`.
 *
 * It opens the deployed dashboard SMOKE_BASE_URL names, as a visitor would. Signed out, it reads the
 * sign-in and sign-up pages and checks that an app address sends to sign-in (e2e/smoke/signed-out.spec.ts).
 * With SMOKE_EMAIL and SMOKE_PASSWORD, a test account with no billing, it also signs in and opens Home and
 * Generate up to the keyword step (e2e/smoke/signed-in.spec.ts); without them that part is skipped.
 *
 * It never starts a generation, never buys and never saves anything. Nothing is retried, and the whole
 * run is cut at two and a half minutes. Nothing here prints the account.
 */
const base = process.env.SMOKE_BASE_URL;
if (!base) {
  throw new Error("SMOKE_BASE_URL names the deployed dashboard to check");
}

export default defineConfig({
  testDir: "e2e/smoke",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  globalTimeout: 150_000,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: base,
    viewport: { width: 1440, height: 900 },
    trace: "off",
    screenshot: "only-on-failure",
  },
});
