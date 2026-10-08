/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme-dental/content"}
 */

/**
 * What a report of a click holds when it leaves (rext-control task 898): the path of tags it was
 * on, the control's own words where the recordings would show them, and nothing else of the page.
 */
import type { CaptureResult } from "posthog-js";
import {
  CLICK_CAPTURE,
  CLICK_CAPTURE_OFF,
  CLICK_MASKING,
  clickReport,
  forgetClicks,
  noteClick,
} from "@/lib/analytics-clicks";
import { setWords } from "@/lib/analytics-recording";

// What a person could have named a thing, as it would stand on a button.
const KEYWORD = "best crm for dentists";
const PATH =
  'span:nth-child="2"nth-of-type="1";button:nth-child="1"nth-of-type="1";div:nth-child="3"nth-of-type="2"';

function reportOf(
  event: string,
  properties: Record<string, unknown>,
  at: Date = new Date(),
): CaptureResult {
  return { uuid: "u-1", event, properties, timestamp: at } as CaptureResult;
}

/** The page's content, and the element in it that a test clicks. */
function page(html: string, clicked: string): Element {
  document.body.innerHTML = html;
  const element = document.querySelector(clicked);
  if (!element) throw new Error(`nothing matches ${clicked}`);
  return element;
}

/** A click as the app's own listener is handed it. */
function click(target: Element): void {
  noteClick({ target } as unknown as Event);
}

beforeAll(() => {
  setWords(["Save", "Open menu", "Skip for now"]);
});

afterEach(() => {
  forgetClicks();
  document.body.innerHTML = "";
});

