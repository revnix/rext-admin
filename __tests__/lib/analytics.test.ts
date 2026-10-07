/**
 * What an event of ours carries (FB2.31, rext-control task 712): the caller's properties and nothing
 * else. The page's address is PostHog's to add, redacted; a raw copy of it once rode on every event
 * and sat in the browser's storage, with an emailed link's token or a sign-in page's email in it.
 */

const LEGACY_KEY = "wrext_analytics_events";

/** A fresh copy of the module, as a page load makes one. */
function loadAnalytics(): typeof import("@/lib/analytics") {
  const fresh: { module?: typeof import("@/lib/analytics") } = {};
  jest.isolateModules(() => {
    fresh.module = require("@/lib/analytics");
  });
  if (!fresh.module) throw new Error("the analytics module did not load");
  return fresh.module;
}

describe("analytics.track", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/verify-email?token=secret-1");
  });

  it("sends the caller's properties only: no address, time or user id of its own", () => {
    const { analytics, registerPostHog } = loadAnalytics();
    const capture = jest.fn();
    registerPostHog({ identify: jest.fn(), capture, reset: jest.fn() });

    analytics.track("email_verified");
    analytics.track("checkout_started", { plan_name: "Pro" });

    expect(capture).toHaveBeenNthCalledWith(1, "email_verified", {});
    expect(capture).toHaveBeenNthCalledWith(2, "checkout_started", {
      plan_name: "Pro",
    });
    expect(JSON.stringify(capture.mock.calls)).not.toContain("secret-1");
  });

  it("keeps no copy of an event in the browser", () => {
    const { analytics, registerPostHog } = loadAnalytics();
    registerPostHog({
      identify: jest.fn(),
      capture: jest.fn(),
      reset: jest.fn(),
    });

    analytics.track("email_verified");

    expect(window.localStorage.length).toBe(0);
  });

  it("deletes the copy an earlier version kept, when the app loads", () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([{ properties: { url: "/verify-email?token=old" } }]),
    );

    loadAnalytics();

    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
  });
});
