"use client";

import { cn } from "@/lib/utils";
import type { LoadingStep } from "@/constants/loading-steps";
import { Check, Loader2 } from "lucide-react";

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

/**
 * Renders a stable step-based loading card that tolerates transient/unknown backend status values.
 */
export function LoadingIndicatorVariants({
  isLoading,
  className,
  loadingStatus,
  completedSteps = [],
  steps = [],
}: LoadingIndicatorVariantsProps) {
  if (!isLoading) return null;

  const normalizedStatus = loadingStatus?.replace(/\.\.\.$/, "") || "";

  const matchIndex = steps.findIndex(
    (s) => s.id === normalizedStatus || s.label === normalizedStatus,
  );

  const lastCompletedIndex = steps.reduce(
    (acc, s, i) =>
      completedSteps.includes(s.id) || completedSteps.includes(s.label)
        ? i
        : acc,
    -1,
  );

  const activeStepIndex = resolveActiveStepIndex(
    matchIndex,
    lastCompletedIndex,
    steps.length,
  );

  const hasSteps = steps && steps.length > 0;

  return (
    <div
      className={cn(
        "w-full h-[85vh] max-w-md mx-auto flex items-center justify-center",
        className,
      )}
    >
      {/* Steps List */}
      {hasSteps && (
        <StepList
          steps={steps}
          activeStepIndex={activeStepIndex}
          completedStepIds={completedSteps}
        />
      )}
    </div>
  );
}

/**
 * The generation's steps, one row each: done, running or waiting. It moves to the run component
 * (RunProgress, task E2) with the rest of the generation's progress.
 */
function StepList({
  steps,
  activeStepIndex,
  completedStepIds,
  className,
}: {
  steps: LoadingStep[];
  activeStepIndex: number;
  completedStepIds?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full border border-border rounded-md overflow-hidden bg-card",
        className,
      )}
    >
      <div className="divide-y divide-border">
        {steps.map((step, index) => {
          const isCompleted =
            completedStepIds?.includes(step.id) ||
            completedStepIds?.includes(step.label) ||
            index < activeStepIndex;
          const isActive = index === activeStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "relative flex items-center gap-4 px-5 py-3.5 transition-colors",
                isActive ? "bg-muted/50" : "",
                isCompleted ? "opacity-60" : "",
              )}
            >
              {/* Active left bar */}
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-foreground rounded-full" />
              )}

              {/* Step indicator */}
              <div
                className={cn(
                  "shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-colors",
                  isActive
                    ? "bg-foreground border-foreground text-background"
                    : isCompleted
                      ? "bg-muted border-border text-foreground"
                      : "bg-transparent border-border text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span className="text-xs font-medium tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
              </div>

              {/* Label */}
              <p
                className={cn(
                  "flex-1 text-label font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : isCompleted
                      ? "text-foreground/70"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>

              {/* Status indicator */}
              {isActive && (
                <span className="shrink-0 text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                  Running
                </span>
              )}
              {isCompleted && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-foreground/40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
