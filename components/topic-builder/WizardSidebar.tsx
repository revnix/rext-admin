"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  required?: boolean;
  advanced?: boolean;
}

interface WizardSidebarProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  errors?: Record<string, string>;
  className?: string;
}

export function WizardSidebar({
  steps,
  currentStep,
  onStepClick,
  isStepCompleted,
  errors,
  className,
}: WizardSidebarProps) {
  const getStepStatus = (step: WizardStep) => {
    const isActive = step.id === currentStep;
    const isCompleted = step.id < currentStep || isStepCompleted(step.id);
    const hasError =
      errors && Object.keys(errors).length > 0 && step.id === currentStep;

    if (hasError) return "error";
    if (isActive) return "active";
    if (isCompleted) return "completed";
    return "pending";
  };

  const getStepIcon = (step: WizardStep, status: string) => {
    const StepIcon = step.icon;

    switch (status) {
      case "completed":
        return <Check className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <StepIcon className="h-4 w-4" />;
    }
  };

  const isStepClickable = (step: WizardStep) => {
    // Allow clicking on completed steps and current step
    if (step.id <= currentStep) return true;

    // For forward navigation, check if all previous steps are completed
    for (let i = 1; i < step.id; i++) {
      if (!isStepCompleted(i)) return false;
    }

    return true;
  };

  return (
    <div className={cn("w-80 min-h-full bg-muted/30 border-r", className)}>
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-6">Topic Builder Steps</h3>

        <div className="space-y-2">
          {steps.map((step) => {
            const status = getStepStatus(step);
            const isClickable = isStepClickable(step);

            return (
              <Button
                key={step.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start p-4 h-auto text-left transition-all duration-200",
                  status === "active" &&
                    "bg-primary/10 border-l-2 border-l-primary",
                  status === "completed" && "bg-green-50 hover:bg-green-100",
                  status === "error" && "bg-red-50 hover:bg-red-100",
                  !isClickable && "opacity-50 cursor-not-allowed",
                )}
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
              >
                <div className="flex items-start gap-3 w-full">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium shrink-0 mt-0.5",
                      status === "active" &&
                        "bg-primary text-primary-foreground",
                      status === "completed" && "bg-green-500 text-white",
                      status === "error" && "bg-red-500 text-white",
                      status === "pending" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {getStepIcon(step, status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "font-medium text-sm",
                        status === "active" && "text-primary",
                        status === "completed" && "text-green-700",
                        status === "error" && "text-red-700",
                      )}
                    >
                      {step.title}
                      {step.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                      {step.advanced && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Optional)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {step.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center justify-between mb-2">
              <span>Progress</span>
              <span>
                {currentStep} of {steps.length}
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
