/**
 * Clicks on the app's controls, without a named event for each (rext-control task 898). Named
 * events say what a person did; they don't say which of two buttons people reach for, that
 * someone pressed one over and over, or that they pressed a thing that does nothing. posthog-js
 * can report every click by itself; this is how it is asked to, and what such a report holds.
 *
 * The library is told to take no text and no attribute from the page, so a click arrives as the
 * path of tags it was on and nothing of what they held. Every such event is checked again here on
 * its way out (the provider's before_send): a path that holds anything but tags and their places
 * means that promise is broken, and the event doesn't leave. What says which control it was is
 * added by the app itself: the control's own words, only where the recordings would show them
 * (lib/analytics-recording.ts: the element is marked in the source and the words are on the list
 * the build made of the app's fixed texts). A customer's keyword on a button is on no such list,
 * and that button is a button with no name.
 *
 * Only on the pages a recording may show: never the sign-in, sign-up, password, invitation or
 * checkout pages, nor the admin area. A copied text is never reported. Nothing is captured unless
 * NEXT_PUBLIC_CLICK_CAPTURE is "true" and the person allows usage analytics.
 */
import type { CaptureResult, PostHogConfig } from "posthog-js";
import { pathShape } from "@/lib/analytics-failures";
import {
  maskAttribute,
  maskText,
  recordableRoute,
} from "@/lib/analytics-recording";

/** Off unless the deploy says "true": merged switched off, and switched on by a variable. */
export const CLICKS_ON = process.env.NEXT_PUBLIC_CLICK_CAPTURE === "true";

/**
 * What posthog-js takes from the page for a click, whatever else is switched on: no text and no
 * attribute. Given when the library starts, so that it holds before any switch below.
 */
export const CLICK_MASKING = {
  mask_all_text: true,
  mask_all_element_attributes: true,
} as const;

/**
 * What posthog-js is asked for: clicks only (not what a field was changed to, nor a form being
 * sent), a click repeated in anger, and a click nothing answered. Never what was copied.
 */
export const CLICK_CAPTURE: Partial<PostHogConfig> = {
  autocapture: { dom_event_allowlist: ["click"], capture_copied_text: false },
  rageclick: true,
  capture_dead_clicks: true,
};

/** The same, switched off again. */
export const CLICK_CAPTURE_OFF: Partial<PostHogConfig> = {
  autocapture: false,
  rageclick: false,
  capture_dead_clicks: false,
};

/** The library's events for a click. */
const CLICK_EVENTS = ["$autocapture", "$rageclick", "$dead_click"];
/** Its events that hold what a person selected or how they swiped: never sent. */
const NEVER = ["$copy_autocapture", "$dead_swipe"];

/** One step of a click's path as the library writes it with nothing taken from the page. */
const STEP = /^[a-z][a-z0-9-]{0,39}:nth-child="\d{1,5}"nth-of-type="\d{1,5}"$/;
const TAG = /^[a-z][a-z0-9-]{0,39}$/;
// A path is as deep as the page; a report says no more with a longer one.
const STEPS = 60;

// ── Which control ────────────────────────────────────────────────────────────

/** What a person presses: the nearest of these round the thing clicked is the control. */
const CONTROLS =
  'button, a, summary, label, [role="button"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="switch"], [role="checkbox"], [role="radio"], [role="link"]';
const ROLE = /^[a-z]{1,24}$/;
const WORDS = 80;

/** The kind of control: its role where it has one of the plain ones, otherwise its tag. */
function kindOf(control: Element): string {
  const role = control.getAttribute("role");
  return role && ROLE.test(role) ? role : control.tagName.toLowerCase();
}

/**
 * A control's own words, or null. Every piece of text inside it has to be one the recordings
 * would show; a control that holds anything else has no name here, whatever the rest of it says.
 * One with no text (an icon) is named by its label for a screen reader, under the same rule.
 */
function wordsOf(control: Element): string | null {
  const pieces: string[] = [];
  const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    if (text.trim() === "") continue;
    if (maskText(text, node.parentElement) !== text) return null;
    pieces.push(text.trim());
  }
  if (pieces.length === 0) {
    const label = control.getAttribute("aria-label");
    if (label) pieces.push(maskAttribute("aria-label", label, control).trim());
  }
  const words = pieces.join(" ").replace(/\s+/g, " ").trim();
  return words !== "" && words.length <= WORDS ? words : null;
}

type Noted = { at: number; control: string | null; kind: string };

// The last few clicks as the app saw them: the library reports a click nothing answered a few
// seconds after it, when others may have followed.
const noted: Noted[] = [];
const KEPT = 12;
/** How far the library's time for a click may be from the app's for the same one. */
const SAME_CLICK_MS = 250;

