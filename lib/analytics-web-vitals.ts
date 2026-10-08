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

/** The page a measure was taken on: the event's own address, which is that page's and not the next. */
function pageOf(address: unknown): string {
  try {
    if (typeof address === "string") return new URL(address).pathname;
  } catch {
    // Not an address: the page on screen, below.
  }
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

/**
 * A page's measures as they may leave. Of everything the library puts on the event about them
 * (the properties named `$web_vitals…`), each measure's number goes, and beside it the measure
 * rebuilt from its number, its rating and how the page was reached; the rest of the event is what
 * every event carries. The page is added as its address's shape, for a chart to be split by. An
 * event that isn't a page's measures is returned as it came; one with no number in it is not
 * sent.
 */
export function webVitalsNumbers(event: CaptureResult): CaptureResult | null {
  if (event.event !== "$web_vitals") return event;
  const given = event.properties ?? {};
  const kept: Record<string, unknown> = Object.fromEntries(
    Object.entries(given).filter(([key]) => !key.startsWith("$web_vitals")),
  );
  let measured = 0;
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
  kept.route = pathShape(pageOf(given.$current_url));
  return { ...event, properties: kept };
}