describe("clickReport", () => {
  it("returns an event that isn't a click's as it came", () => {
    const view = reportOf("$pageview", { $el_text: "not this one's business" });

    expect(clickReport(view)).toBe(view);
  });

  it("keeps the path of tags, and names the control by its own words where a recording would show them", () => {
    click(
      page(
        `<main><div><button data-rec="show"><svg></svg><span>Save</span></button></div></main>`,
        "span",
      ),
    );

    const sent = clickReport(
      reportOf("$autocapture", {
        $current_url: "https://app.rext.ai/w/acme-dental/content",
        plan: "growth",
        $event_type: "click",
        $ce_version: 1,
        $elements_chain: PATH,
        $el_text: KEYWORD,
        $external_click_url: `https://example.test/${KEYWORD}`,
        attr__href: `/w/acme-dental/keywords/${KEYWORD}`,
        $selected_content: KEYWORD,
      }),
    );

    expect(sent?.properties).toEqual({
      $current_url: "https://app.rext.ai/w/acme-dental/content",
      plan: "growth",
      $event_type: "click",
      $ce_version: 1,
      $elements_chain: PATH,
      control: "Save",
      control_kind: "button",
      route: "/w/*/content",
    });
    expect(JSON.stringify(sent)).not.toContain(KEYWORD);
  });

  it("gives a control no name when anything in it is not the app's own, or nobody marked it", () => {
    click(
      page(
        `<button data-rec="show"><span>Save</span> <span>${KEYWORD}</span></button>`,
        "span",
      ),
    );
    const mixed = clickReport(
      reportOf("$autocapture", { $elements_chain: PATH }),
    );
    forgetClicks();
    // A workspace named "Save" is not the app's "Save".
    click(page(`<button><span>Save</span></button>`, "span"));
    const unmarked = clickReport(
      reportOf("$autocapture", { $elements_chain: PATH }),
    );

    for (const sent of [mixed, unmarked]) {
      expect(sent?.properties.control_kind).toBe("button");
      expect(sent?.properties).not.toHaveProperty("control");
    }
  });

  it("names an icon's control by its label, and says a role where the control has one", () => {
    click(
      page(
        `<button data-rec="show" aria-label="Open menu"><svg><path></path></svg></button>`,
        "path",
      ),
    );
    const icon = clickReport(
      reportOf("$autocapture", { $elements_chain: PATH }),
    );
    forgetClicks();
    click(page(`<div role="tab" data-rec="show">Skip for now</div>`, "div"));
    const tab = clickReport(
      reportOf("$autocapture", { $elements_chain: PATH }),
    );
    forgetClicks();
    click(page(`<main><p>Some text</p></main>`, "p"));
    const nothing = clickReport(
      reportOf("$autocapture", { $elements_chain: PATH }),
    );

    expect(icon?.properties).toMatchObject({
      control: "Open menu",
      control_kind: "button",
    });
    expect(tab?.properties).toMatchObject({
      control: "Skip for now",
      control_kind: "tab",
    });
    expect(nothing?.properties.control_kind).toBe("none");
    expect(nothing?.properties).not.toHaveProperty("control");
  });

  it("does not send a report whose path holds more than tags and their places", () => {
    const paths = [
      `button:nth-child="1"nth-of-type="1"text="${KEYWORD}"`,
      'button.btn-primary:nth-child="1"nth-of-type="1"',
      'a:href="/w/acme-dental"nth-child="1"nth-of-type="1"',
      `${PATH};Button:nth-child="1"nth-of-type="1"`,
      "",
      42,
    ];

    for (const path of paths) {
      expect(
        clickReport(reportOf("$autocapture", { $elements_chain: path })),
      ).toBeNull();
    }
    // The library's older form of the path, under the same rule.
    expect(
      clickReport(
        reportOf("$autocapture", {
          $elements: [{ tag_name: "button", nth_child: 1, $el_text: KEYWORD }],
        }),
      ),
    ).toBeNull();
    expect(
      clickReport(
        reportOf("$autocapture", {
          $elements: [{ tag_name: "button", nth_child: 1, nth_of_type: 1 }],
        }),
      )?.properties.$elements,
    ).toEqual([{ tag_name: "button", nth_child: 1, nth_of_type: 1 }]);
    // And one with no path at all.
    expect(clickReport(reportOf("$autocapture", {}))).toBeNull();
  });

  it("keeps a dead click's measures, and finds the click it is about by its time", () => {
    click(page(`<button data-rec="show">Save</button>`, "button"));
    const pressed = new Date();

    const sent = clickReport(
      reportOf(
        "$dead_click",
        {
          $elements_chain: PATH,
          $dead_click_absolute_delay_ms: 3100,
          $dead_click_scroll_timeout: false,
          $dead_click_note: KEYWORD,
        },
        pressed,
      ),
    );
    // A report about a click the app no longer remembers.
    const older = clickReport(
      reportOf(
        "$dead_click",
        { $elements_chain: PATH },
        new Date(pressed.getTime() - 60_000),
      ),
    );

    expect(sent?.properties).toMatchObject({
      $dead_click_absolute_delay_ms: 3100,
      $dead_click_scroll_timeout: false,
      control: "Save",
      control_kind: "button",
    });
    expect(sent?.properties).not.toHaveProperty("$dead_click_note");
    expect(older?.properties).not.toHaveProperty("control_kind");
    expect(older?.properties.route).toBe("/w/*/content");
  });

  it("never sends what was copied, nor a swipe", () => {
    expect(
      clickReport(
        reportOf("$copy_autocapture", {
          $elements_chain: PATH,
          $selected_content: KEYWORD,
        }),
      ),
    ).toBeNull();
    expect(
      clickReport(reportOf("$dead_swipe", { $elements_chain: PATH })),
    ).toBeNull();
  });

  it("sends nothing from a page that is never recorded", () => {
    const working = window.location.href;
    try {
      window.history.pushState({}, "", "/login");

      expect(
        clickReport(reportOf("$autocapture", { $elements_chain: PATH })),
      ).toBeNull();
      expect(
        clickReport(reportOf("$rageclick", { $elements_chain: PATH })),
      ).toBeNull();
    } finally {
      window.history.pushState({}, "", working);
    }
  });
});

describe("what the library is asked for", () => {
  it("takes no text and no attribute from the page", () => {
    expect(CLICK_MASKING).toEqual({
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
  });

  it("is clicks only, never what was copied, and can be switched off again", () => {
    expect(CLICK_CAPTURE).toEqual({
      autocapture: {
        dom_event_allowlist: ["click"],
        capture_copied_text: false,
      },
      rageclick: true,
      capture_dead_clicks: true,
    });
    expect(CLICK_CAPTURE_OFF).toEqual({
      autocapture: false,
      rageclick: false,
      capture_dead_clicks: false,
    });
  });
});
