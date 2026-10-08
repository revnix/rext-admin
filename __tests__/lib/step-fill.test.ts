import { describeRun } from "@/lib/generate-content/run-findings";
import { startStages } from "@/lib/generate-content/run-stages";
import {
  fillKeywordFacts,
  fillPhase,
  fillTitleRows,
  withoutLists,
} from "@/lib/generate-content/step-fill";

const KEYWORD = "vegetable garden planner";

describe("fillPhase", () => {
  it("names the waits whose step fills in", () => {
    expect(fillPhase("analysis")).toBe("analysis");
    expect(fillPhase("titles")).toBe("titles");
    expect(fillPhase("outline")).toBe("outline");
  });

  it("leaves the content type's moment and the article's page to themselves", () => {
    expect(fillPhase("content-type")).toBeNull();
    expect(fillPhase("article")).toBeNull();
    expect(fillPhase(null)).toBeNull();
    expect(fillPhase(undefined)).toBeNull();
  });
});

describe("withoutLists", () => {
  it("keeps each stage's lines and drops the list under it", () => {
    const lines = withoutLists({
      titles: {
        live: "3 of 5 written.",
        items: { kind: "lines", items: ["One", "Two"] },
        progress: { done: 3, total: 5, label: "3 of 5 titles written" },
      },
      "title-checks": { waiting: "Each one must contain the keyword." },
    });
    expect(lines).toEqual({
      titles: {
        live: "3 of 5 written.",
        progress: { done: 3, total: 5, label: "3 of 5 titles written" },
      },
      "title-checks": { waiting: "Each one must contain the keyword." },
    });
  });
});

describe("fillTitleRows", () => {
  const titles = { phase: "titles" as const, stages: startStages("titles", 1) };

  it("holds a place for each title before the first is begun", () => {
    const rows = fillTitleRows(describeRun(titles, {}, { keyword: KEYWORD }));
    expect(rows.map((row) => `${row.title} · ${row.state}`)).toEqual([
      "First title · next",
      "Second title · next",
      "Third title · next",
      "Fourth title · next",
      "Fifth title · next",
    ]);
  });

  it("is the run's own rows once the model writes: written, being written, to come", () => {
    const view = describeRun(
      titles,
      {
        drafts: [
          {
            title: "Vegetable Garden Planner: Map Your Beds in One Afternoon",
            complete: true,
            recommended: true,
            reason: "It answers what most searchers ask first.",
          },
          {
            title: "How to Use a Vegetable Garden",
            complete: false,
            recommended: false,
            reason: null,
          },
        ],
      },
      { keyword: KEYWORD },
    );
    const rows = fillTitleRows(view);
    expect(rows.map((row) => row.state)).toEqual([
      "written",
      "writing",
      "next",
      "next",
      "next",
    ]);
    expect(rows[0].recommended).toBe(true);
    expect(rows[0].reason).toBe("It answers what most searchers ask first.");
    expect(rows[2].title).toBe("Third title");
  });
});

describe("fillKeywordFacts", () => {
  const stages = startStages("analysis", 1);
  const measuring = stages.map((stage) => ({
    ...stage,
    state: stage.id === "measure" ? ("active" as const) : ("complete" as const),
  }));

  it("says what each figure waits for before the keyword is measured", () => {
    const { metrics, pending } = fillKeywordFacts({}, stages);
    expect(metrics.difficulty).toBeNull();
    expect(metrics.intents).toEqual([]);
    expect(pending).toEqual({
      metrics: "Measured next",
      intent: "From the competing sites",
    });
  });

  it("shows the intent as soon as the results give it, and says when the measuring runs", () => {
    const { metrics, pending } = fillKeywordFacts(
      { intent: "informational" },
      measuring,
    );
    expect(metrics.intents).toEqual(["informational"]);
    expect(pending).toEqual({ metrics: "Being measured" });
  });

  it("shows the figures once they are measured", () => {
    const { metrics, pending } = fillKeywordFacts(
      {
        intent: "commercial",
        metrics: {
          difficulty: 28,
          volume: 1900,
          volumeStatus: null,
          backlinks: 12,
          referringDomains: 9,
        },
      },
      measuring,
    );
    expect(metrics).toEqual({
      difficulty: 28,
      volume: 1900,
      volumeStatus: null,
      backlinks: 12,
      referringDomains: 9,
      intents: ["commercial"],
    });
    expect(pending).toEqual({});
  });
});
