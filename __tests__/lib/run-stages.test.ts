import {
  FIRST_ARTICLE_TOKEN,
  failStages,
  finishNode,
  RUN_PHASES,
  type RunStage,
  settleStages,
  stagesAt,
  startStages,
  timedOutStages,
} from "@/lib/generate-content/run-stages";
import {
  expectedStageMs,
  formatDuration,
  recordStageMs,
} from "@/lib/generate-content/run-timings";

const states = (stages: RunStage[]) => stages.map((stage) => stage.state);

describe("the keyword analysis's stages", () => {
  // The nodes in the order rext-backend's serp and seo subgraphs finish them, then the gate.
  const NODES = [
    "fetch_serp",
    "normalize_serp",
    "extract_competitor",
    "serp_engine",
    "seo_entry",
    "fetch_dataforseo_backlinks",
  ];

  it("starts on the first stage", () => {
    const stages = startStages("analysis", 1000);
    expect(states(stages)).toEqual(["active", "pending", "pending"]);
    expect(stages[0].startedAt).toBe(1000);
  });

  it("moves one stage on as each stage's last node finishes", () => {
    let stages = startStages("analysis", 0);
    stages = finishNode("analysis", stages, "fetch_serp", 1000);
    expect(states(stages)).toEqual(["active", "pending", "pending"]);
    stages = finishNode("analysis", stages, "normalize_serp", 4000);
    expect(states(stages)).toEqual(["complete", "active", "pending"]);
    expect(stages[0]).toMatchObject({ startedAt: 0, endedAt: 4000 });
    expect(stages[1].startedAt).toBe(4000);
    stages = finishNode("analysis", stages, "extract_competitor", 6000);
    expect(states(stages)).toEqual(["complete", "complete", "active"]);
    // The serp subgraph's own update repeats the end of a stage already closed: nothing moves.
    expect(finishNode("analysis", stages, "serp_engine", 6100)).toBe(stages);
  });

  it("ends every stage when the run pauses at the keyword gate", () => {
    let stages = startStages("analysis", 0);
    for (const [i, node] of NODES.entries()) {
      stages = finishNode("analysis", stages, node, (i + 1) * 1000);
    }
    expect(states(stages)).toEqual(["complete", "complete", "active"]);
    stages = settleStages(stages, 9000);
    expect(states(stages)).toEqual(["complete", "complete", "complete"]);
    expect(stages[2]).toMatchObject({ startedAt: 3000, endedAt: 9000 });
  });

  it("closes the earlier stages too when a later stage's node finishes first", () => {
    const stages = finishNode(
      "analysis",
      startStages("analysis", 0),
      "extract_competitor",
      5000,
    );
    expect(states(stages)).toEqual(["complete", "complete", "active"]);
  });
});

describe("the article's stages (rext-control #260)", () => {
  it("are Research, Draft, Style pass and Checks", () => {
    expect(startStages("article", 0).map((stage) => stage.label)).toEqual([
      "Research",
      "Draft",
      "Style pass",
      "Checks",
    ]);
  });

  it("move from Research to Draft on the first token the agent writes", () => {
    let stages = startStages("article", 0);
    stages = finishNode("article", stages, FIRST_ARTICLE_TOKEN, 30_000);
    expect(states(stages)).toEqual([
      "complete",
      "active",
      "pending",
      "pending",
    ]);
    stages = finishNode("article", stages, "generate_content", 120_000);
    expect(states(stages)).toEqual([
      "complete",
      "complete",
      "active",
      "pending",
    ]);
    stages = finishNode("article", stages, "humanize_content", 160_000);
    expect(states(stages)).toEqual([
      "complete",
      "complete",
      "complete",
      "active",
    ]);
  });

  it("close Research and Draft together when the agent's node ends without the token", () => {
    const stages = finishNode(
      "article",
      startStages("article", 0),
      "generate_content",
      90_000,
    );
    expect(states(stages)).toEqual([
      "complete",
      "complete",
      "active",
      "pending",
    ]);
  });
});

describe("a run that stops", () => {
  it("fails the active stage and skips the ones that never ran", () => {
    let stages = startStages("article", 0);
    stages = finishNode("article", stages, FIRST_ARTICLE_TOKEN, 1000);
    stages = failStages(stages, 2000);
    expect(states(stages)).toEqual([
      "complete",
      "failed",
      "skipped",
      "skipped",
    ]);
    expect(stages[1].endedAt).toBe(2000);
  });
});

describe("stagesAt, a run seen from the dock's poll", () => {
  it("has the stages before done, the given one running since its start, the rest waiting", () => {
    const stages = stagesAt("article", "draft", 5000);
    expect(states(stages)).toEqual([
      "complete",
      "active",
      "pending",
      "pending",
    ]);
    expect(stages[1].startedAt).toBe(5000);
    expect(stages[0].startedAt).toBeUndefined();
  });

  it("has every stage waiting for a stage it doesn't know", () => {
    expect(states(stagesAt("outline", "nope"))).toEqual(["pending", "pending"]);
  });
});

describe("timedOutStages, a run the time limit stopped (E22)", () => {
  it("fails the stage it stopped in, keeps the ones before done, skips the rest", () => {
    const stages = timedOutStages({ phase: "article", id: "draft" }, 9000);
    expect(states(stages)).toEqual([
      "complete",
      "failed",
      "skipped",
      "skipped",
    ]);
    expect(stages[1].endedAt).toBe(9000);
  });
});

describe("the stage names on screen", () => {
  it("are words, not the graph's node names", () => {
    const labels = Object.values(RUN_PHASES).flatMap((defs) =>
      defs.map((def) => def.label),
    );
    for (const label of labels) {
      expect(label).not.toMatch(/_|Serp|Seo Engine|Payload/);
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });
});

describe("run timings", () => {
  beforeEach(() => window.localStorage.clear());

  it("uses a typical time until a stage has run here", () => {
    expect(expectedStageMs("outline")).toBe(25_000);
    expect(expectedStageMs("unknown-stage")).toBeUndefined();
  });

  it("learns from the last five runs of a stage", () => {
    for (const ms of [1000, 2000, 3000, 4000, 5000, 6000]) {
      recordStageMs("outline", ms);
    }
    expect(expectedStageMs("outline")).toBe(4000);
  });

  it("ignores a duration that is not a positive number", () => {
    recordStageMs("titles", 0);
    recordStageMs("titles", Number.NaN);
    expect(expectedStageMs("titles")).toBe(12_000);
  });

  it.each([
    [0, "0 s"],
    [8400, "8 s"],
    [60_000, "1 min"],
    [80_000, "1 min 20 s"],
  ])("writes %d ms as %s", (ms, words) => {
    expect(formatDuration(ms)).toBe(words);
  });
});
