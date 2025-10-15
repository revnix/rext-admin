"use client";

import { Check, Circle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/types/onboarding";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  skippedSteps: number[];
  onStepClick?: (step: number) => void;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  completedSteps,
  skippedSteps,
  onStepClick,
}: OnboardingProgressProps) {
  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return "completed";
    if (skippedSteps.includes(stepIndex)) return "skipped";
    if (stepIndex === currentStep) return "current";
    if (stepIndex < currentStep) return "accessible";
    return "upcoming";
  };

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(currentStep / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between">
          {ONBOARDING_STEPS.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable =
              status === "accessible" || status === "completed";

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 group transition-opacity",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default",
                )}
                type="button"
              >
                {/* Circle indicator */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    status === "completed" &&
                      "bg-primary border-primary text-primary-foreground",
                    status === "current" &&
                      "bg-background border-primary text-primary ring-4 ring-primary/20",
                    status === "skipped" &&
                      "bg-muted border-muted-foreground/30 text-muted-foreground",
                    status === "accessible" &&
                      "bg-background border-primary/50 text-primary/50",
                    status === "upcoming" &&
                      "bg-muted border-muted-foreground/20 text-muted-foreground/50",
                  )}
                >
                  {status === "completed" ? (
                    <Check className="h-5 w-5" />
                  ) : status === "skipped" ? (
                    <Minus className="h-5 w-5" />
                  ) : (
                    <Circle
                      className={cn(
                        "h-3 w-3",
                        status === "current" && "fill-current",
                      )}
                    />
                  )}
                </div>

                {/* Step label */}
                <div className="text-center max-w-[100px]">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      status === "current" && "text-foreground",
                      status === "completed" && "text-foreground",
                      status === "skipped" && "text-muted-foreground",
                      (status === "accessible" || status === "upcoming") &&
                        "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current step description */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {ONBOARDING_STEPS[currentStep]?.description}
        </p>
      </div>
    </div>
  );
}
