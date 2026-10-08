/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/settings/plan"}
 */

/**
 * An error nobody caught, as posthog-js itself reports it, run through the dashboard's cleaning
 * (rext-control task 894). The cleaning's own tests name the parts an error's report is known to
 * have; this one runs the real library with the piece the app ships for it, so a part a posthog-js
 * upgrade adds is caught too. A recorder after the cleaning keeps each event and drops it, so
 * nothing is sent.
 */

import posthog, { type CaptureResult, type PostHogConfig } from "posthog-js";
import "posthog-js/dist/exception-autocapture";
import {
  EXCEPTION_CAPTURE,
  exceptionByClass,
} from "@/lib/analytics-exceptions";

// What a person could have typed or be called, as it would stand in an error's message.
const PLANTED = ["best crm for dentists", "ana@example.test", "Acme Dental"];

type Client = NonNullable<ReturnType<typeof posthog.init>>;
const listening: Client[] = [];

function recordEvents(
  name: string,
  clean: boolean,
): { client: Client; seen: CaptureResult[] } {
  const seen: CaptureResult[] = [];
  const record = (event: CaptureResult | null) => {
    if (event) seen.push(event);
    return null;
  };
  const cleaned = (event: CaptureResult | null) =>
    event ? exceptionByClass(event) : event;
  const config: Partial<PostHogConfig> = {
    api_host: "http://127.0.0.1:9", // never reached: the recorder drops every event
    persistence: "memory",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    advanced_disable_flags: true,
    // As the provider has it: off at the start, and started by name.
    capture_exceptions: false,
    before_send: clean ? [cleaned, record] : record,
  };
  const client = posthog.init("phc_test_not_a_real_key", config, name);
  if (!client) throw new Error("posthog-js didn't start");
  client.startExceptionAutocapture(EXCEPTION_CAPTURE);
  listening.push(client);
  return { client, seen };
}

/** As the browser tells the page of an error no code caught. */
function uncaught(error: Error): void {
  window.onerror?.(
    error.message,
    "https://app.rext.ai/_next/static/chunks/0abc.js",
    10,
    20,
    error,
  );
}

/** As the browser tells the page of a promise's failure nobody handled. */
function unhandled(reason: unknown): void {
  const told = (
    window as unknown as { onunhandledrejection?: (event: unknown) => void }
  ).onunhandledrejection;
  told?.({ type: "unhandledrejection", reason, promise: Promise.resolve() });
}

type Entry = {
  type: string;
  value: string;
  mechanism?: { type?: string; handled?: boolean };
  stacktrace?: { frames: Record<string, unknown>[] };
};

function listOf(event: CaptureResult): Entry[] {
  return event.properties.$exception_list as Entry[];
}

afterEach(() => {
  // Each client listens on the one window: the next test's errors are not this one's.
  for (const client of listening.splice(0)) client.stopExceptionAutocapture();
});

describe("posthog-js's own report of an error nobody caught", () => {
  it("leaves with the error's class and place, and without its message", () => {
    const { seen } = recordEvents("uncaught", true);

    uncaught(
      new TypeError(
        `Cannot read properties of undefined (reading '${PLANTED[0]}')`,
      ),
    );

    expect(seen).toHaveLength(1);
    expect(seen[0].event).toBe("$exception");
    const [only] = listOf(seen[0]);
    expect(only.type).toBe("TypeError");
    expect(only.value).toBe("property_of_nothing");
    expect(only.mechanism?.handled).toBe(false);
    // Each frame says where it is and nothing of what was there.
    for (const frame of only.stacktrace?.frames ?? []) {
      expect(
        Object.keys(frame).filter(
          (key) =>
            ![
              "platform",
              "filename",
              "function",
              "in_app",
              "lineno",
              "colno",
            ].includes(key),
        ),
      ).toEqual([]);
    }
    expect(seen[0].properties).toMatchObject({
      route: "/settings/plan",
      error_kind: "TypeError",
      message_kind: "property_of_nothing",
    });
    // Of all the library says about the error, two properties are left.
    expect(
      Object.keys(seen[0].properties)
        .filter((key) => key.startsWith("$exception"))
        .sort(),
    ).toEqual(["$exception_level", "$exception_list"]);
    const sent = JSON.stringify(seen);
    for (const planted of PLANTED) expect(sent).not.toContain(planted);
  });

  it("leaves a promise's failure and its cause as two classes, with neither message", () => {
    const { seen } = recordEvents("unhandled", true);
    const failure = new Error(`Saving ${PLANTED[2]} failed for ${PLANTED[1]}`);
    (failure as Error & { cause?: unknown }).cause = new RangeError(
      `${PLANTED[0]} is too long`,
    );

    unhandled(failure);
    // And a thing thrown that is no error at all.
    unhandled({ keyword: PLANTED[0] });

    expect(seen).toHaveLength(2);
    expect(listOf(seen[0]).map((one) => [one.type, one.value])).toEqual([
      ["Error", "other"],
      ["RangeError", "other"],
    ]);
    expect(listOf(seen[0])[1].mechanism?.type).toBe("chained");
    expect(listOf(seen[1]).map((one) => one.value)).toEqual(["not_an_error"]);
    const sent = JSON.stringify(seen);
    for (const planted of PLANTED) expect(sent).not.toContain(planted);
  });

  it("cleans a report the app's own code makes like any other", () => {
    const { client, seen } = recordEvents("own-call", true);

    client.captureException(
      new Error(
        `Minified React error #418; visit https://react.dev/errors/418?args[]=${PLANTED[0]}`,
      ),
      { $exception_message: PLANTED[0] },
    );

    expect(seen).toHaveLength(1);
    expect(listOf(seen[0])[0].value).toBe("react_error_418");
    expect(JSON.stringify(seen)).not.toContain(PLANTED[0]);
  });

  it("would carry the message without the cleaning (so the tests above can see a leak)", () => {
    const { seen } = recordEvents("raw", false);

    uncaught(new TypeError(`${PLANTED[0]} is not a function`));

    expect(seen).toHaveLength(1);
    expect(JSON.stringify(seen)).toContain(PLANTED[0]);
  });
});
