/**
 * TypeForm-style Progress Bar Component
 *
 * Progress through a multi-step flow, with the step count and an optional time
 * estimate. The fill moves by transform when the progress changes, and only
 * then (design/app-language.md §10).
 */

"use client";

import { Clock } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProgressBarProps } from "@/types/typeform";

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      progress,
      currentStep,
      totalSteps,
      showStepCounter = true,
      showTimeEstimate = false,
      estimatedTimeRemaining,
      className,
      animated = true,
      onMilestone,
      ...props
    },
    ref,
  ) => {
    // Previous progress for milestone detection
    const previousProgress = React.useRef(progress);

    // Calculate progress percentage (ensure it's between 0 and 100)
    const clampedProgress = React.useMemo(() => {
      return Math.max(0, Math.min(100, progress));
    }, [progress]);

    // Report milestones (25%, 50%, 75%, 100%) as the progress passes them
    React.useEffect(() => {
      if (!onMilestone) return;

      const prevProgress = previousProgress.current;
      for (const milestone of [25, 50, 75, 100]) {
        if (prevProgress < milestone && clampedProgress >= milestone) {
          onMilestone(milestone);
        }
      }

      previousProgress.current = clampedProgress;
    }, [clampedProgress, onMilestone]);

    // Format time estimate
    const formatTimeEstimate = React.useCallback((seconds: number): string => {
      if (seconds < 60) return `${Math.round(seconds)}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      if (remainingSeconds === 0) return `${minutes}m`;
      return `${minutes}m ${remainingSeconds}s`;
    }, []);

    return (
      <div
        ref={ref}
        className={cn("w-full space-y-3", className)}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${Math.round(clampedProgress)}% complete`}
        {...props}
      >
        {/* Progress Header */}
        {(showStepCounter || showTimeEstimate) && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {/* Step Counter */}
            {showStepCounter && currentStep && totalSteps && (
              <div className="font-medium">
                Step {currentStep} of {totalSteps}
              </div>
            )}

            {/* Time Estimate */}
            {showTimeEstimate && estimatedTimeRemaining && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>
                  ~{formatTimeEstimate(estimatedTimeRemaining)} remaining
                </span>
              </div>
            )}
          </div>
        )}

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full w-full rounded-full bg-primary",
              animated && "transition-transform duration-(--duration-base)",
            )}
            style={{ transform: `translateX(-${100 - clampedProgress}%)` }}
          />
        </div>

        <div
          className={cn(
            "text-center text-sm font-medium",
            clampedProgress === 100 ? "text-primary" : "text-foreground",
          )}
        >
          {Math.round(clampedProgress)}%
        </div>

        {clampedProgress === 100 && (
          <div className="text-center text-sm font-medium text-primary">
            Complete!
          </div>
        )}
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
export type { ProgressBarProps };
