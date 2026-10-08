/**
 * Analytics never receives an emailed link's credential or a sign-in page's email (D20,
 * rext-control#541): the token in /unsubscribe, /verify-email, /reset-password or an invitation's link is the
 * proof those pages' endpoints accept.
 */

import {
  anonymousEvent,
  anonymousRoute,
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

describe("redactEventUrls, on a heatmap event", () => {
  it("redacts the addresses the clicks are listed under", () => {
    const event = {
      event: "$$heatmap",
      properties: {
        $heatmap_data: {
          "https://app.rext.ai/login?email=mary%40example.com&invitation_token=abc123":
            [{ x: 10, y: 20, target_fixed: false, type: "click" }],
          "https://app.rext.ai/w/acme/content": [
            { x: 5, y: 6, target_fixed: false, type: "click" },
          ],
        },
      },
    };

    redactEventUrls(event);

    const sent = JSON.stringify(event);
    expect(sent).not.toContain("abc123");
    expect(sent).not.toContain("mary");
    expect(Object.keys(event.properties.$heatmap_data)).toEqual([
      "https://app.rext.ai/login?email=redacted&invitation_token=redacted",
      "https://app.rext.ai/w/acme/content",
    ]);
    // The clicks themselves are untouched.
    expect(
      event.properties.$heatmap_data["https://app.rext.ai/w/acme/content"],
    ).toEqual([{ x: 5, y: 6, target_fixed: false, type: "click" }]);
  });

  it("keeps the clicks of two addresses that become the same one", () => {
    const event = {
      event: "$$heatmap",
      properties: {
        $heatmap_data: {
          "https://app.rext.ai/reset-password?token=one": [{ x: 1, y: 1 }],
          "https://app.rext.ai/reset-password?token=two": [{ x: 2, y: 2 }],
        } as Record<string, unknown[]>,
      },
    };

    redactEventUrls(event);

    expect(event.properties.$heatmap_data).toEqual({
      "https://app.rext.ai/reset-password?token=redacted": [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
    });
  });

  it("leaves an event without heatmap data as it was", () => {
    const event = { event: "title_selected", properties: { thread_id: "t1" } };
    expect(redactEventUrls(event)).toEqual({
      event: "title_selected",
      properties: { thread_id: "t1" },
    });
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

describe("anonymousRoute", () => {
  it("names every dynamic part of the path instead of filling it in", () => {
    expect(
      anonymousRoute("/w/acme/content/6f1c2d3e", {
        workspaceSlug: "acme",
        id: "6f1c2d3e",
      }),
    ).toBe("/w/:workspaceSlug/content/:id");
    // The editor's own route, which names the workspace outside /w.
    expect(
      anonymousRoute("/edit/acme/6f1c2d3e", {
        workspaceSlug: "acme",
        id: "6f1c2d3e",
      }),
    ).toBe("/edit/:workspaceSlug/:id");
  });

  it("keeps the fixed parts, so each kind of page is counted as itself", () => {
    expect(
      anonymousRoute("/w/acme/content/calendar", { workspaceSlug: "acme" }),
    ).toBe("/w/:workspaceSlug/content/calendar");
    expect(anonymousRoute("/settings/data", {})).toBe("/settings/data");
  });

  it("finds a parameter whether the path or the parameter is the encoded one", () => {
    expect(
      anonymousRoute("/w/acme/keywords/best%20crm%20software", {
        workspaceSlug: "acme",
        key: "best crm software",
      }),
    ).toBe("/w/:workspaceSlug/keywords/:key");
    expect(
      anonymousRoute("/w/acme/keywords/best%20crm", {
        workspaceSlug: "acme",
        key: "best%20crm",
      }),
    ).toBe("/w/:workspaceSlug/keywords/:key");
  });

  it("names each part of a catch-all", () => {
    expect(anonymousRoute("/docs/a/b", { path: ["a", "b"] })).toBe(
      "/docs/:path/:path",
    );
  });
});

describe("anonymousEvent", () => {
  const route = "/w/:workspaceSlug/content";

  it("keeps a page view with the page's route and nothing about the person", () => {
    const event = {
      event: "$pageview",
      properties: {
        $current_url: "https://app.rext.ai/w/acme/content?q=mary",
        $pathname: "/w/acme/content",
        $host: "app.rext.ai",
        $session_entry_url: "https://app.rext.ai/w/acme",
        $session_entry_pathname: "/w/acme",
        $referrer: "https://app.rext.ai/w/acme/keywords/crm",
        $browser: "Chrome",
        $set: { email: "mary@example.com" },
      },
      $set: { email: "mary@example.com" },
      $set_once: { $initial_current_url: "https://app.rext.ai/w/acme" },
    };

    const kept = anonymousEvent(event, route);

    expect(kept).not.toBeNull();
    expect(JSON.stringify(kept)).not.toContain("acme");
    expect(JSON.stringify(kept)).not.toContain("mary");
    expect(kept?.properties).toEqual({
      $current_url: "https://app.rext.ai/w/:workspaceSlug/content",
      $pathname: route,
      $host: "app.rext.ai",
      $browser: "Chrome",
    });
  });

  it("drops every other event, and a page view whose route isn't known", () => {
    expect(
      anonymousEvent({ event: "keyword_selected", properties: {} }, route),
    ).toBeNull();
    expect(
      anonymousEvent({ event: "$identify", properties: {} }, route),
    ).toBeNull();
    expect(
      anonymousEvent({ event: "$pageview", properties: {} }, null),
    ).toBeNull();
  });
});
