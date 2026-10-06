import { NODE_STAGES, type RunPhase } from "@/lib/generate-content/run-stages";
import { isStoppedRunCode } from "@/lib/generate-content/run-events";

export type GenerationRunStatus =
  | "pending"
  | "running"
  | "error"
  | "success"
  | "timeout"
  | "interrupted";

type GenerationTask = {
  name?: string;
  // The SDK types the interrupt payload as `unknown`; narrowed at read time.
  interrupts?: Array<{ value?: unknown } | null>;
  // Nested subgraph state — only present when the thread state was fetched
  // with `subgraphs: true`.
  state?: GenerationGraphState | null;
};

// Only the graph-shaped half of a thread state. Nested subgraph levels carry
// their own untyped `values`, so the walkers below read structure, not values.
type GenerationGraphState = {
  next?: string[];
  tasks?: Array<GenerationTask | null>;
};

type GenerationThreadState = GenerationGraphState & {
  values?: {
    content?: {
      error?: string;
      /** Why the backend ended the run; `STOPPED_RUN_CODES` (run-events.ts) lists those it ended on purpose. */
      error_code?: string;
      final_content?: unknown;
      review?: {
        readability_metrics?: unknown;
        on_page_metrics?: unknown;
        trust_score?: unknown;
      };
    };
  };
};

export type BackgroundProgress = {
  progress: number;
  stage: string;
  /** For a running run: the run component's phase and stage, from the nodes running now. */
  runStage?: { phase: RunPhase; id: string };
  error?: string;
  /** The run finished by pausing for user input rather than by finishing the article. */
  awaitingInput?: boolean;
};

const REVIEW_STAGE_NAMES = new Set([
  "final_validate_content",
  "review_content",
  "calculate_readability",
  "calculate_on_page_seo",
  "calculate_eeat_trust",
]);

const SERP_STAGE_NAMES = new Set([
  "serp_engine",
  "fetch_serp",
  "normalize_serp",
  "extract_competitor",
]);

const KEYWORD_STAGE_NAMES = new Set([
  "seo_engine",
  "seo_entry",
  "fetch_dataforseo_backlinks",
  "keyword_recommendation",
  "keyword_clustering",
]);

// Nodes of the `content_engine` subgraph that run *before* the article is
// written. `content_engine` itself stays active for the whole content phase, so
// only these nested names distinguish "still planning" from "drafting".
const TOPIC_STAGE_NAMES = new Set(["content_type", "topic_generation"]);
// `keyword_clustering` runs in both subgraphs; the content-phase check below
// runs first, so the duplicate resolves to whichever phase is actually active.
const OUTLINE_STAGE_NAMES = new Set([
  "keyword_clustering",
  "map_keyword_clusters",
  "generate_outline",
  "review_outline",
]);

// A run that stops on `interrupt()` completes with run status "success" while the
// thread keeps a pending task. Without this mapping every interactive step —
// keyword selection above all — would be reported as a finished article.
// Values stay ordered so the dock's monotonic progress guard never rewinds.
const AWAITING_INPUT_STAGES: Record<
  string,
  { progress: number; stage: string }
> = {
  "keyword Selection": { progress: 14, stage: "Keywords ready to review" },
  content_type: { progress: 26, stage: "Content types ready to review" },
  topic: { progress: 32, stage: "Titles ready to review" },
  topic_selection: { progress: 32, stage: "Titles ready to review" },
  outline_review: { progress: 38, stage: "Outline ready to review" },
  outline_reject: { progress: 38, stage: "Outline ready to review" },
};

/** Stage/progress for a workflow paused on the given `interrupt()` type. */
export const deriveAwaitingInputStage = (interruptType?: string) =>
  AWAITING_INPUT_STAGES[interruptType ?? ""] ?? {
    progress: 24,
    stage: "Waiting for your input",
  };

/**
 * Every pending interrupt on the thread, including the ones raised inside a
 * subgraph (`seo_engine`, `content_engine`) — those only appear under
 * `tasks[].state` when the thread state is read with `subgraphs: true`.
 */
export const collectPendingInterrupts = (
  state?: GenerationGraphState | null,
): Array<{ value?: unknown }> =>
  (state?.tasks ?? []).flatMap((task) => [
    ...((task?.interrupts ?? []).filter(Boolean) as Array<{ value?: unknown }>),
    ...collectPendingInterrupts(task?.state),
  ]);

/**
 * Every node currently active on the thread, flattened across subgraph levels.
 * The top level only ever reports the container node (`content_engine`), which
 * covers topic selection through the final review — far too coarse to derive a
 * stage from.
 */
const collectActiveNodes = (state?: GenerationGraphState | null): string[] => [
  ...(state?.next ?? []),
  ...(state?.tasks ?? []).flatMap((task) => [
    ...(task?.name ? [task.name] : []),
    ...collectActiveNodes(task?.state),
  ]),
];

const findPendingInterruptType = (state?: GenerationGraphState | null) => {
  for (const interrupt of collectPendingInterrupts(state)) {
    const value = interrupt?.value;
    const type =
      value && typeof value === "object"
        ? (value as { type?: unknown }).type
        : undefined;
    if (typeof type === "string" && type.trim()) return type;
  }
  return undefined;
};

