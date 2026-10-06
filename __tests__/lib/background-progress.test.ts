import {
  deriveBackgroundProgress,
  describeFailedJob,
} from "@/lib/generate-content/background-progress";

describe("deriveBackgroundProgress, a run that ended with an error", () => {
  it("calls a run with no search results stopped, with its message", () => {
    expect(
      deriveBackgroundProgress("success", {
        values: {
          content: {
            error: "No search results were found for this keyword.",
            error_code: "no_serp_data",
          },
        },
      }),
    ).toEqual({
      progress: 100,
      stage: "Generation stopped",
      error: "No search results were found for this keyword.",
    });
  });

  it("keeps calling other errors a failure", () => {
    expect(
      deriveBackgroundProgress("success", {
        values: {
          content: {
            error: "Insufficient credits.",
            error_code: "insufficient_credits",
          },
        },
      }).stage,
    ).toBe("Generation failed");
  });
});

describe("describeFailedJob", () => {
  it("words a stopped run with its reason", () => {
    expect(
      describeFailedJob({
        title: "xkqz",
        stage: "Generation stopped",
        error: "No search results were found for this keyword.",
      }),
    ).toEqual({
      title: "Generation stopped",
      description: "No search results were found for this keyword.",
    });
    expect(
      describeFailedJob({ title: "xkqz", stage: "Generation stopped" }),
    ).toEqual({
      title: "Generation stopped",
      description: '"xkqz" stopped before it finished.',
    });
  });

  it("keeps calling other endings a failure", () => {
    expect(
      describeFailedJob({
        title: "Running shoes",
        stage: "Generation failed",
        error: "x",
      }),
    ).toEqual({
      title: "Article generation failed",
      description: '"Running shoes" could not be completed.',
    });
  });
});

describe("deriveBackgroundProgress, the run component's stage", () => {
  // The thread's state as the status route reads it (`subgraphs: true`): the top level names the
  // container node, its task's state the node running inside it.
  const inside = (container: string, node: string) => ({
    next: [container],
    tasks: [
      { name: container, state: { next: [node], tasks: [{ name: node }] } },
    ],
  });

  it("names the stage of the node running inside a subgraph", () => {
    expect(
      deriveBackgroundProgress(
        "running",
        inside("serp_engine", "extract_competitor"),
      ).runStage,
    ).toEqual({ phase: "analysis", id: "competitors" });
    expect(
      deriveBackgroundProgress(
        "running",
        inside("content_engine", "generate_outline"),
      ).runStage,
    ).toEqual({ phase: "outline", id: "outline" });
    expect(
      deriveBackgroundProgress(
        "running",
        inside("content_engine", "humanize_content"),
      ).runStage,
    ).toEqual({ phase: "article", id: "polish" });
  });

  it("falls back to the container when the inner node is unknown", () => {
    expect(
      deriveBackgroundProgress("running", inside("seo_engine", "something_new"))
        .runStage,
    ).toEqual({ phase: "analysis", id: "measure" });
  });

  it("names none for a run that is not running", () => {
    expect(
      deriveBackgroundProgress("pending", inside("serp_engine", "fetch_serp"))
        .runStage,
    ).toBeUndefined();
  });
});
