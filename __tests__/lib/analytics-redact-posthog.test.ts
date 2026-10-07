/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/reset-password?token=entry-secret&utm_source=email"}
 */

/**
 * What posthog-js itself attaches to an event, run through the dashboard's redaction (D20,
 * rext-control#541). The redaction's own tests list the properties known to hold an address; this
 * one runs the real library, so a property a posthog-js upgrade adds is caught too ($session_entry_url
 * was found that way, Codex on revnix/rext-admin#601). A recorder after the redaction keeps each event
 * and drops it, so nothing is sent.
 */

import posthog, { type CaptureResult, type PostHogConfig } from "posthog-js";
import { redactEventUrls } from "@/lib/analytics-redact";

const SECRETS = ["entry-secret", "referrer-secret"];

function recordEvents(
  name: string,
  redact: boolean,
): {
  client: NonNullable<ReturnType<typeof posthog.init>>;
  seen: CaptureResult[];
} {
  const seen: CaptureResult[] = [];
  const record = (event: CaptureResult | null) => {
    if (event) seen.push(event);
    return null;
  };
  const config: Partial<PostHogConfig> = {
    api_host: "http://127.0.0.1:9", // never reached: the recorder drops every event
    persistence: "memory",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    advanced_disable_flags: true,
    before_send: redact ? [redactEventUrls, record] : record,
  };
  const client = posthog.init("phc_test_not_a_real_key", config, name);
  if (!client) throw new Error("posthog-js didn't start");
  return { client, seen };
}

beforeAll(() => {
  // A session that began on an emailed link, opened from another emailed link.
  Object.defineProperty(document, "referrer", {
    value: "https://app.rext.ai/verify-email?token=referrer-secret",
    configurable: true,
  });
});

describe("posthog-js's own event properties", () => {
  it("carry no emailed link's token once redacted", () => {
    const { client, seen } = recordEvents("redacted", true);

    client.capture("$pageview");
    client.capture("signup_started");
    client.identify("user-1", { plan: "trial" });
    client.capture("workspace_created");

    expect(seen.length).toBeGreaterThanOrEqual(3);
    for (const event of seen) {
      const sent = JSON.stringify(event);
      for (const secret of SECRETS) expect(sent).not.toContain(secret);
    }
    // The address properties are still there, with the rest of the address intact.
    const pageview = seen[0].properties;
    expect(pageview.$current_url).toBe(
      "https://app.rext.ai/reset-password?token=redacted&utm_source=email",
    );
    expect(pageview.$session_entry_url).toBe(pageview.$current_url);
    expect(pageview.$referrer).toBe(
      "https://app.rext.ai/verify-email?token=redacted",
    );
  });

  it("would carry the tokens without the redaction (so the test above can see a leak)", () => {
    const { client, seen } = recordEvents("raw", false);

    client.capture("$pageview");

    const sent = JSON.stringify(seen);
    for (const secret of SECRETS) expect(sent).toContain(secret);
  });
});
