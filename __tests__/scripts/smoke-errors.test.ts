import { isOurs, tidy, whose } from "@/e2e/smoke/errors";

// What the smoke test counts as an error of ours (task FB2.34). On 2026-10-08 a production deploy
// went red because the sign-up page logged one console line about PostHog's script being refused by
// the content policy: another company's host, and nothing wrong with the page.

const APP = "https://app.rext.ai";

describe("whose a console error is", () => {
  it("is theirs when the policy refuses another company's script", () => {
    const line =
      "Loading the script 'https://eu-assets.i.posthog.com/array/phc_AbCdEfGhIjKlMnOpQrStUvWxYz012345/config.js' violates the following Content Security Policy directive: \"script-src 'self' https://app.lemonsqueezy.com https://*.crisp.chat\".";

    expect(whose(line, APP)).toBe("theirs");
  });

  it("is theirs for the host's own toolbar on a preview", () => {
    expect(
      whose(
        "Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' violates the following Content Security Policy directive: \"script-src 'self'\".",
        "https://staging.rext.ai",
      ),
    ).toBe("theirs");
  });

  it("is ours when the policy refuses something of our own", () => {
    expect(
      whose(
        "Refused to connect to 'https://api.rext.ai/api/v1/plans' because it violates the following Content Security Policy directive: \"connect-src 'self' https://eu.i.posthog.com\".",
        APP,
      ),
    ).toBe("ours");
  });

  it("is ours when our own code logs an error, with or without an address", () => {
    expect(whose("TypeError: plans.map is not a function", APP)).toBe("ours");
    expect(
      whose(
        "Hydration failed at https://app.rext.ai/_next/static/chunks/a.js",
        APP,
      ),
    ).toBe("ours");
    // One of ours beside one of theirs: still ours.
    expect(
      whose(
        "Failed to send https://eu.i.posthog.com/e/ from https://app.rext.ai/login",
        APP,
      ),
    ).toBe("ours");
  });

  it("leaves the browser's line for a failed request to the request's own check", () => {
    expect(
      whose(
        "Failed to load resource: the server responded with a status of 401 ()",
        APP,
      ),
    ).toBe("noise");
  });
});

describe("which hosts are ours", () => {
  it.each([
    ["app.rext.ai", APP, true],
    ["api.rext.ai", APP, true],
    ["staging-api.rext.ai", "https://staging.rext.ai", true],
    ["eu.i.posthog.com", APP, false],
    ["rext.ai.evil.test", APP, false],
    ["notrext.ai", APP, false],
    ["localhost", "http://localhost:3202", true],
    ["evil.localhost", "http://localhost:3202", false],
  ])("%s seen from %s: %s", (host, base, ours) => {
    expect(isOurs(host, base)).toBe(ours);
  });
});

describe("what is printed", () => {
  it("cuts an address to its host and path, without keys or queries", () => {
    expect(
      tidy(
        "Loading the script 'https://eu-assets.i.posthog.com/array/phc_AbCdEfGhIjKlMnOpQrStUvWxYz012345/config.js?ip=1&token=abc' was refused",
      ),
    ).toBe(
      "Loading the script 'https://eu-assets.i.posthog.com/array/…/config.js' was refused",
    );
    expect(tidy("at https://app.rext.ai/")).toBe("at https://app.rext.ai");
  });

  it("keeps a message short", () => {
    expect(tidy("x".repeat(1000))).toHaveLength(300);
  });
});
