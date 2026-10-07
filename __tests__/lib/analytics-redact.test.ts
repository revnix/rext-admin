/**
 * Analytics never receives an emailed link's credential or a sign-in page's email (D20,
 * rext-control#541): the token in /unsubscribe, /verify-email, /reset-password or an invitation's link is the
 * proof those pages' endpoints accept.
 */

import {
  anonymousAddress,
  anonymousEvent,
  redactEventUrls,
  redactUrl,
} from "@/lib/analytics-redact";

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

  it("replaces any parameter whose name ends in token: an invitation's, an OAuth provider's", () => {
    const redacted = redactUrl(
      "https://app.rext.ai/signup?invitation_token=inv-1&Access_Token=at-1&ref=pricing",
    );

    expect(redacted).not.toContain("inv-1");
    expect(redacted).not.toContain("at-1");
    expect(redacted).toContain("ref=pricing");
  });

  it("leaves an address without secrets, and anything that isn't an address, as it was", () => {
    expect(redactUrl("https://app.rext.ai/w/acme?tab=all")).toBe(
      "https://app.rext.ai/w/acme?tab=all",
    );
    expect(redactUrl("not a url")).toBe("not a url");
  });
});

describe("redactEventUrls", () => {
  it("redacts an address an event of ours carries as url", () => {
    const event = {
      properties: { url: "https://app.rext.ai/verify-email?token=t9" },
    };

    redactEventUrls(event);

    expect(event.properties.url).toBe(
      "https://app.rext.ai/verify-email?token=redacted",
    );
  });

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

describe("anonymousAddress", () => {
  it("keeps the kind of page and drops whose it is", () => {
    expect(
      anonymousAddress(
        "https://app.rext.ai/w/acme/content/6f1c2d3e-0000-4000-8000-123456789abc?tab=seo#top",
      ),
    ).toBe("https://app.rext.ai/w/:workspace/content/:id");
    expect(
      anonymousAddress(
        "https://app.rext.ai/w/acme/keywords/best%20crm%20software",
      ),
    ).toBe("https://app.rext.ai/w/:workspace/keywords/:keyword");
    expect(anonymousAddress("/w/acme/generate-content?thread=abc")).toBe(
      "/w/:workspace/generate-content",
    );
  });

  it("leaves a page that names nobody as it is, without its query", () => {
    expect(anonymousAddress("https://app.rext.ai/w/create")).toBe(
      "https://app.rext.ai/w/create",
    );
    expect(anonymousAddress("https://app.rext.ai/settings/data?x=1")).toBe(
      "https://app.rext.ai/settings/data",
    );
    expect(anonymousAddress("https://app.rext.ai/w/acme/personas/create")).toBe(
      "https://app.rext.ai/w/:workspace/personas/create",
    );
  });

  it("leaves anything that isn't an address alone", () => {
    expect(anonymousAddress("$direct")).toBe("$direct");
  });
});

describe("anonymousEvent", () => {
  it("keeps a page view with its addresses as routes and nothing about the person", () => {
    const event = {
      event: "$pageview",
      properties: {
        $current_url: "https://app.rext.ai/w/acme/content?q=mary",
        $pathname: "/w/acme/content",
        $session_entry_url: "https://app.rext.ai/w/acme",
        $browser: "Chrome",
        $set: { email: "mary@example.com" },
      },
      $set: { email: "mary@example.com" },
      $set_once: { $initial_current_url: "https://app.rext.ai/w/acme" },
    };

    const kept = anonymousEvent(event);

    expect(kept).not.toBeNull();
    expect(JSON.stringify(kept)).not.toContain("acme");
    expect(JSON.stringify(kept)).not.toContain("mary");
    expect(event.properties.$current_url).toBe(
      "https://app.rext.ai/w/:workspace/content",
    );
    expect(event.properties.$pathname).toBe("/w/:workspace/content");
    expect(event.properties.$browser).toBe("Chrome");
  });

  it("drops every other event", () => {
    expect(
      anonymousEvent({ event: "keyword_selected", properties: {} }),
    ).toBeNull();
    expect(anonymousEvent({ event: "$identify", properties: {} })).toBeNull();
  });
});
