type ActiveGenerationViewState = {
  message: string;
  description: string;
};

/**
 * What the article view says while it waits on a run it picked up mid-way (a reload, the dock):
 * the stage the run is in, named as the run component names it (rext-control #260), from the
 * job's stage words and its progress.
 */
export const deriveActiveGenerationViewState = (
  progress = 24,
  stage = "",
): ActiveGenerationViewState => {
  const words = stage.toLowerCase();
  // Today's names first; the older ones a saved job may still hold after them.
  const isChecks =
    words.includes("check") ||
    words.includes("review") ||
    words.includes("quality") ||
    words.includes("finaliz") ||
    (!stage && progress >= 78);
  const isStylePass =
    !isChecks &&
    (words.includes("style") ||
      words.includes("human") ||
      words.includes("refining") ||
      (!stage && progress >= 58));

  if (progress >= 96) {
    return {
      message: "Preparing your article",
      description: "Finishing the article and its results.",
    };
  }
  if (isChecks) {
    return {
      message: "Checks",
      description: "Validation, readability, on-page SEO and trust.",
    };
  }
  if (isStylePass) {
    return {
      message: "Style pass",
      description:
        "Checking the draft against the outline and smoothing its wording and flow.",
    };
  }
  if (words.includes("research")) {
    return {
      message: "Research",
      description: "Searching for sources for the approved outline.",
    };
  }
  return {
    message: "Draft",
    description:
      "Writing the article from the approved outline and its sources.",
  };
};
