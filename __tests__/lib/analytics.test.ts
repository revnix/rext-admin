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
    registerPostHog({ capture, reset: jest.fn() });

    analytics.track("email_verified");
    analytics.track("checkout_started", { plan_name: "Pro" });

    expect(capture).toHaveBeenNthCalledWith(1, "email_verified", {});
    expect(capture).toHaveBeenNthCalledWith(2, "checkout_started", {
      plan_name: "Pro",
    });
    expect(JSON.stringify(capture.mock.calls)).not.toContain("secret-1");
  });

  it("sends an event of someone leaving with its way of sending, and any other with none", () => {
    const { analytics, registerPostHog } = loadAnalytics();
    const capture = jest.fn();
    registerPostHog({ capture, reset: jest.fn() });

    analytics.track("workspace_wait_started", { with_website: true });
    analytics.track(
      "workspace_wait_left",
      { seconds: 30, stage: "voice", with_website: true },
      { leaving: true },
    );

    expect(capture.mock.calls).toEqual([
      ["workspace_wait_started", { with_website: true }],
      [
        "workspace_wait_left",
        { seconds: 30, stage: "voice", with_website: true },
        { leaving: true },
      ],
    ]);
  });

  it("keeps the way of sending for an event held until the person's answer is known", () => {
    const { analytics, registerPostHog } = loadAnalytics();
    analytics.track(
      "workspace_wait_left",
      { seconds: 5, stage: "reading", with_website: true },
      { leaving: true },
    );
    const capture = jest.fn();
    registerPostHog({ capture, reset: jest.fn() });

    expect(capture).toHaveBeenCalledWith(
      "workspace_wait_left",
      { seconds: 5, stage: "reading", with_website: true },
      { leaving: true },
    );
  });

  it("says whether the event was taken: sent or held, and not after a no or while acting as a customer", () => {
    const { analytics, registerPostHog, unregisterPostHog, setImpersonating } =
      loadAnalytics();

    // Held, while the person's answer isn't known.
    expect(analytics.track("email_verified")).toBe(true);

    registerPostHog({ capture: jest.fn(), reset: jest.fn() });
    expect(analytics.track("email_verified")).toBe(true);

    setImpersonating(true);
    expect(analytics.track("email_verified")).toBe(false);
    setImpersonating(false);

    unregisterPostHog();
    expect(analytics.track("email_verified")).toBe(false);
  });

  it("keeps no copy of an event in the browser", () => {
    const { analytics, registerPostHog } = loadAnalytics();
    registerPostHog({ capture: jest.fn(), reset: jest.fn() });

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

describe("before the person's answer on analytics is known", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("holds events and sends them, in order, once analytics is allowed", () => {
    const { analytics, registerPostHog } = loadAnalytics();
    const capture = jest.fn();

    analytics.track("user_signed_in", { method: "credentials" });
    analytics.track("workspace_created");
    expect(capture).not.toHaveBeenCalled();

    registerPostHog({ capture, reset: jest.fn() });

    expect(capture.mock.calls).toEqual([
      ["user_signed_in", { method: "credentials" }],
      ["workspace_created", {}],
    ]);
  });

  it("sends none of them after a no, then or later", () => {
    const { analytics, registerPostHog, unregisterPostHog } = loadAnalytics();
    const capture = jest.fn();

    analytics.track("user_signed_in");
    unregisterPostHog();
    registerPostHog({ capture, reset: jest.fn() });

    expect(capture).not.toHaveBeenCalled();
  });

  it("holds nothing while the answer is no, so a later yes sends only what follows it", () => {
    const { analytics, registerPostHog, unregisterPostHog } = loadAnalytics();
    const capture = jest.fn();

    unregisterPostHog();
    analytics.track("keyword_selected", { keyword: "crm" });
    registerPostHog({ capture, reset: jest.fn() });
    analytics.track("title_selected");

    expect(capture.mock.calls).toEqual([["title_selected", {}]]);
  });

  it("holds a hundred at most", () => {
    const { analytics, registerPostHog } = loadAnalytics();
    const capture = jest.fn();

    for (let i = 0; i < 130; i++) analytics.track("title_selected");
    registerPostHog({ capture, reset: jest.fn() });

    expect(capture).toHaveBeenCalledTimes(100);
  });
});

describe("while an admin acts as a customer", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sends nothing, and holds nothing to send later", () => {
    const { analytics, registerPostHog, setImpersonating, isImpersonating } =
      loadAnalytics();
    const capture = jest.fn();
    registerPostHog({ capture, reset: jest.fn() });

    setImpersonating(true);
    analytics.track("keyword_selected", { keyword: "crm" });
    expect(isImpersonating()).toBe(true);
    expect(capture).not.toHaveBeenCalled();

    setImpersonating(false);
    analytics.track("title_selected");
    expect(capture.mock.calls).toEqual([["title_selected", {}]]);
  });

  it("still sends nothing when the browser refuses storage", () => {
    const { analytics, registerPostHog, setImpersonating, isImpersonating } =
      loadAnalytics();
    const capture = jest.fn();
    registerPostHog({ capture, reset: jest.fn() });
    const refuse = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage is blocked");
      });
    const refuseRead = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("storage is blocked");
      });

    try {
      setImpersonating(true);
      analytics.track("keyword_selected");

      expect(isImpersonating()).toBe(true);
      expect(capture).not.toHaveBeenCalled();
    } finally {
      refuse.mockRestore();
      refuseRead.mockRestore();
    }
  });

  it("is known to a tab opened meanwhile, from the mark the app's tabs share", () => {
    window.localStorage.setItem("rext-impersonating", "1");

    const { isImpersonating } = loadAnalytics();

    expect(isImpersonating()).toBe(true);
  });
});
