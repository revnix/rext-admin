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
  restored,
  fromLibrary,
}: {
  index: number;
  threadId: string | null;
  /** The page was opened on a run that already existed. */
  restored: boolean;
  /** The run starts from a saved keyword: its two keyword steps are never shown. */
  fromLibrary: boolean;
}): void {
  const tracker = useRef<StepViewTracker | null>(null);
  const thread = useRef(threadId);
  thread.current = threadId;
  // biome-ignore lint/correctness/useExhaustiveDependencies: an arrival is a change of step; how the page was opened is read once, when its first step is counted
  useEffect(() => {
    tracker.current ??= createStepViewTracker({ restored, fromLibrary });
    const view = tracker.current.arrive(index, Date.now());
    if (!view) return;
    analytics.track("generate_step_viewed", {
      ...view,
      thread_id: thread.current ?? undefined,
    });
  }, [index]);
}
