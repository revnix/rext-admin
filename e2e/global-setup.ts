import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "@playwright/test";
import { STORAGE_STATE } from "./auth-state";

/**
 * Against the local stack (A11Y_BASE_URL), signs in once with A11Y_EMAIL and A11Y_PASSWORD and keeps the
 * session for every page; the first-login questions are skipped so they don't cover the pages. In
 * pr-checks there's no backend, so nothing signs in.
 */
export default async function globalSetup() {
  const base = process.env.A11Y_BASE_URL;
  const email = process.env.A11Y_EMAIL;
  const password = process.env.A11Y_PASSWORD;
  if (!base || !email || !password) return;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/login`, { timeout: 180_000 });
    await page.locator("#field-email, #email").fill(email);
    await page.locator("#field-password, #password").fill(password);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 90_000,
      }),
      page.locator('button[type="submit"]').click(),
    ]);
    const questions = page.getByRole("dialog", {
      name: "A few questions before you start",
    });
    await questions.waitFor({ timeout: 10_000 }).catch(() => undefined);
    if (await questions.isVisible()) {
      await questions.getByRole("button", { name: "Skip" }).click();
      await questions.waitFor({ state: "hidden" });
    }
    mkdirSync(dirname(STORAGE_STATE), { recursive: true });
    await page.context().storageState({ path: STORAGE_STATE });
  } finally {
    await browser.close();
  }
}
