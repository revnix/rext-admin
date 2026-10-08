/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme-dental/keywords/best-crm"}
 */

/**
 * What a page's measures of speed hold when they leave (rext-control task 898): each measure's
 * number, its rating and how the page was reached, and the page as its address's shape.
 */
import type { CaptureResult } from "posthog-js";
import {
  WEB_VITALS_OPTIONS,
  webVitalsNumbers,
} from "@/lib/analytics-web-vitals";

// What the library's fuller form can say of a customer's page.
const PLANTED = [
  "cover-of-acme",
  "entry-secret",
  "img.featured",
  "button#save",
];

function measuresOf(properties: Record<string, unknown>): CaptureResult {
  return { uuid: "u-1", event: "$web_vitals", properties } as CaptureResult;
}

describe("webVitalsNumbers", () => {
  it("returns an event that isn't a page's measures as it came", () => {
    const view = {
      uuid: "u-2",
      event: "$pageview",
      properties: { $web_vitals_LCP_value: 12 },
    } as CaptureResult;

    expect(webVitalsNumbers(view)).toBe(view);
  });

  it("keeps each measure's number, rating and how the page was reached, and nothing else of it", () => {
    const page = "https://app.rext.ai/w/acme-dental/content/6f1c";
    const measures = measuresOf({
      $current_url: page,
      plan: "growth",
      $web_vitals_LCP_value: 1834.5,
      $web_vitals_LCP_event: {
        name: "LCP",
        value: 1834.5,
        delta: 1834.5,
        id: "v4-1700000000000-1",
        rating: "good",
        navigationType: "navigate",
        navigationURL: `${page}?token=entry-secret`,
        $current_url: `${page}?token=entry-secret`,
        timestamp: 1700000000000,
        $session_id: "session-1",
        $window_id: "window-1",
        attribution: {
          target: "img.featured",
          url: "https://cdn.example/cover-of-acme.png",
        },
        entries: [{ url: "https://cdn.example/cover-of-acme.png" }],
      },
      $web_vitals_INP_value: 96,
      $web_vitals_INP_event: {
        name: "INP",
        value: 96,
        delta: 96,
        rating: "needs-improvement",
        navigationType: "back-forward",
        attribution: { interactionTarget: "button#save" },
      },
      $web_vitals_CLS_value: 0,
      $web_vitals_CLS_event: { name: "CLS", value: 0, rating: "good" },
      // A measure nobody asked for, and a property that is no measure at all.
      $web_vitals_TTFB_value: 120,
      $web_vitals_TTFB_event: { name: "TTFB", value: 120 },
      $web_vitals_note: "img.featured",
    });

    const sent = webVitalsNumbers(measures);

    expect(sent?.properties).toEqual({
      $current_url: page,
      plan: "growth",
      route: "/w/*/content/*",
      $web_vitals_LCP_value: 1834.5,
      $web_vitals_LCP_event: {
        name: "LCP",
        value: 1834.5,
        delta: 1834.5,
        rating: "good",
        navigationType: "navigate",
      },
      $web_vitals_INP_value: 96,
      $web_vitals_INP_event: {
        name: "INP",
        value: 96,
        delta: 96,
        rating: "needs-improvement",
        navigationType: "back-forward",
      },
      $web_vitals_CLS_value: 0,
      $web_vitals_CLS_event: { name: "CLS", value: 0, rating: "good" },
    });
    const whole = JSON.stringify(sent);
    for (const planted of PLANTED) expect(whole).not.toContain(planted);
    // The event it was given is left as it was.
    expect(measures.properties.$web_vitals_note).toBe("img.featured");
  });

  it("names the page the measures were taken on, which may not be the one on screen any more", () => {
    const measure = { $web_vitals_FCP_value: 420 };

    expect(
      webVitalsNumbers(
        measuresOf({
          ...measure,
          $current_url: "https://app.rext.ai/settings/plan?x=1",
        }),
      )?.properties.route,
    ).toBe("/settings/plan");
    // No address on the event, or none that can be read: the page on screen.
    expect(webVitalsNumbers(measuresOf(measure))?.properties.route).toBe(
      "/w/*/keywords/*",
    );
    expect(
      webVitalsNumbers(measuresOf({ ...measure, $current_url: "not one" }))
        ?.properties.route,
    ).toBe("/w/*/keywords/*");
  });

  it("leaves out a rating, a way of reaching the page or a change it doesn't know", () => {
    const sent = webVitalsNumbers(
      measuresOf({
        $web_vitals_FCP_value: 420,
        $web_vitals_FCP_event: {
          name: "Ana's page",
          value: 9999,
          delta: "3",
          rating: "terrible",
          navigationType: "Odd One",
        },
      }),
    );

    // Its name and its number are the measure's own, whatever the fuller part says.
    expect(sent?.properties.$web_vitals_FCP_event).toEqual({
      name: "FCP",
      value: 420,
    });
  });

  it("does not send a measure whose number is no number, nor an event with none", () => {
    const sent = webVitalsNumbers(
      measuresOf({
        $web_vitals_LCP_value: "1834",
        $web_vitals_INP_value: Number.NaN,
        $web_vitals_CLS_value: -1,
        $web_vitals_FCP_value: 420,
      }),
    );

    expect(
      Object.keys(sent?.properties ?? {})
        .filter((key) => key.startsWith("$web_vitals"))
        .sort(),
    ).toEqual(["$web_vitals_FCP_event", "$web_vitals_FCP_value"]);
    expect(webVitalsNumbers(measuresOf({}))).toBeNull();
    expect(
      webVitalsNumbers(
        measuresOf({ $web_vitals_LCP_event: { name: "LCP", value: 12 } }),
      ),
    ).toBeNull();
  });
});

describe("WEB_VITALS_OPTIONS", () => {
  it("asks for the measures without the part that names an element or a file", () => {
    expect(WEB_VITALS_OPTIONS).toEqual({
      web_vitals: true,
      web_vitals_attribution: false,
    });
  });
});
