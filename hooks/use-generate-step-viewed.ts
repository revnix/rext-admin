"use client";

import { useEffect, useRef } from "react";

import { analytics } from "@/lib/analytics";
import {
  createStepViewTracker,
  type StepViewTracker,
} from "@/lib/generate-content/step-analytics";

/**
 * Sends `generate_step_viewed` once per arrival on a step of Generate, also when a person comes
 * back to one, and never on a re-render (rext-control task 712). `index` is the steps row's
 * current step, the step a run prepares while the page waits on it.
 */
export function useGenerateStepViewed({
  index,
  threadId,
  openedRun,
  fromLibrary,
}: {
  index: number;
  threadId: string | null;
  /**
   * The run the page was opened on, one it did not start itself (a reload, a job picked from the
   * dock); null on a new article, also once that article's run has its id.
   */
  openedRun: string | null;
  /** The run starts from a saved keyword: its two keyword steps are never shown. */
  fromLibrary: boolean;
}): void {
  const tracker = useRef<StepViewTracker | null>(null);
  const opened = useRef<string | null>(null);
  const thread = useRef(threadId);
  thread.current = threadId;
  // biome-ignore lint/correctness/useExhaustiveDependencies: an arrival is a change of step or of the run opened; a start from the Library is one for the page's life
  useEffect(() => {
    const another = tracker.current !== null && openedRun !== opened.current;
    opened.current = openedRun;
    if (another && openedRun !== null) {
      // Another run was opened on this same page (a job picked from the dock): its steps are
      // counted from the start, as on a page opened on it. The step on screen at this moment is
      // still the one of the run left behind, so it isn't counted for this one.
      tracker.current = createStepViewTracker({ restored: true, fromLibrary });
      return;
    }
    tracker.current ??= createStepViewTracker({
      restored: openedRun !== null,
      fromLibrary,
    });
    const view = tracker.current.arrive(index, Date.now());
    if (!view) return;
    analytics.track("generate_step_viewed", {
      ...view,
      thread_id: thread.current ?? undefined,
    });
  }, [index, openedRun]);
}
