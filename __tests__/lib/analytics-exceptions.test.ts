/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme-dental/keywords/best-crm"}
 */

/**
 * What a report of an error nobody caught holds when it leaves (rext-control task 894): the
 * error's class, the kind of its message and the place of each frame, and never the message.
 */
import type { CaptureResult } from "posthog-js";
import {
  EXCEPTION_CAPTURE,
  exceptionByClass,
  messageKind,
} from "@/lib/analytics-exceptions";

// What a person could have typed, as it would stand in an error's message.
const KEYWORD = "best crm for dentists";

function reportOf(properties: Record<string, unknown>): CaptureResult {
  return { uuid: "u-1", event: "$exception", properties } as CaptureResult;
}

/** One error of a report as the library builds it, with a frame of the build's own. */
function entry(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: "TypeError",
    value: `Cannot read properties of undefined (reading '${KEYWORD}')`,
    mechanism: {
      type: "generic",
      handled: false,
      synthetic: false,
      exception_id: 0,
    },
    stacktrace: {
      type: "raw",
      frames: [
        {
          platform: "web:javascript",
          filename: "https://app.rext.ai/_next/static/chunks/0abc.js",
          function: "eU",
          in_app: true,
          lineno: 10,
          colno: 20,
        },
      ],
    },
    ...over,
  };
}

function listOf(report: CaptureResult | null): Record<string, unknown>[] {
  return report?.properties.$exception_list as Record<string, unknown>[];
}

function framesOf(one: Record<string, unknown>): Record<string, unknown>[] {
  return (one.stacktrace as { frames: Record<string, unknown>[] }).frames;
}

describe("messageKind", () => {
  it.each([
    [
      "Cannot read properties of undefined (reading 'map')",
      "property_of_nothing",
    ],
    ["null is not an object (evaluating 'a.b')", "property_of_nothing"],
    ['can\'t access property "x", a is undefined', "property_of_nothing"],
    ["e.items.map is not a function", "not_a_function"],
    ["workspace is not defined", "not_defined"],
    ["Can't find variable: workspace", "not_defined"],
    [
      "object is not iterable (cannot read property Symbol(Symbol.iterator))",
      "not_iterable",
    ],
    ["Failed to fetch", "request_failed"],
    ["NetworkError when attempting to fetch resource.", "request_failed"],
    ["Load failed", "request_failed"],
    ["Loading chunk 12 failed.", "chunk_load"],
    [
      "Failed to fetch dynamically imported module: https://app.rext.ai/x.js",
      "chunk_load",
    ],
    [
      "Hydration failed because the server rendered HTML didn't match the client.",
      "hydration",
    ],
    ["Maximum call stack size exceeded", "stack_overflow"],
    [
      "ResizeObserver loop completed with undelivered notifications.",
      "resize_observer",
    ],
    ["Script error.", "script_error"],
    ["The user aborted a request.", "aborted"],
    ["signal is aborted without reason", "aborted"],
    ["The request timed out", "timed_out"],
    ["Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON", "not_json"],
    ["The quota has been exceeded.", "storage"],
    ["Non-Error promise rejection captured with value: 42", "not_an_error"],
    ["Object captured as exception with keys: keyword, title", "not_an_error"],
  ])("%s is %s", (message, kind) => {
    expect(messageKind(message)).toBe(kind);
  });

  it("names React's own errors by their number", () => {
    expect(
      messageKind(
        `Minified React error #418; visit https://react.dev/errors/418?args[]=${KEYWORD} for the full message`,
      ),
    ).toBe("react_error_418");
  });

  it("is other for a message of the app's or a person's, and for what is no text", () => {
    expect(messageKind(`The keyword ${KEYWORD} could not be saved`)).toBe(
      "other",
    );
    expect(messageKind("")).toBe("other");
    expect(messageKind(undefined)).toBe("other");
    expect(messageKind({ message: "Failed to fetch" })).toBe("other");
  });
});

