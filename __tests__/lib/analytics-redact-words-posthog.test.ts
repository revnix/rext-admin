/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme/keywords/best%20crm%20for%20dentists?q=mary%20smith&library=best%20crm%20for%20dentists"}
 */

/**
 * What posthog-js itself attaches to an event on a page whose address holds a keyword and a
 * search text, run through the dashboard's redaction (rext-control#942). The redaction's own
 * tests list the properties known to hold an address or a path; this one runs the real library,
 * so a property a posthog-js upgrade adds is caught too. A recorder after the redaction keeps
 * each event and drops it, so nothing is sent.
 */

import posthog, { type CaptureResult, type PostHogConfig } from "posthog-js";
import {
  redactEventUrls,
  redactStoredAddresses,
  STORED_ADDRESS_OPTIONS,
} from "@/lib/analytics-redact";

// The keyword and the search text, as an address or a path can spell them.
const WRITTEN = [
  "dentists",
  "mary",
  "smith",
  "best%20crm",
  "best crm",
  "best+crm",
];

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
    ...STORED_ADDRESS_OPTIONS,
    before_send: redact ? [redactEventUrls, record] : record,
  };
  const client = posthog.init("phc_test_not_a_real_key", config, name);
  if (!client) throw new Error("posthog-js didn't start");
  // As the provider does when the library starts: what it has stored of the first address.
  if (redact) redactStoredAddresses(client);
  return { client, seen };
}

beforeAll(() => {
  // The page before this one was a keyword's page too.
  Object.defineProperty(document, "referrer", {
    value: "https://app.rext.ai/w/acme/keywords/best%20crm%20for%20dentists",
    configurable: true,
  });
});

describe("posthog-js's own event properties, on a page whose address holds a person's words", () => {
  it("carry neither the keyword nor the search text once redacted", () => {
    const { client, seen } = recordEvents("words-redacted", true);

    client.capture("$pageview");
    client.capture("keyword_selected");
    client.identify("user-1", { plan: "trial" });
    client.capture("content_generation_started");

    expect(seen.length).toBeGreaterThanOrEqual(3);
    for (const event of seen) {
      const sent = JSON.stringify(event);
      for (const written of WRITTEN) expect(sent).not.toContain(written);
    }
    // The address is still there, saying which page it was and whose workspace.
    expect(seen[0].properties.$current_url).toBe(
      "https://app.rext.ai/w/acme/keywords/*?q=redacted&library=redacted",
    );
    expect(seen[0].properties.$pathname).toBe("/w/acme/keywords/*");
  });

  it("would carry them without the redaction (so the test above can see a leak)", () => {
    const { client, seen } = recordEvents("words-raw", false);

    client.capture("$pageview");

    const sent = JSON.stringify(seen);
    expect(sent).toContain("dentists");
    expect(sent).toContain("mary");
  });
});
