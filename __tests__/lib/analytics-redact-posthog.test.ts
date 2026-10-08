/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/reset-password?token=entry-secret&utm_source=email"}
 */

/**
 * What posthog-js itself attaches to an event, run through the dashboard's redaction (D20,
 * rext-control#541). The redaction's own tests list the properties known to hold an address; this
 * one runs the real library, so a property a posthog-js upgrade adds is caught too, as
 * $session_entry_url was missing from that list once. A recorder after the redaction keeps each event
 * and drops it, so nothing is sent.
 */

import posthog, { type CaptureResult, type PostHogConfig } from "posthog-js";
import {
  redactEventUrls,
  redactStoredAddresses,
  STORED_ADDRESS_OPTIONS,
  VISITOR_STORE_OPTIONS,
} from "@/lib/analytics-redact";

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

describe("what posthog-js keeps in the browser", () => {
  // Everything the browser keeps: posthog-js writes to the tab's session storage as well, and
  // to its cookie for rext.ai, whose value is percent-encoded.
  const stored = () =>
    [
      ...[window.localStorage, window.sessionStorage].flatMap((store) =>
        Object.keys(store).map((key) => store.getItem(key)),
      ),
      decodeURIComponent(document.cookie),
    ].join("\n");

  function start(name: string, redact: boolean) {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const part of document.cookie.split(";")) {
      const cookie = part.trim().split("=")[0];
      for (const domain of ["", "; Domain=.rext.ai"]) {
        // biome-ignore lint/suspicious/noDocumentCookie: the test's own reset of the browser
        if (cookie) document.cookie = `${cookie}=; Max-Age=0; Path=/${domain}`;
      }
    }
    const client = posthog.init(
      "phc_test_not_a_real_key",
      {
        api_host: "http://127.0.0.1:9", // never reached: every event is dropped
        // As the provider does it.
        ...VISITOR_STORE_OPTIONS,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        advanced_disable_flags: true,
        before_send: () => null,
        // As the provider does it.
        ...(redact ? STORED_ADDRESS_OPTIONS : {}),
      },
      name,
    );
    if (!client) throw new Error("posthog-js didn't start");
    if (redact) {
      // As the provider does it.
      redactStoredAddresses(client);
      client.onSessionId(() => redactStoredAddresses(client));
    }
    // The first event begins the session, whose entry address and referrer are stored.
    client.capture("$pageview");
    return client;
  }

  it("holds no emailed link's token: not the first address, not its referrer", () => {
    start("stored-redacted", true);

    const kept = stored();
    expect(kept).toContain("reset-password");
    for (const secret of SECRETS) expect(kept).not.toContain(secret);
  });

  it("would hold them without the redaction (so the test above can see a leak)", () => {
    start("stored-raw", false);

    const kept = stored();
    for (const secret of SECRETS) expect(kept).toContain(secret);
  });
});
