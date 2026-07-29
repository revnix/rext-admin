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

  // `content_engine` is a subgraph container: it stays active from topic
  // selection all the way to the final review. Treating it as "drafting" put
  // the outline phase in the article band, and the restore path then joined the
  // stream as content — skipping the outline approve/reject step entirely.
  it("keeps the outline phase below the article band", () => {
    expect(
      deriveBackgroundProgress("running", {
        next: ["content_engine"],
        tasks: [
          {
            name: "content_engine",
            state: { next: ["generate_outline"], tasks: [] },
          },
        ],
      }),
    ).toEqual({ progress: 34, stage: "Building your outline" });

    expect(
      deriveBackgroundProgress("running", {
        next: ["content_engine"],
        tasks: [{ name: "content_engine" }],
      }).progress,
    ).toBeLessThan(42);
  });

  it("reports drafting from the nested content node", () => {
    expect(
      deriveBackgroundProgress("running", {
        next: ["content_engine"],
        tasks: [
          {
            name: "content_engine",
            state: { tasks: [{ name: "generate_content" }] },
          },
        ],
      }),
    ).toEqual({ progress: 42, stage: "Drafting your article" });
  });

  it("finds an interrupt raised inside a subgraph", () => {
    expect(
      deriveBackgroundProgress("success", {
        next: ["content_engine"],
        tasks: [
          {
            name: "content_engine",
            state: {
              next: ["review_outline"],
              tasks: [
                {
                  name: "review_outline",
                  interrupts: [{ value: { type: "outline_review" } }],
                },
              ],
            },
          },
        ],
      }),
    ).toEqual({
      progress: 38,
      stage: "Outline ready to review",
      awaitingInput: true,
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

  it("tracks the keyword research phase below the article band", () => {
    expect(
      deriveBackgroundProgress("running", { tasks: [{ name: "fetch_serp" }] }),
    ).toEqual({ progress: 5, stage: "Analyzing search results" });

    expect(
      deriveBackgroundProgress("running", { next: ["seo_engine"] }),
    ).toEqual({ progress: 10, stage: "Researching keywords" });
  });

  // A run that stops on `interrupt()` also reports "success" — without the
  // pending-task check, finished keyword analysis would claim "Article ready".
  it("reports a keyword run paused for selection as awaiting input", () => {
    expect(
      deriveBackgroundProgress("success", {
        next: ["seo_engine"],
        tasks: [
          {
            name: "seo_engine",
            interrupts: [{ value: { type: "keyword Selection" } }],
          },
        ],
      }),
    ).toEqual({
      progress: 14,
      stage: "Keywords ready to review",
      awaitingInput: true,
    });
  });

  it("reports later interactive steps as awaiting input too", () => {
    expect(
      deriveBackgroundProgress("success", {
        next: ["content_engine"],
        tasks: [
          {
            name: "content_engine",
            interrupts: [{ value: { type: "outline_review" } }],
          },
        ],
      }),
    ).toEqual({
      progress: 38,
      stage: "Outline ready to review",
      awaitingInput: true,
    });
  });

  it("falls back to a neutral awaiting stage for an unreadable interrupt", () => {
    expect(
      deriveBackgroundProgress("success", {
        next: ["content_engine"],
        tasks: [{ name: "content_engine", interrupts: [{ value: null }] }],
      }),
    ).toEqual({
      progress: 24,
      stage: "Waiting for your input",
      awaitingInput: true,
    });
  });

  it("still reports a finished article when nothing is pending", () => {
    expect(
      deriveBackgroundProgress("success", {
        next: [],
        values: { content: { final_content: { title: "Done" } } },
      }),
    ).toEqual({ progress: 100, stage: "Article ready" });
  });
});
