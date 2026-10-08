/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme-dental/content/6f1c?token=entry-secret"}
 */

/**
 * A page's measures of speed as posthog-js itself sends them, run through the dashboard's address
 * redaction and its cleaning (rext-control task 898). The cleaning's own tests name the parts a
 * measure is known to have; this one runs the real library, so a part a posthog-js upgrade adds
 * is caught too. jsdom measures nothing, so the four measures are handed to the library as the
 * browser's own piece would hand them. A recorder at the end keeps each event and drops it, so
 * nothing is sent.
 */

import posthog, { type CaptureResult, type PostHogConfig } from "posthog-js";
import { redactEventUrls } from "@/lib/analytics-redact";
import {
  WEB_VITALS_OPTIONS,
  webVitalsNumbers,
} from "@/lib/analytics-web-vitals";

type Report = (metric: Record<string, unknown>) => void;
type Measure = "LCP" | "CLS" | "FCP" | "INP";

// Whoever asked to be told of each measure: the library, once it starts.
const told: Record<Measure, Report[]> = { LCP: [], CLS: [], FCP: [], INP: [] };

beforeAll(() => {
  const callbacks = {
    onLCP: (report: Report) => told.LCP.push(report),
    onCLS: (report: Report) => told.CLS.push(report),
    onFCP: (report: Report) => told.FCP.push(report),
    onINP: (report: Report) => told.INP.push(report),
  };
  // Where the piece the app ships (posthog-js/dist/web-vitals) puts its own.
  const page = window as unknown as {
    __PosthogExtensions__?: Record<string, unknown>;
  };
  page.__PosthogExtensions__ = page.__PosthogExtensions__ ?? {};
  page.__PosthogExtensions__.postHogWebVitalsCallbacksByFlavor = {
    "web-vitals": callbacks,
  };
  page.__PosthogExtensions__.postHogWebVitalsCallbacks = callbacks;
});

function recordEvents(name: string, clean: boolean): CaptureResult[] {
  const seen: CaptureResult[] = [];
  const record = (event: CaptureResult | null) => {
    if (event) seen.push(event);
    return null;
  };
  const cleaned = (event: CaptureResult | null) =>
    event ? webVitalsNumbers(event) : event;
  const config: Partial<PostHogConfig> = {
    api_host: "http://127.0.0.1:9", // never reached: the recorder drops every event
    persistence: "memory",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    advanced_disable_flags: true,
    // As the provider has it: off at the start, and started by name.
    capture_performance: { web_vitals: false },
    before_send: clean
      ? [redactEventUrls, cleaned, record]
      : [redactEventUrls, record],
  };
  const client = posthog.init("phc_test_not_a_real_key", config, name);
  if (!client) throw new Error("posthog-js didn't start");
  for (const measure of Object.keys(told) as Measure[]) told[measure] = [];
  client.set_config({ capture_performance: WEB_VITALS_OPTIONS });
  client.webVitalsAutocapture?.startIfEnabled();
  return seen;
}

/** The four measures of one page, as the browser's piece reports them. */
function measureThePage(): void {
  const measure = (name: Measure, value: number, rating: string) => {
    for (const report of told[name]) {
      report({
        name,
        value,
        delta: value,
        id: `v4-1700000000000-${name}`,
        rating,
        navigationType: "navigate",
        entries: [{ url: "https://cdn.example/cover-of-acme.png" }],
      });
    }
  };
  measure("FCP", 420, "good");
  measure("LCP", 1834.5, "good");
  measure("CLS", 0.02, "good");
  measure("INP", 320, "needs-improvement");
}

describe("posthog-js's own event for a page's measures", () => {
  it("leaves with the four numbers, their ratings and the address's shape", () => {
    const seen = recordEvents("measured", true);

    measureThePage();

    expect(seen).toHaveLength(1);
    expect(seen[0].event).toBe("$web_vitals");
    const sent = seen[0].properties;
    expect(sent.$web_vitals_LCP_value).toBe(1834.5);
    expect(sent.$web_vitals_LCP_event).toEqual({
      name: "LCP",
      value: 1834.5,
      delta: 1834.5,
      rating: "good",
      navigationType: "navigate",
    });
    expect(sent.$web_vitals_INP_event).toEqual({
      name: "INP",
      value: 320,
      delta: 320,
      rating: "needs-improvement",
      navigationType: "navigate",
    });
    expect(sent.route).toBe("/w/*/content/*");
    expect(sent.loaded_route).toBe("/w/*/content/*");
    expect(
      Object.keys(sent)
        .filter((key) => key.startsWith("$web_vitals"))
        .sort(),
    ).toEqual([
      "$web_vitals_CLS_event",
      "$web_vitals_CLS_value",
      "$web_vitals_FCP_event",
      "$web_vitals_FCP_value",
      "$web_vitals_INP_event",
      "$web_vitals_INP_value",
      "$web_vitals_LCP_event",
      "$web_vitals_LCP_value",
    ]);
    // The emailed link's key that the page's address held is nowhere in it.
    expect(JSON.stringify(seen)).not.toContain("entry-secret");
  });

  it("names the page a measure was recorded on when the person has moved on before it is sent", () => {
    const seen = recordEvents("moved-on", true);
    const loadedOn = window.location.href;
    const report = (name: Measure, value: number) => {
      for (const tell of told[name]) {
        tell({ name, value, delta: value, rating: "good" });
      }
    };

    try {
      report("FCP", 420);
      // The app moves to another of its pages without loading a document; the library sends
      // what it holds for the first page when a measure arrives on the second.
      window.history.pushState({}, "", "/settings/plan");
      report("LCP", 1834.5);

      expect(seen).toHaveLength(1);
      expect(window.location.pathname).toBe("/settings/plan");
      expect(seen[0].properties.$web_vitals_FCP_value).toBe(420);
      expect(seen[0].properties.$web_vitals_LCP_value).toBeUndefined();
      expect(seen[0].properties.route).toBe("/w/*/content/*");
      expect(seen[0].properties.loaded_route).toBe("/w/*/content/*");
    } finally {
      window.history.pushState({}, "", loadedOn);
    }
  });

  it("would carry the page's raw address inside each measure without the cleaning (so the test above can see a leak)", () => {
    const seen = recordEvents("raw", false);

    measureThePage();

    expect(seen).toHaveLength(1);
    expect(JSON.stringify(seen[0].properties.$web_vitals_LCP_event)).toContain(
      "entry-secret",
    );
  });
});
