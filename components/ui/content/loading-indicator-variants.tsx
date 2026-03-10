"use client";

import { cn } from "@/lib/utils";
import type { LoadingStep } from "@/constants/loading-steps";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

/**
 * Props for the multi-step loading indicator variant used in content generation.
 */
interface LoadingIndicatorVariantsProps {
  /** Backend step identifier (or UI fallback key). */
  step: string;
  /** Whether loading UI should be rendered. */
  isLoading: boolean;
  /** Optional container class override. */
  className?: string;
  /** Raw status text returned by backend progress events. */
  loadingStatus?: string;
  /** IDs/labels that have completed so far. */
  completedSteps?: string[];
  /** Ordered loading steps shown in the card. */
  steps?: LoadingStep[];
}

function resolveActiveStepIndex(
  matchIndex: number,
  lastCompletedIndex: number,
  stepCount: number,
): number {
  if (matchIndex !== -1) return matchIndex;
  if (lastCompletedIndex !== -1) return lastCompletedIndex;
  if (stepCount > 0) return 0;
  return -1;
}

function resolveCurrentStepLabel(
  activeStepIndex: number,
  steps: LoadingStep[],
  normalizedStatus: string,
  fallbackTitle: string,
): string {
  if (activeStepIndex !== -1) return steps[activeStepIndex].label;
  return normalizedStatus || fallbackTitle;
}

const STEP_DATA: Record<string, { title: string }> = {
  keyword: { title: "Analyzing Keyword" },
  "keyword Selection": { title: "Analyzing Keyword" },
  topic: { title: "Content Type Generation" },
  content_type: { title: "Determining Content Type" },
  outline_review: { title: "Generating Content Outline" },
  outline: { title: "Generating Content Outline" },
  content: { title: "Generating Content" },
  default: { title: "Processing" },
};

/**
 * Renders a stable step-based loading card that tolerates transient/unknown backend status values.
 */
export function LoadingIndicatorVariants({
  step,
  isLoading,
  className,
  loadingStatus,
  completedSteps = [],
  steps = [],
}: LoadingIndicatorVariantsProps) {
  if (!isLoading) return null;

  const data = STEP_DATA[step] || STEP_DATA.default;
  const { title } = data;

  // Clean up the status text to match our IDs (remove "..." and trim)
  const normalizedStatus = loadingStatus?.replace(/\.\.\.$/, "") || "";

  // Find current active index
  const matchIndex = steps.findIndex(
    (s) => s.id === normalizedStatus || s.label === normalizedStatus,
  );

  // Find the most recently completed step
  const lastCompletedIndex = steps.reduce(
    (acc, s, i) =>
      completedSteps.includes(s.id) || completedSteps.includes(s.label)
        ? i
        : acc,
    -1,
  );

  // Logic:
  // 1. If we have a direct match (backend reported a known node), use it.
  // 2. If no direct match (e.g., between nodes or unknown node), stay on the last completed step.
  // 3. Fallback to 0 if nothing has completed yet.
  const activeStepIndex = resolveActiveStepIndex(
    matchIndex,
    lastCompletedIndex,
    steps.length,
  );

  const currentStepLabel = resolveCurrentStepLabel(
    activeStepIndex,
    steps,
    normalizedStatus,
    title,
  );

  const hasSteps = steps && steps.length > 0;

  return (
    <div className={cn("mt-4 w-full max-w-md mx-auto", className)}>
      {/* Header Section */}
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center",
          hasSteps ? "mb-8" : "mb-0",
        )}
      >
        <h3 className="text-xl font-bold tracking-tight text-foreground mb-1">
          {currentStepLabel}...
        </h3>

        {hasSteps && (
          <p className="text-sm text-muted-foreground">
            Step {activeStepIndex + 1} of {steps.length}
          </p>
        )}
      </div>

      {/* Steps List */}
      {hasSteps && (
        <LoadingIndicator
          variant="steps"
          steps={steps}
          activeStepIndex={activeStepIndex}
          completedStepIds={completedSteps}
        />
      )}
    </div>
  );
}
