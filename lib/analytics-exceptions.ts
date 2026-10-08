/**
 * An error nobody caught (rext-control task 894). One thrown in a click's handler, or a promise's
 * failure nobody handled, puts no error screen up, so the screens' own report never sees it.
 * posthog-js can report those by itself; this is what such a report holds when it leaves.
 *
 * An error's message is the one part of it that can carry what a person typed, a keyword, a title
 * or a backend's answer, and it never leaves the browser. The report says which class of error it
 * was, which kind of message where the message is one the browser or React writes, and where in
 * the code it was thrown: each frame's file, function, line and column. Every `$exception` event
 * passes through here on its way out (the provider's before_send), whatever raised it.
 *
 * Nothing is reported unless NEXT_PUBLIC_EXCEPTION_CAPTURE is "true" and the person allows usage
 * analytics.
 */
import type { CaptureResult } from "posthog-js";
import { pathShape } from "@/lib/analytics-failures";

/** Off unless the deploy says "true": merged switched off, and switched on by a variable. */
export const EXCEPTIONS_ON =
  process.env.NEXT_PUBLIC_EXCEPTION_CAPTURE === "true";

/**
 * What posthog-js listens for: an error no code caught, and a promise's failure nobody handled.
 * Not `console.error`: the app and its libraries write there about things that are no failure.
 */
export const EXCEPTION_CAPTURE = {
  capture_unhandled_errors: true,
  capture_unhandled_rejections: true,
  capture_console_errors: false,
} as const;

/** A class from the code (`TypeError`, `ChunkLoadError`): letters and digits only. */
const CLASS = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
/** One of the library's own words for how an error reached it (`generic`, `chained`, `cause`). */
const WORD = /^[a-z_]{1,24}$/;
/** A function's name as a stack line gives it (`Object.<anonymous>`, `async eU`, `a.b [as c]`). */
const FUNCTION = /^[\w$.<>[\]() *#:/-]{1,120}$/;
const LEVELS = ["fatal", "error", "warning", "log", "info", "debug"];
const PLATFORMS = ["web:javascript", "node:javascript", "hermes"];

// An error with a cause, or one that gathers several, is a list; a stack is as deep as it is.
const ENTRIES = 8;
const FRAMES = 50;

/**
 * The kinds of message a report may name, the first that fits. Each is told by the fixed words
 * the browser, React or the library writes; the report carries the kind's name from this list,
 * never the message it was read from.
 */
const MESSAGE_KINDS: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /Loading (?:CSS )?chunk|Failed to load chunk|ChunkLoadError|dynamically imported module|Importing a module script failed/i,
    "chunk_load",
  ],
  [/hydrat/i, "hydration"],
  [/Maximum call stack size exceeded|too much recursion/i, "stack_overflow"],
  [/ResizeObserver loop/, "resize_observer"],
  [/^Script error\.?$/, "script_error"],
  [
    /Failed to fetch|NetworkError when attempting to fetch|Load failed|Network request failed|network error/i,
    "request_failed",
  ],
  [/\babort(?:ed)?\b|AbortError/i, "aborted"],
  [/\btimed? ?out\b/i, "timed_out"],
  [/is not a function|is not a constructor/, "not_a_function"],
  [
    /Cannot (?:read|set) propert(?:y|ies) of (?:undefined|null)|(?:undefined|null) is not an object|can't access property|is (?:undefined|null)$/,
    "property_of_nothing",
  ],
  [/is not defined|Can't find variable/, "not_defined"],
  [/is not iterable/, "not_iterable"],
  [
    /is not valid JSON|Unexpected token|Unexpected end of (?:JSON|input)|JSON\.parse/,
    "not_json",
  ],
  [/quota|The operation is insecure/i, "storage"],
  [
    /^Non-Error promise rejection|captured as (?:exception|promise rejection) with keys/,
    "not_an_error",
  ],
];

/** The kind of message, by name (`property_of_nothing`, `react_error_418`); "other" for the rest. */
export function messageKind(message: unknown): string {
  if (typeof message !== "string") return "other";
  // A long message says what kind it is in its first words.
  const text = message.slice(0, 2000);
  // React's own errors in a production build are a number and a link to its meaning.
  const react = /Minified React error #(\d{1,4})\b/.exec(text);
  if (react) return `react_error_${react[1]}`;
  for (const [fixed, kind] of MESSAGE_KINDS) {
    if (fixed.test(text)) return kind;
  }
  return "other";
}

type Bag = Record<string, unknown>;

function bagOf(given: unknown): Bag | null {
  return given !== null && typeof given === "object" && !Array.isArray(given)
    ? (given as Bag)
    : null;
}

