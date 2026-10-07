/**
 * Linking Google or GitHub from the settings is marked for the login record (C13b, rext-control#618).
 * The mark names its provider and is taken once. An old mark, a mark for another provider, or one
 * cleared by the login and sign-up buttons doesn't count, so an abandoned link can't hide a real
 * sign-in.
 */

import {
  clearOAuthLinking,
  markOAuthLinking,
  takeOAuthLinking,
} from "@/lib/analytics";

beforeEach(() => window.sessionStorage.clear());
afterEach(() => jest.restoreAllMocks());

it("is true once, for the provider the link button marked", () => {
  markOAuthLinking("google");
  expect(takeOAuthLinking("google")).toBe(true);
  expect(takeOAuthLinking("google")).toBe(false);
});

it("is false for another provider's login, and the mark is gone after it", () => {
  markOAuthLinking("github");
  expect(takeOAuthLinking("google")).toBe(false);
  expect(takeOAuthLinking("github")).toBe(false);
});

it("is false after the login and sign-up buttons clear it", () => {
  markOAuthLinking("google");
  clearOAuthLinking();
  expect(takeOAuthLinking("google")).toBe(false);
});

it("is false without a mark, or with an unreadable one", () => {
  expect(takeOAuthLinking("google")).toBe(false);
  window.sessionStorage.setItem("rext-oauth-linking", "1696000000000");
  expect(takeOAuthLinking("google")).toBe(false);
});

it("ignores a mark older than ten minutes", () => {
  const now = Date.now();
  jest.spyOn(Date, "now").mockReturnValue(now - 11 * 60 * 1000);
  markOAuthLinking("google");
  jest.spyOn(Date, "now").mockReturnValue(now);
  expect(takeOAuthLinking("google")).toBe(false);
});