/**
 * The app's own look at a click, taken ahead of the library's (the provider listens on the
 * window, the library on the document): which control it was on, by the control's own words.
 */
export function noteClick(event: Event): void {
  const target = event.target instanceof Element ? event.target : null;
  const control = target?.closest(CONTROLS) ?? null;
  noted.push({
    at: Date.now(),
    control: control ? wordsOf(control) : null,
    kind: control ? kindOf(control) : "none",
  });
  if (noted.length > KEPT) noted.shift();
}

/** For the tests: no click seen yet. */
export function forgetClicks(): void {
  noted.length = 0;
}

function notedAt(when: number): Noted | undefined {
  let nearest: Noted | undefined;
  for (const note of noted) {
    if (Math.abs(note.at - when) > SAME_CLICK_MS) continue;
    if (!nearest || Math.abs(note.at - when) < Math.abs(nearest.at - when)) {
      nearest = note;
    }
  }
  return nearest;
}

// ── What leaves ──────────────────────────────────────────────────────────────

/** A click's path as a text, where every step is a tag and its place; otherwise null. */
function plainChain(given: unknown): string | null {
  if (typeof given !== "string" || given === "") return null;
  const steps = given.split(";");
  if (!steps.every((step) => STEP.test(step))) return null;
  return steps.slice(0, STEPS).join(";");
}

/** The same path as a list, in the library's older form; null where a step holds more. */
function plainElements(given: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(given) || given.length === 0) return null;
  const steps: Record<string, unknown>[] = [];
  for (const step of given.slice(0, STEPS)) {
    if (step === null || typeof step !== "object") return null;
    const { tag_name: tag, nth_child: child, nth_of_type: ofType } = step;
    const extra = Object.keys(step).some(
      (key) => !["tag_name", "nth_child", "nth_of_type"].includes(key),
    );
    if (extra || typeof tag !== "string" || !TAG.test(tag)) return null;
    steps.push({
      tag_name: tag,
      ...(Number.isInteger(child) ? { nth_child: child } : {}),
      ...(Number.isInteger(ofType) ? { nth_of_type: ofType } : {}),
    });
  }
  return steps;
}

/** The properties the library puts on a click's event about the click itself. */
function ofTheClick(key: string): boolean {
  return (
    key.startsWith("$el") ||
    key.startsWith("attr__") ||
    key.startsWith("$dead_click") ||
    key.startsWith("$dead_swipe") ||
    key === "$event_type" ||
    key === "$ce_version" ||
    key === "$external_click_url" ||
    key === "$selected_content" ||
    key === "$copy_type"
  );
}

/**
 * A click's report as it may leave. Of everything the library puts on it about the click, the
 * path goes when it is tags and places only, the kind of event, and a dead click's measures
 * where they are numbers or yes and no. Added by the app: the control's own words where it has
 * any (`control`), the kind of control, and the page as its address's shape. A report from a page
 * that is never recorded, one whose path holds more than tags, and anything copied or swiped are
 * not sent. An event that isn't a click's is returned as it came.
 */
export function clickReport(event: CaptureResult): CaptureResult | null {
  if (NEVER.includes(event.event)) return null;
  if (!CLICK_EVENTS.includes(event.event)) return event;
  if (typeof window === "undefined") return null;
  if (!recordableRoute(window.location.pathname)) return null;
  const given = event.properties ?? {};
  const chain = plainChain(given.$elements_chain);
  const elements = plainElements(given.$elements);
  // The path in either form, and whichever form came has to be plain.
  if (given.$elements_chain !== undefined && chain === null) return null;
  if (given.$elements !== undefined && elements === null) return null;
  if (chain === null && elements === null) return null;
  const kept: Record<string, unknown> = Object.fromEntries(
    Object.entries(given).filter(([key]) => !ofTheClick(key)),
  );
  if (chain !== null) kept.$elements_chain = chain;
  if (elements !== null) kept.$elements = elements;
  kept.$event_type = "click";
  if (typeof given.$ce_version === "number")
    kept.$ce_version = given.$ce_version;
  for (const [key, value] of Object.entries(given)) {
    if (!key.startsWith("$dead_click")) continue;
    if (typeof value === "boolean") kept[key] = value;
    if (typeof value === "number" && Number.isFinite(value)) kept[key] = value;
  }
  // The library gives a dead click the time of the click it is about; the others are now.
  const when =
    event.timestamp instanceof Date ? event.timestamp.getTime() : Date.now();
  const note = notedAt(when);
  if (note) {
    kept.control_kind = note.kind;
    if (note.control !== null) kept.control = note.control;
  }
  kept.route = pathShape(window.location.pathname);
  return { ...event, properties: kept };
}
