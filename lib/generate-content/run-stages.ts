/**
 * The run's stages in plain words (design/app-language.md §8), and how the stream moves them.
 *
 * The stream says when a graph node has finished (an `updates` event names it), never when one
 * starts. So a stage ends when one of its last nodes finishes (`endsAfter`), and the next one is
 * active from then; a phase's last stage ends when the run pauses at a gate or finishes.
 * The node names are rext-backend's (`src/flow/engines/`): the serp, seo and content subgraphs.
 */

export type RunStageState =
  | "pending"
  | "active"
  | "complete"
  | "failed"
  | "skipped";

export interface RunStageDef {
  id: string;
  label: string;
  /** The nodes whose finishing ends this stage; none for a phase's last stage. */
  endsAfter: string[];
}

export interface RunStage {
  id: string;
  label: string;
  state: RunStageState;
  /** Epoch ms. */
  startedAt?: number;
  endedAt?: number;
}

/** What the run is doing between two gates. */
export type RunPhase =
  | "analysis"
  | "content-type"
  | "titles"
  | "outline"
  | "article";

export const RUN_PHASES: Record<RunPhase, RunStageDef[]> = {
  analysis: [
    {
      id: "search-results",
      label: "Reading the search results",
      endsAfter: ["normalize_serp"],
    },
    {
      id: "competitors",
      label: "Finding competitors",
      endsAfter: ["extract_competitor", "serp_engine"],
    },
    { id: "measure", label: "Measuring the keyword", endsAfter: [] },
  ],
  "content-type": [
    { id: "content-type", label: "Choosing a content type", endsAfter: [] },
  ],
  titles: [{ id: "titles", label: "Writing five titles", endsAfter: [] }],
  outline: [
    {
      id: "keyword-groups",
      label: "Grouping the keywords",
      endsAfter: ["map_keyword_clusters"],
    },
    { id: "outline", label: "Outlining", endsAfter: [] },
  ],
  article: [
    { id: "draft", label: "Drafting", endsAfter: ["generate_content"] },
    { id: "polish", label: "Polishing", endsAfter: ["humanize_content"] },
    {
      id: "checks",
      label: "Running the quality checks",
      endsAfter: ["review_content"],
    },
    { id: "save", label: "Saving the article", endsAfter: [] },
  ],
};

/** A phase's stages as a run starts: the first active from `now`, the rest waiting. */
export function startStages(phase: RunPhase, now: number): RunStage[] {
  return RUN_PHASES[phase].map((def, index) => ({
    id: def.id,
    label: def.label,
    state: index === 0 ? "active" : "pending",
    startedAt: index === 0 ? now : undefined,
  }));
}

/**
 * A node finished. If it ends a stage still open, that stage and every one before it are complete
 * and the next is active from `now`. A node no stage ends on changes nothing.
 */
export function finishNode(
  phase: RunPhase,
  stages: RunStage[],
  node: string,
  now: number,
): RunStage[] {
  const defs = RUN_PHASES[phase];
  const index = defs.findIndex(
    (def, i) => def.endsAfter.includes(node) && stages[i]?.state !== "complete",
  );
  if (index === -1) return stages;
  return stages.map((stage, i) => {
    if (i <= index && stage.state !== "complete") {
      return {
        ...stage,
        state: "complete",
        startedAt: stage.startedAt ?? now,
        endedAt: now,
      };
    }
    if (i === index + 1 && stage.state === "pending") {
      return { ...stage, state: "active", startedAt: now };
    }
    return stage;
  });
}

/** The run reached a gate or its end: every open stage is complete. */
export function settleStages(stages: RunStage[], now: number): RunStage[] {
  return stages.map((stage) =>
    stage.state === "active" || stage.state === "pending"
      ? {
          ...stage,
          state: "complete",
          startedAt: stage.startedAt ?? now,
          endedAt: now,
        }
      : stage,
  );
}

/** The run stopped (an error, a timeout, a cancel): the active stage failed, the waiting ones never ran. */
export function failStages(stages: RunStage[], now: number): RunStage[] {
  return stages.map((stage) => {
    if (stage.state === "active") {
      return { ...stage, state: "failed", endedAt: now };
    }
    if (stage.state === "pending") return { ...stage, state: "skipped" };
    return stage;
  });
}
