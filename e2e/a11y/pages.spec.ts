import { expect } from "@playwright/test";
import { axeIssues, focusIssues, type Issue, motionIssues } from "./checks";
import { routesToCheck } from "./routes";
import { test } from "./shared-context";

// Every page opens with reduced motion, so the motion check sees what such a visitor gets and the other
// checks read finished states (the shared, signed-in context sets it itself).
test.use({ reducedMotion: "reduce" });

const listed = (issues: Issue[]) =>
  issues.map((issue) => `${issue.check}: ${issue.target}: ${issue.detail}`);

for (const route of routesToCheck()) {
  test(route, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "load" });
    expect(response?.status() ?? 0, "the page answers").toBeLessThan(400);
    expect(new URL(page.url()).pathname, "no redirect elsewhere").toBe(
      route.split("?")[0],
    );
    await page.evaluate(() => document.fonts.ready);
    // A page's own data and the shell's arrive after load; give them a moment rather than waiting for an
    // idle network, which the dashboard's event stream never gives.
    await page.waitForTimeout(1500);

    const issues = [
      ...(await motionIssues(page)),
      ...(await axeIssues(page)),
      ...(await focusIssues(page)),
    ];
    expect(listed(issues)).toEqual([]);
  });
}
