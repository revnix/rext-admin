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
  tasks?: Array<{ name?: string }>;
};

export type BackgroundProgress = {
  progress: number;
  stage: string;
  error?: string;
};

const REVIEW_STAGE_NAMES = new Set([
  "review_content",
  "calculate_readability",
  "calculate_on_page_seo",
  "calculate_eeat_trust",
]);

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

  return {
    progress: 24,
    stage: "Preparing your article",
  };
}
