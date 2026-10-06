import type { RunStage } from "@/lib/generate-content/run-stages";
import type { SSEEvent } from "@/types/sse";

/**
 * The workspace analysis as run stages (design/app-language.md §8), from its operation's events
 * (`GET /api/v1/events/{operation_id}`). rext-backend's `workspace_pipeline.py` reports three steps,
 * each `<step>.started` then `.completed` or `.failed`, and ends with `pipeline.completed` or
 * `pipeline.failed`. The personas are read and saved inside the brand-voice step, and the save and
 * the embeddings report nothing of their own, so they have no stage of their own.
 */
export const WORKSPACE_ANALYSIS_STAGES = [
  { step: "scrape", id: "workspace-scrape", label: "Reading your website" },
  {
    step: "brand_voice",
    id: "workspace-brand-voice",
    label: "Writing your brand voice and personas",
  },
  {
    step: "competitor_discovery",
    id: "workspace-competitors",
    label: "Finding competitors",
  },
] as const;

/** The step an event is about ("scrape" from "scrape.started"), and what happened to it. */
function readEvent(event: SSEEvent): { step: string; outcome: string } {
  const [step, suffix] = event.step.split(".");
  return { step, outcome: suffix ?? event.status };
}

/** Where the operation's events put each stage; with no event yet, every stage waits. */
export function workspaceRunStages(events: SSEEvent[]): RunStage[] {
  const stages: RunStage[] = WORKSPACE_ANALYSIS_STAGES.map((stage) => ({
    id: stage.id,
    label: stage.label,
    state: "pending",
  }));
  for (const event of events) {
    const at = Date.parse(event.timestamp);
    const time = Number.isNaN(at) ? undefined : at;
    const { step, outcome } = readEvent(event);

    if (step === "pipeline") {
      const failed = outcome === "failed" || event.status === "failed";
      const completed = outcome === "completed" || event.status === "completed";
      if (!failed && !completed) continue;
      for (const stage of stages) {
        if (stage.state === "active") {
          stage.state = failed ? "failed" : "complete";
          stage.endedAt = time;
        } else if (stage.state === "pending") {
          stage.state = failed ? "skipped" : "complete";
        }
      }
      continue;
    }

    const index = WORKSPACE_ANALYSIS_STAGES.findIndex((s) => s.step === step);
    if (index === -1) continue;
    const stage = stages[index];
    if (outcome === "started" && stage.state === "pending") {
      stage.state = "active";
      stage.startedAt = time;
    } else if (outcome === "completed") {
      stage.state = "complete";
      stage.startedAt ??= time;
      stage.endedAt = time;
      // A step that finished means the ones before it did, whatever they reported.
      for (const earlier of stages.slice(0, index)) {
        if (earlier.state === "pending" || earlier.state === "active") {
          earlier.state = "complete";
        }
      }
    } else if (outcome === "failed") {
      stage.state = "failed";
      stage.endedAt = time;
    }
  }
  return stages;
}

/** The operation ended badly: the event that says so (a failed step or the pipeline), if any. */
export function findFailedEvent(events: SSEEvent[]): SSEEvent | undefined {
  return events.find(
    (event) =>
      event.status === "failed" || readEvent(event).outcome === "failed",
  );
}
