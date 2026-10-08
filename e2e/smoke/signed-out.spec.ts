import { expect, test } from "@playwright/test";
import { reportWarnings, watchForErrors } from "./errors";
import { field } from "./fields";

// What a visitor who has not signed in gets from the deployed dashboard. Pages are only read: no form
// is sent.

test("the sign-in page shows its form", async ({ page, baseURL }) => {
  const seen = watchForErrors(page, baseURL ?? "");
  const response = await page.goto("/login", { waitUntil: "load" });

  expect(response?.status(), "the page answers").toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(field(page, "email")).toBeEditable();
  await expect(field(page, "password")).toBeEditable();
  await expect(page.getByRole("button", { name: "Log in" })).toBeEnabled();
  reportWarnings(seen, "/login");
  expect(seen.errors, "no error of our own on the page").toEqual([]);
});

test("the sign-up page shows its form", async ({ page, baseURL }) => {
  const seen = watchForErrors(page, baseURL ?? "");
  const response = await page.goto("/signup", { waitUntil: "load" });

  expect(response?.status(), "the page answers").toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(field(page, "full_name")).toBeEditable();
  await expect(field(page, "email")).toBeEditable();
  await expect(field(page, "password")).toBeEditable();
  await expect(field(page, "confirmPassword")).toBeEditable();
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
  reportWarnings(seen, "/signup");
  expect(seen.errors, "no error of our own on the page").toEqual([]);
});

test("an app address sends a signed-out visitor to sign-in", async ({
  page,
}) => {
  await page.goto("/settings/usage", { waitUntil: "load" });

  const url = new URL(page.url());
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("callbackUrl")).toBe("/settings/usage");
  await expect(field(page, "email")).toBeEditable();
});
