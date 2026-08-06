export type GenerationPipelineStep = {
  label: string;
  status: "pending" | "active" | "done";
};

type ActiveGenerationViewState = {
  message: string;
  description: string;
  pipelineSteps: GenerationPipelineStep[];
};

const PIPELINE_LABELS = [
  "Generating Content",
  "Humanizing",
  "Reviewing Content",
] as const;

export const deriveActiveGenerationViewState = (
  progress = 24,
  stage = "",
): ActiveGenerationViewState => {
  const normalizedStage = stage.toLowerCase();
  const isFinishing = progress >= 96;
  const isReviewing =
    progress >= 74 ||
    normalizedStage.includes("review") ||
    normalizedStage.includes("quality") ||
    normalizedStage.includes("seo") ||
    normalizedStage.includes("readability") ||
    normalizedStage.includes("finaliz");
  const isHumanizing =
    progress >= 58 ||
    normalizedStage.includes("human") ||
    normalizedStage.includes("refining");

  const activeIndex = isReviewing ? 2 : isHumanizing ? 1 : 0;
  const pipelineSteps = PIPELINE_LABELS.map((label, index) => ({
    label,
    status: isFinishing
      ? ("done" as const)
      : index < activeIndex
        ? ("done" as const)
        : index === activeIndex
          ? ("active" as const)
          : ("pending" as const),
  }));

  if (isFinishing) {
    return {
      message: "Preparing Your Article...",
      description: "Finishing the article and preparing the final result...",
      pipelineSteps,
    };
  }

  if (isReviewing) {
    return {
      message: "Reviewing Content...",
      description: "Checking SEO, readability, and trust signals...",
      pipelineSteps,
    };
  }

  if (isHumanizing) {
    return {
      message: "Humanizing Content...",
      description: "Improving the article's tone, clarity, and structure...",
      pipelineSteps,
    };
  }

  return {
    message: "Generating Content...",
    description: "Creating the first draft based on the approved outline...",
    pipelineSteps,
  };
};