describe("exceptionByClass", () => {
  it("returns an event that isn't an error's as it came", () => {
    const view = {
      uuid: "u-2",
      event: "$pageview",
      properties: { $exception_message: "not this one's business" },
    } as CaptureResult;

    expect(exceptionByClass(view)).toBe(view);
  });

  it("keeps the class, the kind of message and each frame's place, and nothing else of the error", () => {
    const report = reportOf({
      $current_url: "https://app.rext.ai/settings/plan",
      plan: "growth",
      $exception_level: "error",
      $exception_message: KEYWORD,
      $exception_type: KEYWORD,
      $exception_steps: [{ message: `typed ${KEYWORD}` }],
      $sentry_event_id: KEYWORD,
      $exception_list: [
        entry({
          module: KEYWORD,
          thread_id: 1,
          mechanism: {
            type: "generic",
            handled: false,
            synthetic: false,
            exception_id: 0,
            note: KEYWORD,
          },
          stacktrace: {
            type: "raw",
            frames: [
              {
                platform: "web:javascript",
                filename: `https://app.rext.ai/_next/static/chunks/0abc.js?q=${KEYWORD}#${KEYWORD}`,
                function: "eU",
                in_app: true,
                lineno: 10,
                colno: 20,
                abs_path: KEYWORD,
                module: KEYWORD,
                context_line: `const keyword = "${KEYWORD}"`,
                pre_context: [KEYWORD],
                post_context: [KEYWORD],
                vars: { keyword: KEYWORD },
                chunk_id: KEYWORD,
              },
              {
                platform: "web:javascript",
                // An inline script's frame is the page's own address.
                filename:
                  "https://app.rext.ai/w/acme-dental/keywords/best-crm?token=entry-secret",
                function: `${KEYWORD}!`,
                in_app: false,
                lineno: 1.5,
                colno: -3,
              },
            ],
          },
        }),
      ],
    });

    const sent = exceptionByClass(report);

    expect(sent?.properties).toEqual({
      $current_url: "https://app.rext.ai/settings/plan",
      plan: "growth",
      route: "/w/*/keywords/*",
      $exception_level: "error",
      $exception_list: [
        {
          type: "TypeError",
          value: "property_of_nothing",
          mechanism: {
            type: "generic",
            handled: false,
            synthetic: false,
            exception_id: 0,
          },
          stacktrace: {
            type: "raw",
            frames: [
              {
                platform: "web:javascript",
                filename: "https://app.rext.ai/_next/static/chunks/0abc.js",
                function: "eU",
                in_app: true,
                lineno: 10,
                colno: 20,
              },
              {
                platform: "web:javascript",
                filename: "https://app.rext.ai/w/*/keywords/*",
                function: "?",
                in_app: false,
              },
            ],
          },
        },
      ],
    });
    const whole = JSON.stringify(sent);
    for (const planted of [KEYWORD, "acme-dental", "entry-secret"]) {
      expect(whole).not.toContain(planted);
    }
    // The event it was given is left as it was.
    expect(report.properties.$exception_message).toBe(KEYWORD);
  });

  it("says where a frame's code came from, and no more of an address than that", () => {
    const files = [
      "https://client.crisp.chat/static/javascripts/client.js?v=2#top",
      "blob:https://app.rext.ai/3f2a9c",
      "webpack-internal:///./lib/analytics.ts",
      "<anonymous>",
      "chunks/app.js",
      "",
      42,
    ];
    const report = reportOf({
      $exception_list: [
        entry({
          stacktrace: {
            type: "raw",
            frames: files.map((filename) => ({ filename, function: "f" })),
          },
        }),
      ],
    });

    expect(
      framesOf(listOf(exceptionByClass(report))[0]).map(
        (frame) => frame.filename,
      ),
    ).toEqual([
      "https://client.crisp.chat/static/javascripts/client.js",
      "blob:",
      "webpack-internal:",
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("takes what it doesn't know for the usual: a class, a level, a platform, a mechanism's words", () => {
    const report = reportOf({
      $exception_level: "loud",
      $exception_list: [
        entry({
          type: "Ana's workspace could not be read",
          value: 42,
          mechanism: {
            type: "With Spaces",
            source: "cause",
            handled: "no",
            synthetic: true,
            exception_id: 1,
            parent_id: 0,
          },
          stacktrace: {
            type: "raw",
            frames: [{ platform: "custom", in_app: "yes" }, "a line of text"],
          },
        }),
      ],
    });

    const sent = exceptionByClass(report);

    expect(sent?.properties.$exception_level).toBe("error");
    expect(listOf(sent)).toEqual([
      {
        type: "Error",
        value: "other",
        mechanism: {
          source: "cause",
          synthetic: true,
          exception_id: 1,
          parent_id: 0,
        },
        stacktrace: {
          type: "raw",
          frames: [{ platform: "web:javascript", function: "?", in_app: true }],
        },
      },
    ]);
  });

  it("keeps an error that came with no stack, as a thing thrown that was no error does", () => {
    const report = reportOf({
      $exception_list: [
        {
          type: "Error",
          value: "Object captured as exception with keys: keyword",
          mechanism: { type: "generic", handled: false, synthetic: true },
        },
      ],
    });

    expect(listOf(exceptionByClass(report))).toEqual([
      {
        type: "Error",
        value: "not_an_error",
        mechanism: { type: "generic", handled: false, synthetic: true },
      },
    ]);
  });

  it("keeps the first errors of a long list and the last frames of a deep stack", () => {
    const frames = Array.from({ length: 80 }, (_, line) => ({
      function: "f",
      lineno: line,
    }));
    const report = reportOf({
      $exception_list: Array.from({ length: 12 }, (_, place) =>
        entry({
          type: `Error${place}`,
          stacktrace: { type: "raw", frames },
        }),
      ),
    });

    const list = listOf(exceptionByClass(report));

    expect(list.map((one) => one.type)).toEqual(
      Array.from({ length: 8 }, (_, place) => `Error${place}`),
    );
    const kept = framesOf(list[0]).map((frame) => frame.lineno);
    expect(kept).toHaveLength(50);
    // The frame the error was thrown in is the last one.
    expect(kept[0]).toBe(30);
    expect(kept[49]).toBe(79);
  });

  it("does not send a report with no error in it", () => {
    expect(exceptionByClass(reportOf({ $exception_list: [] }))).toBeNull();
    expect(exceptionByClass(reportOf({}))).toBeNull();
    expect(exceptionByClass(reportOf({ $exception_list: KEYWORD }))).toBeNull();
    expect(
      exceptionByClass(reportOf({ $exception_list: [null, KEYWORD, [1]] })),
    ).toBeNull();
  });
});

describe("EXCEPTION_CAPTURE", () => {
  it("listens for what nobody caught, and not for the console", () => {
    expect(EXCEPTION_CAPTURE).toEqual({
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    });
  });
});
