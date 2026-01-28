"use client";

import { cn } from "@/lib/utils";

import type { LoadingStep } from "@/constants/loading-steps";

interface LoadingIndicatorVariantsProps {
  step: string;
  isLoading: boolean;
  className?: string;
  loadingStatus?: string;
  completedSteps?: string[];
  steps?: LoadingStep[];
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

import { Loader2, Check, Circle } from "lucide-react";

export function LoadingIndicatorVariants({
  step,
  isLoading,
  className,
  loadingStatus,
  completedSteps = [],
  steps = [],
}: LoadingIndicatorVariantsProps) {
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
  const activeStepIndex =
    matchIndex !== -1
      ? matchIndex
      : lastCompletedIndex !== -1
        ? lastCompletedIndex
        : steps.length > 0
          ? 0
          : -1;

  const currentStepLabel =
    activeStepIndex !== -1
      ? steps[activeStepIndex].label
      : normalizedStatus || title;

  if (!isLoading) return null;

  const hasSteps = steps && steps.length > 0;

  return (
    <div className={cn("mt-4 w-full max-w-md mx-auto", className)}>
      {/* Header Section */}
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center",
          hasSteps ? "mb-4" : "mb-0",
        )}
      >
        <div className="relative mb-2">
          <div className="w-16 h-16 rounded-full border-slate-100 flex items-center justify-center relative">
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-serif font-medium text-slate-800 mb-1">
          {currentStepLabel}...
        </h3>

        {hasSteps && (
          <p className="text-sm text-slate-400">
            Step {activeStepIndex !== -1 ? activeStepIndex + 1 : 1} of{" "}
            {steps.length}
          </p>
        )}
      </div>

      {/* Steps List */}
      {hasSteps && (
        <div className="space-y-2 bg-white/50 backdrop-blur-sm rounded-2xl p-2">
          {steps.map((s, index) => {
            const isCompleted =
              completedSteps.includes(s.id) ||
              completedSteps.includes(s.label) ||
              (activeStepIndex !== -1 && index < activeStepIndex);
            const isActive =
              s.id === normalizedStatus || s.label === normalizedStatus;
            const isPending = !isActive && !isCompleted;

            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                  isActive
                    ? "bg-primary/5 border-primary/20 shadow-sm scale-[1.02]"
                    : "bg-slate-50/50 border-transparent",
                  isCompleted ? "bg-slate-50 border-slate-100" : "",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border transition-colors",
                    isActive
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-slate-200",
                    isCompleted
                      ? "bg-green-500 text-white border-green-500"
                      : "",
                    isPending ? "text-slate-300" : "",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : isActive ? (
                    <span className="text-xs font-bold">{index + 1}</span>
                  ) : (
                    <Circle className="w-4 h-4 fill-current text-slate-200" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate transition-colors",
                      isActive ? "text-primary" : "text-slate-500",
                      isCompleted ? "text-slate-700" : "text-slate-400",
                    )}
                  >
                    {s.label}
                  </p>
                </div>

                {isActive && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
