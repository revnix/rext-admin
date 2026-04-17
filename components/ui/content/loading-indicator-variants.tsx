"use client";

import { cn } from "@/lib/utils";
import type { LoadingStep } from "@/constants/loading-steps";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { motion } from "framer-motion";

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

  const currentStepLabel = resolveCurrentStepLabel(
    activeStepIndex,
    steps,
    normalizedStatus,
    title,
  );

  const hasSteps = steps && steps.length > 0;
  const completedCount = completedSteps.length;
  const totalCount = steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn("w-full max-w-md mx-auto", className)}
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Animated pulse ring */}
        <div className="relative mb-6">
          <div className="w-14 h-14 rounded-full border border-primary/15 flex items-center justify-center bg-primary/5">
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/5" />
        </div>

        <h3 className="text-[1.35rem] font-bold tracking-tight text-foreground mb-1.5">
          {currentStepLabel}
          <span className="inline-flex gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block w-1 h-1 rounded-full bg-primary/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        </h3>

        {hasSteps && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-28 rounded-full bg-border/40 overflow-hidden">
              <motion.div
                className="h-full bg-primary/60 rounded-full"
                initial={{ width: "0%" }}
                animate={{
                  width: `${totalCount > 0 ? Math.max(((completedCount + 0.5) / totalCount) * 100, 8) : 8}%`,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground/50 font-medium tabular-nums">
              {activeStepIndex + 1} / {steps.length}
            </span>
          </div>
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
    </motion.div>
  );
}
