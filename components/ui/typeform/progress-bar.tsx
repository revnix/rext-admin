/**
 * TypeForm-style Progress Bar Component
 *
 * Animated progress indicator with milestone celebrations and time estimates.
 * Provides visual feedback for multi-step processes with smooth transitions.
 */

"use client";

import { motion } from "framer-motion";
import { Clock, PartyPopper } from "lucide-react";
import * as React from "react";
import {
  MOTION_DURATION,
  useReducedMotion,
} from "@/lib/animations";
import { progressBarVariants, useTypeformMotionVariants } from "./motion";
import { cn } from "@/lib/utils";
import type { ProgressBarProps } from "@/types/typeform";

function resolveProgressBarAnimate(
  animated: boolean,
  celebrateMilestone: boolean,
): "milestone" | "animate" | undefined {
  if (!animated) return undefined;
  if (celebrateMilestone) return "milestone";
  return "animate";
}

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
    const prefersReducedMotion = useReducedMotion();
    const motionVariants = useTypeformMotionVariants(progressBarVariants);

    // Previous progress for milestone detection
    const previousProgress = React.useRef(progress);

    // Milestone timeout ref for cleanup
    const milestoneTimeoutRef = React.useRef<number | null>(null);

    // Milestone celebration state
    const [celebrateMilestone, setCelebrateMilestone] = React.useState(false);

    // Calculate progress percentage (ensure it's between 0 and 100)
    const clampedProgress = React.useMemo(() => {
      return Math.max(0, Math.min(100, progress));
    }, [progress]);

    // Detect milestone achievements (25%, 50%, 75%, 100%)
    React.useEffect(() => {
      if (!animated || !onMilestone) return;

      const milestones = [25, 50, 75, 100];
      const prevProgress = previousProgress.current;

      milestones.forEach((milestone) => {
        if (prevProgress < milestone && clampedProgress >= milestone) {
          onMilestone(milestone);
          setCelebrateMilestone(true);

          // Clear any existing timeout before creating a new one
          if (milestoneTimeoutRef.current !== null) {
            window.clearTimeout(milestoneTimeoutRef.current);
          }

          // Reset celebration after animation
          milestoneTimeoutRef.current = window.setTimeout(() => {
            setCelebrateMilestone(false);
            milestoneTimeoutRef.current = null;
          }, 1000);
        }
      });

      previousProgress.current = clampedProgress;
    }, [clampedProgress, animated, onMilestone]);

    // Cleanup milestone timeout on unmount
    React.useEffect(() => {
      return () => {
        if (milestoneTimeoutRef.current !== null) {
          window.clearTimeout(milestoneTimeoutRef.current);
          milestoneTimeoutRef.current = null;
        }
      };
    }, []);

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

        {/* Progress Bar Container */}
        <div className="relative">
          {/* Background Track */}
          <div
            className={cn(
              "w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
              "relative",
            )}
          >
            {/* Progress Fill */}
            <motion.div
              className={cn(
                "h-full bg-primary rounded-full relative",
                "shadow-sm",
              )}
              variants={animated ? motionVariants : undefined}
              initial={animated ? "initial" : undefined}
              animate={resolveProgressBarAnimate(animated, celebrateMilestone)}
              style={
                {
                  "--progress-width": `${clampedProgress}%`,
                } as React.CSSProperties
              }
              transition={
                animated && !prefersReducedMotion
                  ? {
                    width: {
                      duration: 0.4,
                      ease: "easeOut",
                    },
                  }
                  : { duration: 0 }
              }
            />

            {/* Shimmer Effect */}
            {animated && clampedProgress > 0 && clampedProgress < 100 && (
              <motion.div
                className={cn(
                  "absolute inset-y-0 left-0 w-8 bg-gradient-to-r",
                  "from-transparent via-white/20 to-transparent",
                  "transform -skew-x-12",
                )}
                animate={{
                  x: [`-32px`, `${(clampedProgress / 100) * 100 + 32}%`],
                }}
                transition={{
                  duration: MOTION_DURATION.floating,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  width: "32px",
                }}
              />
            )}
          </div>

          {/* Progress Percentage Label */}
          <div className="mt-2 text-center">
            <motion.span
              className={cn(
                "text-sm font-medium",
                clampedProgress === 100 ? "text-primary" : "text-foreground",
              )}
              animate={celebrateMilestone ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: MOTION_DURATION.veryFast }}
            >
              {Math.round(clampedProgress)}%
            </motion.span>
          </div>
        </div>

        {/* Completion Message */}
        {clampedProgress === 100 && (
          <motion.div
            className="text-center text-sm font-medium text-primary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_DURATION.veryFast, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-1">
              Complete!
              <PartyPopper className="h-4 w-4" aria-hidden="true" />
            </span>
          </motion.div>
        )}
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
export type { ProgressBarProps };
