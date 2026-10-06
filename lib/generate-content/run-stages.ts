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

/** Where a running node puts the run: its phase and stage. The dock reads this from the thread's
 *  state (the nodes running when it polls), so it holds every node that can run, not only the
 *  ones that end a stage. */
export const NODE_STAGES: Record<string, { phase: RunPhase; id: string }> = {
  serp_engine: { phase: "analysis", id: "search-results" },
  fetch_serp: { phase: "analysis", id: "search-results" },
  normalize_serp: { phase: "analysis", id: "search-results" },
  extract_competitor: { phase: "analysis", id: "competitors" },
  seo_engine: { phase: "analysis", id: "measure" },
  seo_entry: { phase: "analysis", id: "measure" },
  fetch_dataforseo_backlinks: { phase: "analysis", id: "measure" },
  keyword_recommendation: { phase: "analysis", id: "measure" },
  save_keyword_research: { phase: "analysis", id: "measure" },
  recommend_content_type: { phase: "content-type", id: "content-type" },
  content_type: { phase: "content-type", id: "content-type" },
  generate_topics: { phase: "titles", id: "titles" },
  topic_generation: { phase: "titles", id: "titles" },
  keyword_clustering: { phase: "outline", id: "keyword-groups" },
  map_keyword_clusters: { phase: "outline", id: "keyword-groups" },
  generate_outline: { phase: "outline", id: "outline" },
  review_outline: { phase: "outline", id: "outline" },
  generate_content: { phase: "article", id: "draft" },
  validate_content: { phase: "article", id: "polish" },
  repair_content: { phase: "article", id: "polish" },
  humanize_content: { phase: "article", id: "polish" },
  final_validate_content: { phase: "article", id: "polish" },
  review_content: { phase: "article", id: "checks" },
  calculate_readability: { phase: "article", id: "checks" },
  calculate_on_page_seo: { phase: "article", id: "checks" },
  calculate_eeat_trust: { phase: "article", id: "checks" },
  persist_content: { phase: "article", id: "save" },
};

/**
 * A phase's stages as seen from outside the stream (the dock's poll): the given stage running
 * since `startedAt`, the ones before it done, the ones after waiting. An unknown stage id gives
 * every stage waiting.
 */
export function stagesAt(
  phase: RunPhase,
  stageId: string,
  startedAt?: number,
): RunStage[] {
  const defs = RUN_PHASES[phase];
  const at = defs.findIndex((def) => def.id === stageId);
  return defs.map((def, index) => ({
    id: def.id,
    label: def.label,
    state:
      at === -1 || index > at ? "pending" : index < at ? "complete" : "active",
    startedAt: index === at ? startedAt : undefined,
  }));
}
