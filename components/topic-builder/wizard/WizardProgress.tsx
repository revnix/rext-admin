/**
 * Wizard Progress Indicator Component
 *
 * Shows current progress through the wizard with clickable steps,
 * accessibility support, and responsive design.
 */

"use client";

import { Check } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import type { QuestionConfig } from "@/types/wizard";

export interface WizardProgressProps {
  /** Current step (1-based) */
  current: number;

  /** Total number of steps */
  total: number;

  /** Progress percentage (0-100) */
  percentage: number;

  /** Click handler for step navigation */
  onStepClick?: (index: number) => void;

  /** All question configurations */
  questions: QuestionConfig[];

  /** Custom class name */
  className?: string;

  /** Show step numbers instead of just dots */
  showStepNumbers?: boolean;

  /** Compact mode for mobile */
  compact?: boolean;
}

export function WizardProgress({
  current,
  total,
  percentage,
  onStepClick,
  questions,
  className,
  showStepNumbers = false,
  compact = false,
}: WizardProgressProps) {
  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (onStepClick && stepIndex <= current) {
        onStepClick(stepIndex - 1); // Convert to 0-based index
      }
    },
    [onStepClick, current],
  );

  const getStepState = (stepNumber: number) => {
    if (stepNumber < current) return "completed";
    if (stepNumber === current) return "current";
    return "upcoming";
  };

  const getStepLabel = (stepIndex: number) => {
    const question = questions[stepIndex];
    if (!question) return `Question ${stepIndex + 1}`;

    // Task 8.4: Concise 1-2 word step titles per Phase 2.1 requirements
    const stepTitleMap: Record<string, string> = {
      wizardMode: "Mode",
      subject: "Topic",
      industry: "Industry",
      content_type: "Format",
      platform: "Platform",
      audience: "Audience",
      purpose: "Purpose",
      tone: "Tone",
      num_topics: "Count",
      notes: "Notes",
      review: "Review",
    };

    return (
      stepTitleMap[question.id] ||
      question.title.split(" ").slice(0, 2).join(" ")
    );
  };

  if (compact) {
    return (
      <div className={cn("px-4 py-3 bg-card", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Question {current} of {total}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: total }, (_, index) => {
              const stepNumber = index + 1;
              const state = getStepState(stepNumber);

              return (
                <button
                  key={stepNumber}
                  type="button"
                  onClick={() => handleStepClick(stepNumber)}
                  disabled={stepNumber > current}
                  className={cn(
                    "w-2 h-2 rounded-full transition-[scale,background-color]",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                    state === "completed" && "bg-primary",
                    state === "current" && "bg-primary scale-125",
                    state === "upcoming" && "bg-muted-foreground/30",
                    stepNumber <= current
                      ? "cursor-pointer hover:scale-110"
                      : "cursor-not-allowed",
                  )}
                  aria-label={`${getStepLabel(index)} (${state})`}
                />
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 w-full bg-muted rounded-full h-1 overflow-hidden">
          <ProgressFill percentage={percentage} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("px-6 py-4 bg-card border-b border-border", className)}>
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              Step {current} of {total}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(percentage)}% complete
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <ProgressFill percentage={percentage} />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-muted -translate-y-1/2 -z-10" />

          {Array.from({ length: total }, (_, index) => {
            const stepNumber = index + 1;
            const state = getStepState(stepNumber);
            const isClickable = onStepClick && stepNumber <= current;

            return (
              <div
                key={stepNumber}
                className="flex flex-col items-center gap-2 relative"
              >
                <button
                  type="button"
                  onClick={() => isClickable && handleStepClick(stepNumber)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex items-center justify-center rounded-full transition-[scale,background-color]",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                    showStepNumbers ? "w-8 h-8 text-sm font-medium" : "w-3 h-3",
                    state === "completed" && [
                      "bg-primary text-primary-foreground",
                      isClickable && "hover:bg-primary/90 cursor-pointer",
                    ],
                    state === "current" && [
                      "bg-primary text-primary-foreground",
                      showStepNumbers ? "scale-110" : "scale-125",
                    ],
                    state === "upcoming" && [
                      "bg-muted text-muted-foreground",
                      !isClickable && "cursor-not-allowed",
                    ],
                  )}
                  aria-label={`${getStepLabel(index)} (${state})`}
                  title={getStepLabel(index)}
                >
                  {state === "completed" ? (
                    showStepNumbers ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Check className="w-2 h-2" />
                    )
                  ) : showStepNumbers ? (
                    stepNumber
                  ) : null}
                </button>

                {/* Step Label (hidden on mobile) */}
                <div className="hidden sm:block text-center">
                  <div
                    className={cn(
                      "text-xs font-medium max-w-20 truncate",
                      state === "current"
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {getStepLabel(index)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * The bar's fill moves by transform, not width (design/app-language.md §10), and
 * only when the step changes: a CSS transition does not run on the first render.
 */
function ProgressFill({ percentage }: { percentage: number }) {
  const filled = Math.min(100, Math.max(0, percentage));
  return (
    <div
      className="h-full w-full bg-primary rounded-full transition-transform duration-(--duration-base)"
      style={{ transform: `translateX(-${100 - filled}%)` }}
    />
  );
}
