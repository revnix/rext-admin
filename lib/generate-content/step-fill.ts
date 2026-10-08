// The waits that show the next step filling in (rext-control #694, the second pass): while the
// analysis, the titles or the outline run, the step they prepare is on screen in its own layout, and
// each part appears when the run's stream sends it. The progress box moves to the step's side pane,
// and the lists it showed under its stages (the titles, the headings, the results) move to the step.

import type { KeywordMetrics } from "@/lib/keywords/keyword-metrics";
import type { RunFindings, RunView } from "./run-findings";
import type {
  RunPhase,
  RunStage,
  RunStageDetail,
  RunStageItems,
  RunTitleRow,
} from "./run-stages";

/** The waits with a step to fill in. The content type's is a moment, and the article has its page. */
export type FillPhase = "analysis" | "titles" | "outline";

const FILL_PHASES: readonly RunPhase[] = ["analysis", "titles", "outline"];

/** The step-filling wait a run's phase gets, or null for a phase that keeps the progress box alone. */
export function fillPhase(
  phase: RunPhase | null | undefined,
): FillPhase | null {
  return phase && FILL_PHASES.includes(phase) ? (phase as FillPhase) : null;
}

/** The stages' lines without the lists under them: the step beside the box shows those itself. */
export function withoutLists(
  details: Record<string, RunStageDetail>,
): Record<string, RunStageDetail> {
  return Object.fromEntries(
    Object.entries(details).map(([id, { items: _items, ...lines }]) => [
      id,
      lines,
    ]),
  );
}

/** The list a stage shows, when it is of this kind. */
function stageList<Kind extends RunStageItems["kind"]>(
  view: RunView,
  stage: string,
  kind: Kind,
): Extract<RunStageItems, { kind: Kind }> | null {
  const items = view.details[stage]?.items;
  return items?.kind === kind
    ? (items as Extract<RunStageItems, { kind: Kind }>)
    : null;
}

/** The places the titles take before the first is begun, named as the run names the ones to come. */
const TITLE_PLACES = ["First", "Second", "Third", "Fourth", "Fifth"];

/**
 * The title rows as the run has them: written, being written, and a place for each one to come.
 * Before the model begins the first, every place waits.
 */
export function fillTitleRows(view: RunView): RunTitleRow[] {
  const rows =
    stageList(view, "titles", "titles")?.rows ??
    stageList(view, "title-checks", "titles")?.rows ??
    [];
  if (rows.length > 0) return rows;
  return TITLE_PLACES.map((place) => ({
    title: `${place} title`,
    state: "next",
    checks: [],
  }));
}

/**
 * The keyword card's figures during the analysis: the measured ones once the keyword is measured,
 * and before that none, with the note the card shows in their place. The intent is the search
 * results' own, known a stage earlier.
 */
export function fillKeywordFacts(
  findings: RunFindings,
  stages: RunStage[],
): {
  metrics: KeywordMetrics;
  pending: { metrics?: string; intent?: string };
} {
  const measuring =
    stages.find((stage) => stage.id === "measure")?.state === "active";
  const intents = findings.intent ? [findings.intent] : [];
  if (findings.metrics) {
    return { metrics: { ...findings.metrics, intents }, pending: {} };
  }
  return {
    metrics: {
      difficulty: null,
      volume: null,
      volumeStatus: null,
      intents,
      backlinks: null,
      referringDomains: null,
    },
    pending: {
      metrics: measuring ? "Being measured" : "Measured next",
      ...(findings.intent ? {} : { intent: "From the competing sites" }),
    },
  };
}
