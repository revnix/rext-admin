import { expect, test } from "@playwright/test";
import { watchForErrors } from "./errors";

// What a customer gets after signing in: Home, and Generate up to its first step. It needs a test account
// with no billing (SMOKE_EMAIL, SMOKE_PASSWORD) that has been through its first-login questions; without
// one this part is skipped. After signing in it only opens pages: nothing is typed, analyzed, generated,
// bought or saved.

const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

test("a signed-in account opens Home and Generate", async ({ page }) => {
  test.skip(
    !email || !password,
    "no test account is set (SMOKE_EMAIL, SMOKE_PASSWORD)",
  );
  const errors = watchForErrors(page);
  // Opening a page reads; the dashboard's reads are GET, and POST for a search. Anything else would be
  // this run changing something.
  const changes: string[] = [];
  page.on("request", (request) => {
    if (["PUT", "PATCH", "DELETE"].includes(request.method())) {
      changes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });

  await page.goto("/login", { waitUntil: "load" });
  await page.getByRole("textbox", { name: /^Email\b/ }).fill(email ?? "");
  await page.getByRole("textbox", { name: /^Password\b/ }).fill(password ?? "");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
  });

  await page.goto("/", { waitUntil: "load" });
  await expect(
    page.getByRole("dialog"),
    "the test account has been through its first-login questions",
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Pipeline" }),
  ).toBeVisible();

  // The workspace's own Generate address, read from the shell's link to it.
  const generate = await page
    .locator('a[href$="/generate-content"]')
    .first()
    .getAttribute("href");
  expect(generate, "the shell links to Generate").toBeTruthy();
  await page.goto(generate ?? "", { waitUntil: "load" });
  await expect(
    page.getByRole("heading", { level: 1, name: "Generate" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Keyword" })).toBeEditable();
  await expect(page.getByRole("button", { name: "Analyze" })).toBeVisible();

  expect(changes, "the run changed nothing").toEqual([]);
  expect(errors(), "no error on the pages").toEqual([]);
});
