// The Generate flow's six steps as the stepper shows them (rext-control #693, FB2.12): which one is
// current, what the run is doing for it, and what was chosen at each one done.

import type { PageState } from "@/types/generate-content";
import { contentTypeLabel } from "./content-type-step";
import type { RunPhase, RunStage } from "./run-stages";

export interface GenerateStep {
  /** The instruction type that shows the step. */
  id: string;
  label: string;
  /** Under the step while it is current and nothing runs for it. */
  hint: string;
  /** Other instruction types that show the same step. */
  aliases?: string[];
}

export const WORKFLOW_STEPS: GenerateStep[] = [
  {
    id: "keyword",
    label: "Search keyword",
    hint: "Type a keyword to research",
  },
  {
    id: "keyword Selection",
    label: "Select keyword",
    hint: "Pick the one to write for",
  },
  {
    id: "content_type",
    label: "Content type",
    hint: "Pick the type of article",
  },
  {
    id: "topic",
    label: "Title",
    hint: "Choose one of five",
    aliases: ["topic_selection"],
  },
  {
    id: "outline_review",
    label: "Content outline",
    hint: "Review the sections",
    aliases: ["outline_reject"],
  },
  { id: "content", label: "Article", hint: "Read, edit and publish" },
];

/** The step a run's phase prepares: the analysis finds the keywords to pick from, and so on. */
const PHASE_STEP: Record<RunPhase, number> = {
  analysis: 1,
  "content-type": 2,
  titles: 3,
  outline: 4,
  article: 5,
};

/**
 * The current step's index: while the page waits on a run, the step that run prepares; otherwise
 * the step on screen, and the last one for an instruction type no step names.
 */
export function currentStepIndex(
  instructionType: string,
  waitingOn?: RunPhase | null,
): number {
  if (waitingOn) return PHASE_STEP[waitingOn];
  const index = WORKFLOW_STEPS.findIndex(
    (step) =>
      step.id === instructionType ||
      (step.aliases ?? []).includes(instructionType),
  );
  return index === -1 ? WORKFLOW_STEPS.length - 1 : index;
}

/** The stage running for the current step, when the run on screen is the one preparing it. */
export function runningStage(
  run: { phase: RunPhase; stages: RunStage[] } | null,
  current: number,
): RunStage | undefined {
  if (!run || PHASE_STEP[run.phase] !== current) return undefined;
  return run.stages.find((stage) => stage.state === "active");
}

/**
 * What was chosen at the first four steps: the keyword searched, the keyword picked, the content
 * type and the title. Picking a keyword replaces both keywords in the state, so the searched one is
 * the analysis's own (or, before it answers or on a restored run, the one typed). A restored run's
 * content type and title are the thread's own, which the view puts back; the title is else the
 * outline's or the article's. The outline's `schema_type` is no substitute for the type: it is a
 * schema.org name ("HowTo").
 */
export function stepChoices(
  state: Pick<
    PageState,
    | "analyzedKeyword"
    | "userKeyword"
    | "primaryKeyword"
    | "selectedContentType"
    | "selectedTopic"
    | "outline"
    | "allContent"
  >,
): (string | undefined)[] {
  return [
    state.analyzedKeyword || state.userKeyword || undefined,
    state.primaryKeyword || undefined,
    state.selectedContentType
      ? contentTypeLabel(state.selectedContentType)
      : undefined,
    state.selectedTopic ||
      state.outline?.title ||
      state.allContent?.title ||
      undefined,
  ];
}
