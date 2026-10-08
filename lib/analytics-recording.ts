/**
 * What a session recording may hold (rext-control task 712, step E).
 *
 * A recording replays the page as the person saw it, so that we can see where people stop. It
 * starts strict: every typed value is hidden, and so is every text, except the app's own words on
 * its buttons, menus, labels and table headers. "The app's own words" is taken literally: a text
 * is shown only when it is in the list read from the app's source (lib/recording-words.ts), so a
 * workspace's name on a button, or a generated title in a menu, is hidden like any other text.
 * Pictures, frames and the support chat are left out whole.
 *
 * Nothing is recorded unless NEXT_PUBLIC_SESSION_RECORDING is "true", the person allows usage
 * analytics (lib/analytics-consent.ts), they are signed in on one of the pages below, and nobody
 * is acting as them. The provider starts and stops it (providers/posthog-provider.tsx).
 */

import type { CapturedNetworkRequest, PostHogConfig } from "posthog-js";
import { markOf, normalizeWords } from "@/lib/recording-words";

/** Off unless the deploy says "true": merged switched off, and switched on by a variable. */
export const RECORDING_ON =
  process.env.NEXT_PUBLIC_SESSION_RECORDING === "true";

// ── Where ────────────────────────────────────────────────────────────────────

// The app's working pages. Sign-in, sign-up, the password and invitation pages, checkout, the
// admin area and everything else are never recorded: a new area isn't either, until it is added.
const RECORDED = [
  /^\/$/,
  /^\/w\//,
  /^\/edit\//,
  /^\/settings(?:\/|$)/,
  /^\/pricing$/,
];

export function recordableRoute(pathname: string): boolean {
  return RECORDED.some((route) => route.test(pathname));
}

let lastPath = "";
let lastPathRecordable = false;

/**
 * Whether the page on screen is one that is recorded. Asked for every text as it is written
 * down: a new page's content is on screen a moment before the provider stops the recorder.
 */
function onRecordablePage(): boolean {
  const path = window.location.pathname;
  if (path !== lastPath) {
    lastPath = path;
    lastPathRecordable = recordableRoute(path);
  }
  return lastPathRecordable;
}

// ── The app's own words ──────────────────────────────────────────────────────

// The marks of the app's own words (markOf), as the build listed them.
let marks: ReadonlySet<string> | null = null;
let marksRequest: Promise<boolean> | null = null;

/** The list, as the build made it. Returns false when there is none: nothing is recorded then. */
export function loadWords(): Promise<boolean> {
  marksRequest ||= fetch("/api/recording-words")
    .then((response) => (response.ok ? response.json() : []))
    .then((list: unknown) => {
      const listed = Array.isArray(list)
        ? list.filter((mark): mark is string => typeof mark === "string")
        : [];
      marks = new Set(listed);
      return listed.length > 0;
    })
    .catch(() => false);
  return marksRequest;
}

/** For the tests: the app's own words, as texts, or none. */
export function setWords(list: Iterable<string> | null): void {
  marks = list ? new Set([...list].map(markOf)) : null;
  marksRequest = null;
  lastPath = "";
}

function isOwnWords(text: string): boolean {
  return marks?.has(markOf(normalizeWords(text))) ?? false;
}

// ── Text ─────────────────────────────────────────────────────────────────────

// Buttons, menus (their items, a select's options, tabs, the navigation), labels and table
// headers. `data-rec="show"` adds an element of the app's own to them; the text inside still has
// to be on the list.
const SHOWN = [
  "button",
  '[role="button"]',
  'a[data-slot="button"]',
  "summary",
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  "option",
  '[role="tab"]',
  "nav a",
  // The sidebar's own menu, a link of which can sit outside the navigation (Generate).
  '[data-slot="sidebar-menu-button"]',
  '[data-slot="sidebar-menu-sub-button"]',
  "label",
  "legend",
  "th",
  '[role="columnheader"]',
  '[data-rec="show"]',
].join(",");
/** `data-rec="mask"` hides everything inside, whatever it says. */
const HIDDEN = '[data-rec="mask"]';

const stars = (text: string) => text.replace(/\S/g, "*");

/** A text as the recording keeps it: itself where it may be shown, otherwise stars of its length. */
export function maskText(text: string, element?: Element | null): string {
  const shown =
    element &&
    onRecordablePage() &&
    !element.closest(HIDDEN) &&
    element.closest(SHOWN) &&
    isOwnWords(text);
  return shown ? text : stars(text);
}

// ── Attributes ───────────────────────────────────────────────────────────────

