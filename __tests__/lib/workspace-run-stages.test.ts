import {
  findFailedEvent,
  workspaceRunStages,
} from "@/lib/workspace/workspace-run-stages";
import type { SSEEvent } from "@/types/sse";

// The events rext-backend's workspace pipeline sends, in its order (workspace_pipeline.py).
const at = (seconds: number) =>
  new Date(Date.UTC(2026, 9, 6, 16, 0, seconds)).toISOString();
const event = (
  step: string,
  status: SSEEvent["status"],
  seconds: number,
  message = "",
): SSEEvent => ({
  id: step,
  operation_id: "op-1",
  scope: "workspace",
  step,
  status,
  message,
  timestamp: at(seconds),
});
const states = (events: SSEEvent[]) =>
  workspaceRunStages(events).map((stage) => stage.state);

describe("workspaceRunStages", () => {
  it("names the backend's three reported steps in words", () => {
    expect(workspaceRunStages([]).map((stage) => stage.label)).toEqual([
      "Reading your website",
      "Writing your brand voice and personas",
      "Finding competitors",
    ]);
    expect(states([])).toEqual(["pending", "pending", "pending"]);
  });

  it("moves each stage on its started and completed events, with their times", () => {
    const events = [
      event("scrape.started", "started", 0),
      event("scrape.completed", "completed", 12),
      event("brand_voice.started", "started", 13),
    ];
    expect(states(events)).toEqual(["complete", "active", "pending"]);
    const [scrape, voice] = workspaceRunStages(events);
    expect((scrape.endedAt ?? 0) - (scrape.startedAt ?? 0)).toBe(12_000);
    expect(voice.startedAt).toBe(Date.parse(at(13)));
  });

  it("completes every stage when the pipeline completes", () => {
    const events = [
      event("scrape.started", "started", 0),
      event("scrape.completed", "completed", 10),
      event("brand_voice.started", "started", 11),
      event("brand_voice.completed", "completed", 70),
      event("competitor_discovery.started", "started", 71),
      event("competitor_discovery.completed", "completed", 85),
      event("pipeline.completed", "completed", 86),
    ];
    expect(states(events)).toEqual(["complete", "complete", "complete"]);
  });

  it("fails the running stage and skips the rest when the pipeline fails", () => {
    const events = [
      event("scrape.started", "started", 0),
      event("scrape.failed", "failed", 5, "The website didn't answer."),
      event("pipeline.failed", "failed", 5, "The website didn't answer."),
    ];
    expect(states(events)).toEqual(["failed", "skipped", "skipped"]);
    expect(findFailedEvent(events)?.message).toBe("The website didn't answer.");
  });

  it("skips the later stages at a failed step, without waiting for the pipeline's failure", () => {
    expect(
      states([
        event("scrape.started", "started", 0),
        event("scrape.completed", "completed", 10),
        event("brand_voice.started", "started", 11),
        event(
          "brand_voice.failed",
          "failed",
          20,
          "The brand voice couldn't be read.",
        ),
      ]),
    ).toEqual(["complete", "failed", "skipped"]);
  });

  it("closes earlier stages that never reported, once a later one completes", () => {
    expect(states([event("brand_voice.completed", "completed", 60)])).toEqual([
      "complete",
      "complete",
      "pending",
    ]);
  });

  it("has no failed event for a run that is going well", () => {
    expect(
      findFailedEvent([event("scrape.started", "started", 0)]),
    ).toBeUndefined();
  });
});
