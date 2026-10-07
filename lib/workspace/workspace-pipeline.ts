import type { z } from "zod";
import { ApiError } from "@/lib/api-client/core";
import type { workspacePipelineSchema } from "@/schemas/workspace-schemas";

/**
 * The workspace pipeline's latest run, as the backend records it (task G20, rext-control#287): the
 * run that reads the website when a workspace is created, retried, or its brand voice refreshed.
 * The run lives inside the API process, so a restart or a deploy ends it without a word on the
 * stream; the record is how a screen learns that it stopped.
 */
export type WorkspacePipeline = z.infer<typeof workspacePipelineSchema>;

/**
 * How often a screen following a run reads the record. The stream reports progress faster; the
 * record catches what the stream can't, a run that a restart took with it.
 */
export const PIPELINE_POLL_MS = 10_000;

/** The backend's 400 rules for the pipeline's retry and the brand-voice refresh. */
export const PIPELINE_RUNNING_RULE = "workspace_pipeline_running";
export const PIPELINE_NOT_RETRYABLE_RULE = "workspace_pipeline_not_retryable";

/**
 * What the record says of a run: still "going", "stopped" (failed, or interrupted by a restart:
 * either can be read again), "completed", or "unknown" (no record, as for a workspace created
 * before runs were recorded, or the record is of another run than the one followed).
 */
export type PipelineOutcome = "going" | "stopped" | "completed" | "unknown";

export function pipelineOutcome(
  pipeline: WorkspacePipeline | null | undefined,
  operationId?: string | null,
): PipelineOutcome {
  if (!pipeline) return "unknown";
  if (
    operationId &&
    pipeline.operation_id &&
    pipeline.operation_id !== operationId
  ) {
    return "unknown";
  }
  switch (pipeline.status) {
    case "running":
      return "going";
    case "completed":
      return "completed";
    case "failed":
    case "interrupted":
      return "stopped";
    default:
      return "unknown";
  }
}

/** The business rule a backend error names (`rule_name` in its body's context), if any. */
export function businessRuleOf(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const find = (value: unknown, depth: number): string | null => {
    if (!value || typeof value !== "object" || depth > 4) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.rule_name === "string") return record.rule_name;
    for (const child of Object.values(record)) {
      const found = find(child, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return find(error.context, 0);
}

/**
 * A stopped run in plain words (design/app-language.md, the run's Interrupted state): a restart is
 * named as the cause, so nobody reads it as their website's fault; a failure keeps its own reason.
 */
export function stoppedRunCopy(
  status: "failed" | "interrupted",
  { website, reason }: { website?: string | null; reason?: string | null } = {},
): { title: string; body: string } {
  if (status === "interrupted") {
    return {
      title: "Reading the website was interrupted",
      body: `The app restarted while it was reading ${website || "the website"}, so the run stopped before it finished.`,
    };
  }
  return {
    title: "Reading the website failed",
    body: reason?.trim() || "The run stopped before it finished.",
  };
}

/** How long a stopped run is named on the Brand voice section: after a week the notice has said its piece. */
export const STOPPED_RUN_SHOWN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The stopped run the Brand voice section names, or null: the record's last run failed or was
 * interrupted, recently, and nothing else says it already (a run that's going, or a refresh error
 * this visit shows).
 */
export function stoppedRunToShow(
  pipeline: WorkspacePipeline | null | undefined,
  {
    busy,
    website,
    now = Date.now(),
  }: { busy: boolean; website?: string | null; now?: number },
): { title: string; body: string } | null {
  if (busy || !pipeline) return null;
  if (pipeline.status !== "interrupted" && pipeline.status !== "failed") {
    return null;
  }
  const started = pipeline.started_at ? Date.parse(pipeline.started_at) : NaN;
  if (!Number.isNaN(started) && now - started >= STOPPED_RUN_SHOWN_MS) {
    return null;
  }
  return stoppedRunCopy(pipeline.status, { website });
}
