import {
  readRunFailedEvent,
  readStoppedRun,
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
