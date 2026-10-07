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

  it("calls a run whose topic step wrote no titles stopped, with its message", () => {
    const message =
      "Title ideas could not be written for this keyword just now. Please try again in a few minutes.";
    const progress = deriveBackgroundProgress("success", {
      values: {
        content: { error: message, error_code: "topic_generation_failed" },
      },
    });
    expect(progress).toEqual({
      progress: 100,
      stage: "Generation stopped",
      error: message,
    });
    expect(describeFailedJob({ title: "seo agency", ...progress })).toEqual({
      title: "Generation stopped",
      description: message,
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
    ).toEqual({ phase: "article", id: "style" });
  });

  it("falls back to the container when the inner node is unknown", () => {
    expect(
      deriveBackgroundProgress("running", inside("seo_engine", "something_new"))
        .runStage,
    ).toEqual({ phase: "analysis", id: "measure" });
  });

  it("names where a timed-out run stopped, with its error (E22)", () => {
    const progress = deriveBackgroundProgress(
      "timeout",
      inside("content_engine", "humanize_content"),
    );
    expect(progress.runStage).toEqual({ phase: "article", id: "style" });
    expect(progress.error).toBe(
      "Article generation timed out. Open it to try again.",
    );
  });

  it("names none for a run that is not running", () => {
    expect(
      deriveBackgroundProgress("pending", inside("serp_engine", "fetch_serp"))
        .runStage,
    ).toBeUndefined();
  });
});

describe("deriveBackgroundProgress, the article's stage words", () => {
  const running = (node: string, values?: object) => ({
    next: ["content_engine"],
    tasks: [
      {
        name: "content_engine",
        state: { next: [node], tasks: [{ name: node }] },
      },
    ],
    values,
  });

  it("says Draft while the agent writes", () => {
    expect(
      deriveBackgroundProgress("running", running("generate_content")).stage,
    ).toBe("Draft");
  });

  it("says Style pass once the draft exists and before any check", () => {
    expect(
      deriveBackgroundProgress(
        "running",
        running("humanize_content", { content: { final_content: {} } }),
      ).stage,
    ).toBe("Style pass");
  });

  it("says Checks while a check runs, even with the draft there", () => {
    expect(
      deriveBackgroundProgress(
        "running",
        running("calculate_readability", { content: { final_content: {} } }),
      ).stage,
    ).toBe("Checks");
    expect(
      deriveBackgroundProgress("running", running("final_validate_content"))
        .stage,
    ).toBe("Checks");
  });
});
