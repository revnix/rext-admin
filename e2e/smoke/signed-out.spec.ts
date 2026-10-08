import { expect, type Page, test } from "@playwright/test";
import { watchForErrors } from "./errors";

// What a visitor who has not signed in gets from the deployed dashboard. Pages are only read: no form
// is sent.

/** A form's field by the start of its label ("Password (required)"), ready to be typed into. */
const field = (page: Page, label: string) =>
  page.getByRole("textbox", { name: new RegExp(`^${label}\\b`) });

test("the sign-in page shows its form", async ({ page }) => {
  const errors = watchForErrors(page);
  const response = await page.goto("/login", { waitUntil: "load" });

  expect(response?.status(), "the page answers").toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(field(page, "Email")).toBeEditable();
  await expect(field(page, "Password")).toBeEditable();
  await expect(page.getByRole("button", { name: "Log in" })).toBeEnabled();
  expect(errors(), "no error on the page").toEqual([]);
});

test("the sign-up page shows its form", async ({ page }) => {
  const errors = watchForErrors(page);
  const response = await page.goto("/signup", { waitUntil: "load" });

  expect(response?.status(), "the page answers").toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(field(page, "Full name")).toBeEditable();
  await expect(field(page, "Email")).toBeEditable();
  await expect(field(page, "Password")).toBeEditable();
  await expect(field(page, "Confirm password")).toBeEditable();
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
  expect(errors(), "no error on the page").toEqual([]);
});

test("an app address sends a signed-out visitor to sign-in", async ({
  page,
}) => {
  await page.goto("/settings/usage", { waitUntil: "load" });

  const url = new URL(page.url());
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("callbackUrl")).toBe("/settings/usage");
  await expect(field(page, "Email")).toBeEditable();
});