/**
 * The run component's stage for the nodes running now: the deepest running node that has one
 * (a subgraph's own node sits under its container's name in the list).
 */
export function deriveRunStage(
  state?: GenerationGraphState | null,
): BackgroundProgress["runStage"] {
  const active = collectActiveNodes(state);
  for (let i = active.length - 1; i >= 0; i -= 1) {
    const stage = NODE_STAGES[active[i]];
    if (stage) return stage;
  }
  return undefined;
}

export function deriveBackgroundProgress(
  runStatus: GenerationRunStatus,
  state?: GenerationThreadState | null,
): BackgroundProgress {
  const progress = deriveProgressAndStage(runStatus, state);
  if (runStatus !== "running" || progress.error) return progress;
  const runStage = deriveRunStage(state);
  return runStage ? { ...progress, runStage } : progress;
}

function deriveProgressAndStage(
  runStatus: GenerationRunStatus,
  state?: GenerationThreadState | null,
): BackgroundProgress {
  const content = state?.values?.content;
  const contentError =
    typeof content?.error === "string" && content.error.trim()
      ? content.error
      : undefined;

  if (contentError) {
    return {
      progress: 100,
      // A run the backend ended on purpose (no search results, no titles) is
      // not a failure of the system.
      stage: isStoppedRunCode(content?.error_code)
        ? "Generation stopped"
        : "Generation failed",
      error: contentError,
    };
  }

  if (runStatus === "error" || runStatus === "timeout") {
    return {
      progress: 100,
      stage: "Generation failed",
      error:
        runStatus === "timeout"
          ? "Article generation timed out. Open it to try again."
          : "We could not finish this article. Open it to try again.",
    };
  }

  // LangGraph reports a cancelled run as "interrupted" (so does a run killed by
  // a server restart) — either way the work stopped and will not resume.
  if (runStatus === "interrupted") {
    return {
      progress: 100,
      stage: "Generation stopped",
      error: "This generation was stopped before it finished.",
    };
  }

  if (runStatus === "success") {
    // Paused on an interrupt: the phase finished but the workflow needs the user.
    if (state?.next?.length) {
      return {
        ...deriveAwaitingInputStage(findPendingInterruptType(state)),
        awaitingInput: true,
      };
    }
    return { progress: 100, stage: "Article ready" };
  }

  if (runStatus === "pending") {
    return { progress: 8, stage: "Queued for generation" };
  }

  const review = content?.review;
  const completedReviews = [
    review?.readability_metrics,
    review?.on_page_metrics,
    review?.trust_score,
  ].filter(Boolean).length;

  // The article's stages by the run component's names (rext-control #260): Research and Draft
  // (one node, so the poll says Draft), Style pass, Checks.
  if (completedReviews > 0) {
    return {
      progress: Math.min(96, 78 + completedReviews * 6),
      stage: "Checks",
    };
  }

  const activeNodes = collectActiveNodes(state);

  if (activeNodes.some((node) => REVIEW_STAGE_NAMES.has(node))) {
    return {
      progress: 74,
      stage: "Checks",
    };
  }

  // The draft exists and no check has run yet: the style pass.
  if (content?.final_content) {
    return {
      progress: 74,
      stage: "Style pass",
    };
  }

  if (activeNodes.includes("generate_content")) {
    return {
      progress: 42,
      stage: "Draft",
    };
  }

  // Somewhere inside the content subgraph but not yet writing. `content_engine`
  // alone must never claim the article band: it is also active while the topic
  // and outline steps run, and reporting 42 there makes the frontend restore an
  // in-progress *outline* as if it were the article — skipping outline review.
  if (activeNodes.includes("content_engine")) {
    if (activeNodes.some((node) => OUTLINE_STAGE_NAMES.has(node))) {
      return { progress: 34, stage: "Building your outline" };
    }
    if (activeNodes.some((node) => TOPIC_STAGE_NAMES.has(node))) {
      return { progress: 28, stage: "Preparing your titles" };
    }
    return { progress: 26, stage: "Planning your article" };
  }

  if (activeNodes.some((node) => SERP_STAGE_NAMES.has(node))) {
    return { progress: 5, stage: "Analyzing search results" };
  }

  if (activeNodes.some((node) => KEYWORD_STAGE_NAMES.has(node))) {
    return { progress: 10, stage: "Researching keywords" };
  }

  return {
    progress: 24,
    stage: "Preparing your article",
  };
}

/**
 * The words for a job that ended without an article, in the dock's toast and
 * notification. A stopped run (a keyword with no search results, a cancelled
 * run) is not a failure of the system, and its reason is more useful than the
 * keyword it was for.
 */
export function describeFailedJob(job: {
  title: string;
  stage?: string;
  error?: string;
}): { title: string; description: string } {
  if (job.stage === "Generation stopped") {
    return {
      title: "Generation stopped",
      description:
        job.error?.trim() || `"${job.title}" stopped before it finished.`,
    };
  }
  return {
    title: "Article generation failed",
    description: `"${job.title}" could not be completed.`,
  };
}
