/**
 * Linking Google or GitHub from the settings is marked for the login record (C13b, rext-control#618):
 * the mark is taken once, and an old one, from a link that was abandoned, doesn't count.
 */

import { markOAuthLinking, takeOAuthLinking } from "@/lib/analytics";

beforeEach(() => window.sessionStorage.clear());
afterEach(() => jest.restoreAllMocks());

it("is true once after the link button marks it", () => {
  markOAuthLinking();
  expect(takeOAuthLinking()).toBe(true);
  expect(takeOAuthLinking()).toBe(false);
});

it("is false without a mark", () => {
  expect(takeOAuthLinking()).toBe(false);
});

it("ignores a mark older than ten minutes", () => {
  const now = Date.now();
  jest.spyOn(Date, "now").mockReturnValue(now - 11 * 60 * 1000);
  markOAuthLinking();
  jest.spyOn(Date, "now").mockReturnValue(now);
  expect(takeOAuthLinking()).toBe(false);
});
