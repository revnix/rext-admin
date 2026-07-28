import { deriveBackgroundProgress } from "@/lib/generate-content/background-progress";

describe("background generation progress", () => {
  it("reports queued work before the run starts", () => {
    expect(deriveBackgroundProgress("pending")).toEqual({
      progress: 8,
      stage: "Queued for generation",
    });
  });

  it("reports drafting while the content node is active", () => {
    expect(
      deriveBackgroundProgress("running", {
        values: { content: {} },
        tasks: [{ name: "generate_content" }],
      }),
    ).toEqual({
      progress: 42,
      stage: "Drafting your article",
    });
  });

  it("advances through persisted review milestones", () => {
    expect(
      deriveBackgroundProgress("running", {
        values: {
          content: {
            final_content: { title: "Draft" },
            review: {
              readability_metrics: { score: 70 },
              on_page_metrics: { score: 82 },
            },
          },
        },
      }),
    ).toEqual({
      progress: 90,
      stage: "Running quality checks",
    });
  });

  it("surfaces graph errors even before the run status changes", () => {
    expect(
      deriveBackgroundProgress("running", {
        values: {
          content: {
            error: "Generation failed: provider unavailable",
          },
        },
      }),
    ).toEqual({
      progress: 100,
      stage: "Generation failed",
      error: "Generation failed: provider unavailable",
    });
  });

  it("reports a completed article at 100 percent", () => {
    expect(deriveBackgroundProgress("success")).toEqual({
      progress: 100,
      stage: "Article ready",
    });
  });
});