/**
 * Where a frame's code came from. One of the build's own files is kept as it is, without a query;
 * a page of the app (an inline script reports the page's address) is its address's shape; a file
 * from elsewhere is its address without a query; anything that isn't a web address says only
 * which sort it was (`blob:`).
 */
function frameFile(filename: unknown): string | undefined {
  if (typeof filename !== "string" || filename === "") return undefined;
  let address: URL;
  try {
    address = new URL(filename);
  } catch {
    return undefined;
  }
  if (address.protocol !== "https:" && address.protocol !== "http:") {
    return address.protocol;
  }
  const own =
    typeof window !== "undefined" && address.origin === window.location.origin;
  if (own && !address.pathname.startsWith("/_next/")) {
    return address.origin + pathShape(address.pathname);
  }
  return (address.origin + address.pathname).slice(0, 300);
}

function wholeNumber(given: unknown): number | undefined {
  return typeof given === "number" && Number.isInteger(given) && given >= 0
    ? given
    : undefined;
}

/** A frame: where it is, and nothing of what was there (no source lines, no variables). */
function frameOf(given: unknown): Bag | null {
  const frame = bagOf(given);
  if (!frame) return null;
  const file = frameFile(frame.filename);
  const line = wholeNumber(frame.lineno);
  const column = wholeNumber(frame.colno);
  return {
    platform:
      typeof frame.platform === "string" && PLATFORMS.includes(frame.platform)
        ? frame.platform
        : "web:javascript",
    function:
      typeof frame.function === "string" && FUNCTION.test(frame.function)
        ? frame.function
        : "?",
    in_app: typeof frame.in_app === "boolean" ? frame.in_app : true,
    ...(file !== undefined ? { filename: file } : {}),
    ...(line !== undefined ? { lineno: line } : {}),
    ...(column !== undefined ? { colno: column } : {}),
  };
}

/** How the error reached the library: caught or not, and its place among the ones it came with. */
function mechanismOf(given: unknown): Bag | undefined {
  const mechanism = bagOf(given);
  if (!mechanism) return undefined;
  const kept: Bag = {};
  for (const key of ["type", "source"]) {
    const word = mechanism[key];
    if (typeof word === "string" && WORD.test(word)) kept[key] = word;
  }
  for (const key of ["handled", "synthetic"]) {
    if (typeof mechanism[key] === "boolean") kept[key] = mechanism[key];
  }
  for (const key of ["exception_id", "parent_id"]) {
    const place = wholeNumber(mechanism[key]);
    if (place !== undefined) kept[key] = place;
  }
  return kept;
}

/** One error of the list: its class, the kind of its message, and its frames. */
function entryOf(given: unknown): Bag | null {
  const entry = bagOf(given);
  if (!entry) return null;
  const mechanism = mechanismOf(entry.mechanism);
  const frames = bagOf(entry.stacktrace)?.frames;
  return {
    type:
      typeof entry.type === "string" && CLASS.test(entry.type)
        ? entry.type
        : "Error",
    // Where the message would stand, the name of its kind: the message itself stays behind.
    value: messageKind(entry.value),
    ...(mechanism ? { mechanism } : {}),
    ...(Array.isArray(frames)
      ? {
          stacktrace: {
            type: "raw",
            frames: frames
              .slice(-FRAMES)
              .map(frameOf)
              .filter((frame) => frame !== null),
          },
        }
      : {}),
  };
}

/**
 * An error's report as it may leave. Of everything the library puts on it about the error
 * (the properties named `$exception…`), only the list of errors goes, each rebuilt from the parts
 * named above, and the level; the rest of the event is what every event carries. The page is added
 * as its address's shape, as the other failure events have it. An event that isn't an error's is
 * returned as it came; one with no error in it is not sent.
 */
export function exceptionByClass(event: CaptureResult): CaptureResult | null {
  if (event.event !== "$exception") return event;
  const given = event.properties ?? {};
  const list = Array.isArray(given.$exception_list)
    ? given.$exception_list
        .slice(0, ENTRIES)
        .map(entryOf)
        .filter((entry) => entry !== null)
    : [];
  if (list.length === 0) return null;
  const kept = Object.fromEntries(
    Object.entries(given).filter(
      ([key]) => !key.startsWith("$exception") && !key.startsWith("$sentry"),
    ),
  );
  const level = given.$exception_level;
  return {
    ...event,
    properties: {
      ...kept,
      $exception_list: list,
      $exception_level:
        typeof level === "string" && LEVELS.includes(level) ? level : "error",
      ...(typeof window !== "undefined"
        ? { route: pathShape(window.location.pathname) }
        : {}),
    },
  };
}
