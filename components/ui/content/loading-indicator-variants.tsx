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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "w-full h-[85vh] max-w-md mx-auto flex items-center justify-center",
        className,
      )}
    >
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
