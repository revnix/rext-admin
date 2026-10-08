/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme-dental/content"}
 */

/**
 * A click as posthog-js itself reports it, with the masking the app starts it with and through
 * the app's own cleaning (rext-control task 898). The cleaning's own tests name the parts a
 * click's report is known to have; this one runs the real library on a real page, so a part a
 * posthog-js upgrade adds is caught too. A recorder at the end keeps each event and drops it, so
 * nothing is sent.
 */

import posthog, { type CaptureResult, type PostHogConfig } from "posthog-js";
import {
  CLICK_CAPTURE,
  CLICK_MASKING,
  clickReport,
  forgetClicks,
  noteClick,
} from "@/lib/analytics-clicks";
import { setWords } from "@/lib/analytics-recording";

// What a person could have named a thing: on a button, in its attributes, in a link's address.
const PLANTED = ["best crm for dentists", "save-acme-dental", "btn-of-ana"];

type Client = NonNullable<ReturnType<typeof posthog.init>>;
const started: Client[] = [];

function recordEvents(name: string, asTheAppDoes: boolean): CaptureResult[] {
  const seen: CaptureResult[] = [];
  const record = (event: CaptureResult | null) => {
    if (event) seen.push(event);
    return null;
  };
  const cleaned = (event: CaptureResult | null) =>
    event ? clickReport(event) : event;
  const config: Partial<PostHogConfig> = {
    api_host: "http://127.0.0.1:9", // never reached: the recorder drops every event
    persistence: "memory",
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    advanced_disable_flags: true,
    ...CLICK_CAPTURE,
    // No dead clicks here: their piece of the library is not part of this test.
    capture_dead_clicks: false,
    ...(asTheAppDoes ? CLICK_MASKING : {}),
    before_send: asTheAppDoes ? [cleaned, record] : record,
  };
  const client = posthog.init("phc_test_not_a_real_key", config, name);
  if (!client) throw new Error("posthog-js didn't start");
  started.push(client);
  return seen;
}

/** A page with one button on it, and a real click on the text inside the button. */
function pressTheButton(inside: string): void {
  document.body.innerHTML = `<main><div><button id="save-acme-dental" class="btn-of-ana" data-rec="show" data-keyword="best crm for dentists">${inside}</button></div></main>`;
  document
    .querySelector("button span")
    ?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
}

beforeAll(() => {
  setWords(["Save"]);
  // As the provider listens: on the window, ahead of the library's listener on the document.
  window.addEventListener("click", noteClick, { capture: true });
});

afterAll(() => {
  window.removeEventListener("click", noteClick, { capture: true });
});

afterEach(() => {
  // Each client listens on the one document: the next test's clicks are not this one's.
  for (const client of started.splice(0))
    client.set_config({ autocapture: false });
  forgetClicks();
  document.body.innerHTML = "";
});

describe("posthog-js's own report of a click", () => {
  it("leaves as a path of tags, with the control's own words added by the app", () => {
    const seen = recordEvents("own-words", true);

    pressTheButton("<span>Save</span>");

    expect(seen).toHaveLength(1);
    expect(seen[0].event).toBe("$autocapture");
    const sent = seen[0].properties;
    expect(sent.$elements_chain).toMatch(
      /^span:nth-child="1"nth-of-type="1";button:nth-child="1"nth-of-type="1";/,
    );
    expect(sent).toMatchObject({
      $event_type: "click",
      control: "Save",
      control_kind: "button",
      route: "/w/*/content",
    });
    expect(sent).not.toHaveProperty("$el_text");
    // The library's older form of the path goes with it here (the project asks for the text
    // form alone); each of its steps is a tag and its place too.
    for (const step of (sent.$elements ?? []) as Record<string, unknown>[]) {
      expect(Object.keys(step).sort()).toEqual([
        "nth_child",
        "nth_of_type",
        "tag_name",
      ]);
    }
    const whole = JSON.stringify(seen);
    for (const planted of PLANTED) expect(whole).not.toContain(planted);
  });

  it("leaves with no name for a control that holds a person's words", () => {
    const seen = recordEvents("their-words", true);

    pressTheButton("<span>Save</span> <span>best crm for dentists</span>");

    expect(seen).toHaveLength(1);
    expect(seen[0].properties.control_kind).toBe("button");
    expect(seen[0].properties).not.toHaveProperty("control");
    const whole = JSON.stringify(seen);
    for (const planted of PLANTED) expect(whole).not.toContain(planted);
  });

  it("would carry the button's text and attributes without the masking and the cleaning (so the tests above can see a leak)", () => {
    const seen = recordEvents("raw", false);

    pressTheButton("<span>Save</span> <span>best crm for dentists</span>");

    expect(seen).toHaveLength(1);
    const whole = JSON.stringify(seen);
    expect(whole).toContain("save-acme-dental");
    expect(whole).toContain("btn-of-ana");
  });
});
