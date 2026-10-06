import {
  readRunFailedEvent,
  readStoppedRun,
  settlesRun,
} from "@/lib/generate-content/run-events";

describe("readRunFailedEvent", () => {
  it("reads the backend's run.failed event", () => {
    expect(
      readRunFailedEvent({
        type: "run",
        step: "run.failed",
        error_code: "no_serp_data",
        serp_status: "no_results",
        message: "No search results were found for this keyword.",
      }),
    ).toEqual({
      errorCode: "no_serp_data",
      message: "No search results were found for this keyword.",
    });
  });

  it("falls back to a plain message", () => {
    expect(readRunFailedEvent({ type: "run", step: "run.failed" })).toEqual({
      errorCode: null,
      message: "This run stopped before it finished.",
    });
  });

  it.each([
    null,
    undefined,
    "run.failed",
    { type: "credits", step: "credits.exhausted" },
    { type: "run", step: "run.started" },
  ])("ignores %p", (data) => {
    expect(readRunFailedEvent(data)).toBeNull();
  });
});

describe("readStoppedRun", () => {
  it("reads a run that ended for want of search results from its state", () => {
    expect(
      readStoppedRun({
        content: {
          error: "No search results were found for this keyword.",
          error_code: "no_serp_data",
        },
      }),
    ).toBe("No search results were found for this keyword.");
    expect(readStoppedRun({ content: { error_code: "no_serp_data" } })).toBe(
      "This run stopped before it finished.",
    );
  });

  it.each([
    undefined,
    null,
    {},
    { content: {} },
    {
      content: {
        error: "Insufficient credits.",
        error_code: "insufficient_credits",
      },
    },
    { content: { error: "Something broke." } },
  ])("leaves other states to the restore path: %p", (values) => {
    expect(readStoppedRun(values)).toBeNull();
  });
});

describe("settlesRun", () => {
  it.each([
    [
      "a pause for the user",
      { event: "updates", data: { __interrupt__: [{ value: {} }] } },
    ],
    [
      "a pause inside a subgraph",
      {
        event: "updates|content_engine:1",
        data: { __interrupt__: [{ value: { type: "outline_review" } }] },
      },
    ],
    [
      "the finished article",
      { event: "updates", data: { content_engine: { content: {} } } },
    ],
    [
      "the credit gate",
      { event: "updates", data: { insufficient_credits: { content: {} } } },
    ],
    ["an empty search", { event: "updates", data: { no_serp_data: {} } }],
    [
      "a failure the backend reported",
      {
        event: "custom",
        data: { type: "run", step: "run.failed", message: "No results." },
      },
    ],
  ])("settles on %s", (_label, chunk) => {
    expect(settlesRun(chunk)).toBe(true);
  });

  it.each([
    ["run/created", { event: "run/created", data: { run_id: "r1" } }],
    [
      "a node inside the writing stage",
      {
        event: "updates|content_engine:1",
        data: { generate_content: { content: {} } },
      },
    ],
    ["a token", { event: "messages/partial", data: [{ content: "Hello" }] }],
    [
      "a progress event",
      { event: "custom", data: { type: "tool_start", name: "web_search" } },
    ],
    ["metadata", { event: "metadata", data: { run_id: "r1" } }],
    ["an empty update", { event: "updates", data: null }],
  ])("leaves the run open on %s", (_label, chunk) => {
    expect(settlesRun(chunk)).toBe(false);
  });
});