// What draws the page and says nothing a person wrote. Everything not named here or below is
// kept only when it is a state word, a number or one of the app's own words.
const STRUCTURE = new Set(
  `class id style role type name for form tabindex dir lang hidden disabled checked selected
  readonly required multiple open width height size rows cols colspan rowspan span scope
  headers rel target media sizes loading decoding draggable contenteditable spellcheck
  autocomplete autocapitalize inputmode enterkeyhint min max step minlength maxlength accept
  wrap viewBox xmlns xmlns:xlink version d fill fill-rule fill-opacity clip-rule clip-path
  stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset
  stroke-opacity stroke-miterlimit opacity transform cx cy r rx ry x y x1 x2 y1 y2 dx dy
  points offset stop-color stop-opacity gradientUnits gradientTransform patternUnits
  preserveAspectRatio focusable mask filter marker-end marker-start text-anchor
  dominant-baseline font-size font-family font-weight charset http-equiv as crossorigin
  integrity nonce fetchpriority referrerpolicy async defer nomodule blocking
  rr_width rr_height rr_left rr_top rr_position rr_dataURL rr_scrollLeft rr_scrollTop rr_mediaState
  rr_mediaCurrentTime rr_mediaPlaybackRate rr_mediaMuted rr_mediaLoop rr_mediaVolume
  _cssText popover popovertarget inert translate part slot is aria-controls
  aria-labelledby aria-describedby aria-owns aria-activedescendant aria-details
  aria-errormessage aria-flowto`.split(/\s+/),
);
// What a person may read, or have read to them.
const READABLE = new Set(
  `placeholder title alt label summary abbr content aria-label aria-description
  aria-valuetext aria-roledescription aria-placeholder aria-braillelabel`.split(
    /\s+/,
  ),
);
const ADDRESSES = new Set(
  `href src srcset action formaction poster cite data background ping xlink:href
  manifest longdesc usemap`.split(/\s+/),
);
// The states the component libraries write, and plain measures.
const STATE =
  /^(?:true|false|on|off|open|closed|checked|unchecked|indeterminate|mixed|active|inactive|horizontal|vertical|top|bottom|left|right|start|end|center|visible|hidden|page|step|location|date|time|polite|assertive|none|both|inline|list|dialog|menu|listbox|tree|grid|ascending|descending|other|delayed-open|instant-open|from-start|from-end|to-start|to-end|ltr|rtl|auto|-?\d+(?:\.\d+)?(?:px|%|rem|em|ms|s)?)$/;
const FIELDS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION"]);

/** An address without what follows the path. Only this site's, and a stylesheet's or a script's. */
function recordedAddress(value: string, element?: Element | null): string {
  let url: URL;
  try {
    url = new URL(value, window.location.href);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  const ours = url.origin === window.location.origin;
  // The page's own styles and code load from where the app put them; a link a person added, or
  // a picture's source, does not go into a recording.
  const asset = element?.tagName === "LINK" || element?.tagName === "SCRIPT";
  if (!ours && !asset) return "";
  return asset ? url.href : url.origin + url.pathname;
}

/** A `style` with every picture from elsewhere taken out. */
function recordedStyle(value: string): string {
  if (!value.includes("url(")) return value;
  return value.replace(
    /url\(\s*(['"]?)(.*?)\1\s*\)/gi,
    (whole, _quote, target) =>
      /^(?:data:|\/(?!\/)|#)/.test(target) ? whole : "url()",
  );
}

/** One attribute's value as the recording keeps it. */
export function maskAttribute(
  name: string,
  value: string,
  element?: Element | null,
): string {
  if (name === "style") return recordedStyle(value);
  if (STRUCTURE.has(name)) return value;
  const hidden = !onRecordablePage() || Boolean(element?.closest(HIDDEN));
  if (ADDRESSES.has(name)) return hidden ? "" : recordedAddress(value, element);
  if (name === "value" && element && FIELDS.has(element.tagName)) {
    return stars(value);
  }
  if (READABLE.has(name)) return !hidden && isOwnWords(value) ? value : "";
  // A state ("open"), a measure ("40"), a variant ("outline"), or the app's own words.
  if (STATE.test(value) || (!hidden && isOwnWords(value))) return value;
  return name === "value" ? stars(value) : "";
}

// ── Addresses and requests ───────────────────────────────────────────────────

/**
 * A request's or a page's address as the recording keeps it: no query, no fragment, no headers
 * and no body. A page that isn't recorded doesn't leave its address either.
 */
export function maskNetworkRequest(
  request: CapturedNetworkRequest,
): CapturedNetworkRequest | null {
  let url: URL;
  try {
    url = new URL(request.name, window.location.href);
  } catch {
    return null;
  }
  const page =
    url.origin === window.location.origin &&
    !url.pathname.startsWith("/_next/") &&
    !url.pathname.startsWith("/api/");
  if (page && !recordableRoute(url.pathname)) return null;
  return {
    ...request,
    name: url.origin + url.pathname,
    requestHeaders: undefined,
    requestBody: undefined,
    responseHeaders: undefined,
    responseBody: undefined,
  };
}

// ── The options ──────────────────────────────────────────────────────────────

/** posthog-js's `session_recording`: set at init, used only once a recording starts. */
export const RECORDING_OPTIONS: PostHogConfig["session_recording"] = {
  maskAllInputs: true,
  // Every text goes through maskText.
  maskTextSelector: "*",
  maskTextFn: maskText,
  maskAttributeFn: maskAttribute,
  // Left out whole, as a box of the same size: pictures (a person's avatar, a site's icon, an
  // article's image), anything drawn or embedded, and the support chat.
  blockSelector:
    'img, picture, video, audio, canvas, iframe, object, embed, svg image, [data-rec="block"], #crisp-chatbox, .crisp-client',
  recordCrossOriginIframes: false,
  captureCanvas: { recordCanvas: false },
  captureJsonLd: false,
  recordHeaders: false,
  recordBody: false,
  maskCapturedNetworkRequestFn: maskNetworkRequest,
};
