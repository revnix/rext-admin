export type GenerationRunStatus =
  | "pending"
  | "running"
  | "error"
  | "success"
  | "timeout"
  | "interrupted";

type GenerationThreadState = {
  values?: {
    content?: {
      error?: string;
      final_content?: unknown;
      review?: {
        readability_metrics?: unknown;
        on_page_metrics?: unknown;
        trust_score?: unknown;
      };
    };
  };
  next?: string[];
  tasks?: Array<{
    name?: string;
    // The SDK types the interrupt payload as `unknown`; narrowed at read time.
    interrupts?: Array<{ value?: unknown } | null>;
  }>;
};

export type BackgroundProgress = {
  progress: number;
  stage: string;
  error?: string;
  /** The run finished by pausing for user input rather than by finishing the article. */
  awaitingInput?: boolean;
};

const REVIEW_STAGE_NAMES = new Set([
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
  topic: { progress: 32, stage: "Topics ready to review" },
  topic_selection: { progress: 32, stage: "Topics ready to review" },
  outline_review: { progress: 38, stage: "Outline ready to review" },
  outline_reject: { progress: 38, stage: "Outline ready to review" },
};

/** Stage/progress for a workflow paused on the given `interrupt()` type. */
export const deriveAwaitingInputStage = (interruptType?: string) =>
  AWAITING_INPUT_STAGES[interruptType ?? ""] ?? {
    progress: 24,
    stage: "Waiting for your input",
  };

const findPendingInterruptType = (state?: GenerationThreadState | null) => {
  for (const task of state?.tasks ?? []) {
    for (const interrupt of task?.interrupts ?? []) {
      const value = interrupt?.value;
      const type =
        value && typeof value === "object"
          ? (value as { type?: unknown }).type
          : undefined;
      if (typeof type === "string" && type.trim()) return type;
    }
  }
  return undefined;
};

export function deriveBackgroundProgress(
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
      stage: "Generation failed",
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

  if (runStatus === "interrupted") {
    return {
      progress: 100,
      stage: "Generation needs attention",
      error: "Article generation paused and needs your attention.",
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

  if (completedReviews > 0) {
    return {
      progress: Math.min(96, 78 + completedReviews * 6),
      stage: "Running quality checks",
    };
  }

  if (content?.final_content) {
    return {
      progress: 74,
      stage: "Reviewing SEO and readability",
    };
  }

  const activeNodes = [
    ...(state?.next ?? []),
    ...(state?.tasks ?? []).flatMap((task) => (task.name ? [task.name] : [])),
  ];

  if (activeNodes.some((node) => REVIEW_STAGE_NAMES.has(node))) {
    return {
      progress: 74,
      stage: "Reviewing SEO and readability",
    };
  }

  if (
    activeNodes.some(
      (node) => node === "generate_content" || node === "content_engine",
    )
  ) {
    return {
      progress: 42,
      stage: "Drafting your article",
    };
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
