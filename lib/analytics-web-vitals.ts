/**
 * How fast a page loaded and answered, as numbers (rext-control task 898). posthog-js measures the
 * four the browsers agree on (the first paint of content, the largest paint, the slowest answer to
 * a tap or a key, how much the page jumped) and sends them as one `$web_vitals` event for a page.
 *
 * A measure knows more than its number. It carries the page's address, and in the library's
 * fuller form it names the element painted last and where its picture came from, which can be a
 * customer's. The fuller form is not asked for, and what leaves is rebuilt here: each measure's
 * number, its rating and how the page was reached, and the page as its address's shape. Every
 * `$web_vitals` event passes through here on its way out (the provider's before_send).
 *
 * Which page a measure is about: the app moves between its pages without loading a new document,
 * and the browsers measure a document. The two paints are of the page the document was loaded on,
 * once; the slowest answer and the jump are of the whole stay in the tab, sent when it is hidden.
 * So an event names two pages: the one the document was loaded on (`loaded_route`), which is the
 * one the paints are about, and the one on screen when the measure was recorded (`route`). The
 * library's trial of a measure for each page moved to needs a part of the browser most people's
 * don't have yet, and is not switched on.
 *
 * Nothing is measured unless NEXT_PUBLIC_WEB_VITALS is "true" and the person allows usage
 * analytics.
 */
import type { CaptureResult } from "posthog-js";
import { pathShape } from "@/lib/analytics-failures";

/** Off unless the deploy says "true": merged switched off, and switched on by a variable. */
export const WEB_VITALS_ON = process.env.NEXT_PUBLIC_WEB_VITALS === "true";

/**
 * What posthog-js is asked for: the measures, without the part that says which element and which
 * file each was about. (The option's other half, a recording's list of requests, is left as it
 * is: unset.)
 */
export const WEB_VITALS_OPTIONS = {
  web_vitals: true,
  web_vitals_attribution: false,
} as const;

const MEASURES = ["CLS", "FCP", "INP", "LCP"] as const;
const RATINGS = ["good", "needs-improvement", "poor"];
/** How the page was reached, in the browser's own words (`navigate`, `reload`, `back-forward`). */
const WORD = /^[a-z][a-z-]{0,29}$/;

function numberOf(given: unknown): number | undefined {
  return typeof given === "number" && Number.isFinite(given) && given >= 0
    ? given
    : undefined;
}

/** The page this document was loaded on, read once as the app's code starts. */
const LOADED_ON =
  typeof window !== "undefined" ? window.location.pathname : null;

/** The page of an address, where it is one. */
function pageOf(address: unknown): string | undefined {
  try {
    if (typeof address === "string") return new URL(address).pathname;
  } catch {
    // Not an address.
  }
  return undefined;
}

/**
 * A page's measures as they may leave. Of everything the library puts on the event about them
 * (the properties named `$web_vitals…`), each measure's number goes, and beside it the measure
 * rebuilt from its number, its rating and how the page was reached; the rest of the event is what
 * every event carries. Two pages are added as their addresses' shapes, for a chart to be split
 * by: the one the document was loaded on, and the one a measure was recorded on. That second one
 * is read from the address the library wrote into the measure as it arrived, then from the
 * event's own, and only then from the screen, where the person may have moved on. An event that
 * isn't a page's measures is returned as it came; one with no number in it is not sent.
 */
export function webVitalsNumbers(event: CaptureResult): CaptureResult | null {
  if (event.event !== "$web_vitals") return event;
  const given = event.properties ?? {};
  const kept: Record<string, unknown> = Object.fromEntries(
    Object.entries(given).filter(([key]) => !key.startsWith("$web_vitals")),
  );
  let measured = 0;
  let recordedOn: string | undefined;
  for (const measure of MEASURES) {
    const value = numberOf(given[`$web_vitals_${measure}_value`]);
    if (value === undefined) continue;
    measured += 1;
    const whole: unknown = given[`$web_vitals_${measure}_event`];
    const parts =
      whole !== null && typeof whole === "object"
        ? (whole as Record<string, unknown>)
        : {};
    const delta = numberOf(parts.delta);
    recordedOn = recordedOn ?? pageOf(parts.$current_url);
    kept[`$web_vitals_${measure}_value`] = value;
    kept[`$web_vitals_${measure}_event`] = {
      name: measure,
      value,
      ...(delta !== undefined ? { delta } : {}),
      ...(typeof parts.rating === "string" && RATINGS.includes(parts.rating)
        ? { rating: parts.rating }
        : {}),
      ...(typeof parts.navigationType === "string" &&
      WORD.test(parts.navigationType)
        ? { navigationType: parts.navigationType }
        : {}),
    };
  }
  if (measured === 0) return null;
  const onScreen =
    typeof window !== "undefined" ? window.location.pathname : "/";
  kept.route = pathShape(recordedOn ?? pageOf(given.$current_url) ?? onScreen);
  if (LOADED_ON !== null) kept.loaded_route = pathShape(LOADED_ON);
  return { ...event, properties: kept };
}
