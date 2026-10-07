/**
 * Analytics never receives an emailed link's credential or a sign-in page's email (D20,
 * rext-control#541): the token in /unsubscribe, /verify-email, /reset-password or an invitation's link is the
 * proof those pages' endpoints accept.
 */

import { redactEventUrls, redactUrl } from "@/lib/analytics-redact";

describe("redactUrl", () => {
  it("replaces a link's token and keeps the rest of the address", () => {
    expect(
      redactUrl(
        "https://app.rext.ai/unsubscribe?token=abc123&utm_source=email",
      ),
    ).toBe("https://app.rext.ai/unsubscribe?token=redacted&utm_source=email");
  });

  it("replaces an email, an OAuth code and state, whatever their case", () => {
    const redacted = redactUrl(
      "https://app.rext.ai/login?Email=mary%40example.com&code=xyz&state=s1",
    );

    expect(redacted).not.toContain("mary");
    expect(redacted).not.toContain("xyz");
    expect(redacted).not.toContain("s1");
  });

  it("leaves an address without secrets, and anything that isn't an address, as it was", () => {
    expect(redactUrl("https://app.rext.ai/w/acme?tab=all")).toBe(
      "https://app.rext.ai/w/acme?tab=all",
    );
    expect(redactUrl("not a url")).toBe("not a url");
  });
});

describe("redactEventUrls", () => {
  it("redacts the addresses PostHog puts in an event, its $set and its $set_once", () => {
    const event = {
      properties: {
        $current_url: "https://app.rext.ai/verify-email?token=t1",
        $referrer: "https://app.rext.ai/reset-password?token=t2",
        other: "https://app.rext.ai/unsubscribe?token=kept-elsewhere",
      },
      $set_once: {
        $initial_current_url: "https://app.rext.ai/unsubscribe?token=t3",
      },
    };

    redactEventUrls(event);

    expect(event.properties.$current_url).toBe(
      "https://app.rext.ai/verify-email?token=redacted",
    );
    expect(event.properties.$referrer).toBe(
      "https://app.rext.ai/reset-password?token=redacted",
    );
    expect(event.$set_once.$initial_current_url).toBe(
      "https://app.rext.ai/unsubscribe?token=redacted",
    );
    // Only the address properties are rewritten.
    expect(event.properties.other).toContain("kept-elsewhere");
  });

  it("redacts every address property, the session's entry address included", () => {
    // A session that began on an emailed link carries that address on every event it sends.
    for (const key of [
      "$current_url",
      "$referrer",
      "$initial_current_url",
      "$initial_referrer",
      "$session_entry_url",
      "$session_entry_referrer",
    ]) {
      const event = {
        properties: { [key]: "https://app.rext.ai/unsubscribe?token=t4" },
        $set: { [key]: "https://app.rext.ai/verify-email?token=t5" },
      };

      redactEventUrls(event);

      expect(event.properties[key]).toBe(
        "https://app.rext.ai/unsubscribe?token=redacted",
      );
      expect(event.$set[key]).toBe(
        "https://app.rext.ai/verify-email?token=redacted",
      );
    }
  });

  it("passes a dropped event through", () => {
    expect(redactEventUrls(null)).toBeNull();
  });
});
