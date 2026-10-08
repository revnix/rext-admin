// Which of Generate's six steps a person is on, for analytics (rext-control task 712, the tracking
// plan's "Generate, step by step"): one `generate_step_viewed` per arrival on a step, with how long
// the step before it was on screen. Nothing here is kept in the browser's storage: the plan's
// consent rule allows none before the person's answer, so a reload sends the step it lands on once
// more, marked `restored`.

import { WORKFLOW_STEPS } from "./workflow-steps";

/** The six steps' names in analytics, in the stepper's order: fixed words, never a label's text. */
export const STEP_NAMES = [
  "search_keyword",
  "select_keyword",
  "content_type",
  "title",
  "outline",
  "article",
] as const;

export interface StepView {
  /** 1 to 6, the number the steps row shows. */
  step: number;
  step_name: (typeof STEP_NAMES)[number];
  /** Whole seconds the step before this one was current; absent on the first step of a page load. */
  seconds_on_previous?: number;
  /** The first step seen after the page was opened on a run that already existed. */
  restored?: true;
}

export interface StepViewTracker {
  /** The view to send for the step now current, or null when it is the one already counted. */
  arrive: (index: number, now: number) => StepView | null;
}

/**
 * Counts arrivals for one page's life. `restored`: the page was opened on a run that already
 * existed, which is never at the first step, so that step is not counted until another was seen
 * (the page shows it for a moment while the run is read). `fromLibrary`: the run starts from a
 * saved keyword and never shows the two keyword steps.
 */
export function createStepViewTracker({
  restored = false,
  fromLibrary = false,
}: {
  restored?: boolean;
  fromLibrary?: boolean;
} = {}): StepViewTracker {
  let last: { index: number; at: number } | null = null;
  return {
    arrive(index, now) {
      if (index < 0 || index >= WORKFLOW_STEPS.length) return null;
      if (last?.index === index) return null;
      if (!last && restored && index === 0) return null;
      if (fromLibrary && index <= 1) return null;
      const view: StepView = { step: index + 1, step_name: STEP_NAMES[index] };
      if (last) {
        view.seconds_on_previous = Math.max(
          0,
          Math.round((now - last.at) / 1000),
        );
      } else if (restored) {
        view.restored = true;
      }
      last = { index, at: now };
      return view;
    },
  };
}
