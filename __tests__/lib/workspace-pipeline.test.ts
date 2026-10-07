/**
 * The workspace pipeline's record (G20, rext-control#549): what it says of the run a screen follows,
 * the backend's rule in a refused retry or refresh, and a stopped run in plain words.
 */

import { ApiError } from "@/lib/api-client/core";
import {
  businessRuleOf,
  PIPELINE_RUNNING_RULE,
  pipelineOutcome,
  STOPPED_RUN_SHOWN_MS,
  stoppedRunCopy,
  stoppedRunToShow,
} from "@/lib/workspace/workspace-pipeline";

const run = (
  status: "running" | "completed" | "failed" | "interrupted",
  operation_id = "op-1",
) => ({ status, operation_id, started_at: "2026-10-07T10:00:00Z" });

describe("pipelineOutcome", () => {
  it.each([
    ["running", "going"],
    ["completed", "completed"],
    ["failed", "stopped"],
    ["interrupted", "stopped"],
  ] as const)("reads %s as %s", (status, outcome) => {
    expect(pipelineOutcome(run(status), "op-1")).toBe(outcome);
  });

  it("knows nothing without a record, as for a workspace created before runs were recorded", () => {
    expect(pipelineOutcome(null, "op-1")).toBe("unknown");
    expect(pipelineOutcome(undefined)).toBe("unknown");
  });

  it("says nothing of the followed run when the record is of another one", () => {
    expect(pipelineOutcome(run("interrupted", "op-old"), "op-new")).toBe(
      "unknown",
    );
  });

  it("reads the record as it is when no run is followed", () => {
    expect(pipelineOutcome(run("interrupted"))).toBe("stopped");
  });
});

describe("businessRuleOf", () => {
  it("finds the rule in the backend's error body", () => {
    const error = new ApiError(
      400,
      "Still being read",
      "BUSINESS_RULE_VIOLATION",
      {
        success: false,
        error: {
          code: "BUSINESS_RULE_VIOLATION",
          context: { rule_name: PIPELINE_RUNNING_RULE },
        },
      },
    );
    expect(businessRuleOf(error)).toBe(PIPELINE_RUNNING_RULE);
  });

  it("has none for an error without one, or that isn't the API's", () => {
    expect(
      businessRuleOf(new ApiError(500, "Down", undefined, null)),
    ).toBeNull();
    expect(businessRuleOf(new Error("rule_name"))).toBeNull();
    expect(businessRuleOf(undefined)).toBeNull();
  });
});

describe("stoppedRunCopy", () => {
  it("names the restart for an interrupted run, with the website", () => {
    expect(
      stoppedRunCopy("interrupted", { website: "https://example.com" }),
    ).toEqual({
      title: "Reading the website was interrupted",
      body: "The app restarted while it was reading https://example.com, so the run stopped before it finished.",
    });
  });

  it("keeps a failure's own reason, and has words when there is none", () => {
    expect(
      stoppedRunCopy("failed", { reason: "The site didn't answer." }).body,
    ).toBe("The site didn't answer.");
    expect(stoppedRunCopy("failed").body).toBe(
      "The run stopped before it finished.",
    );
  });
});

describe("stoppedRunToShow", () => {
  const now = Date.parse("2026-10-07T12:00:00Z");

  it("names a run a restart interrupted, or that failed", () => {
    expect(
      stoppedRunToShow(run("interrupted"), { busy: false, now })?.title,
    ).toBe("Reading the website was interrupted");
    expect(stoppedRunToShow(run("failed"), { busy: false, now })?.title).toBe(
      "Reading the website failed",
    );
  });

  it("stays quiet while a run is going or a refresh error already says it", () => {
    expect(
      stoppedRunToShow(run("interrupted"), { busy: true, now }),
    ).toBeNull();
    expect(stoppedRunToShow(run("running"), { busy: false, now })).toBeNull();
    expect(stoppedRunToShow(run("completed"), { busy: false, now })).toBeNull();
    expect(stoppedRunToShow(null, { busy: false, now })).toBeNull();
  });

  it("lets a week-old stop go", () => {
    const later = Date.parse("2026-10-07T10:00:00Z") + STOPPED_RUN_SHOWN_MS;
    expect(
      stoppedRunToShow(run("interrupted"), { busy: false, now: later }),
    ).toBeNull();
  });
});
