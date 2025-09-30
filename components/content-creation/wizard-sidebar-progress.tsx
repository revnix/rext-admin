/**
 * Wizard Sidebar Progress Component
 *
 * A compact progress indicator designed for sidebar use,
 * showing step completion with visual indicators and navigation.
 */

"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Check, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  WizardStep,
  WizardStepFeedbackStateEntry,
} from "@/types/content-creation";

// ============================================================================
// TYPES
// ============================================================================

interface WizardSidebarProgressProps {
  /** Current active step index */
  currentStep: number;
  /** Step completion status */
  stepStatuses: ("completed" | "current" | "pending")[];
  /** Step completion percentages */
  stepCompletions: Record<string, number>;
  /** Step validation states */
  stepValidations: Record<
    string,
    {
      hasErrors: boolean;
      hasWarnings: boolean;
      errorCount: number;
      warningCount: number;
    }
  >;
  /** Controls when validation feedback should surface per step */
  stepFeedbackState?: Record<string, WizardStepFeedbackStateEntry>;
  /** Overall completion percentage */
  overallCompletion: number;
  /** Completed fields count */
  completedFields: number;
  /** Total fields count */
  totalFields: number;
  /** Called when step is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Whether current step can be skipped */
  canSkipCurrentStep?: boolean;
  /** Wizard steps data */
  steps: WizardStep[];
}

interface SidebarStepItemProps {
  step: WizardStep;
  stepIndex: number;
  status: "completed" | "current" | "pending";
  completion: number;
  validation: {
    hasErrors: boolean;
    hasWarnings: boolean;
    errorCount: number;
    warningCount: number;
  };
  isClickable: boolean;
  onClick: () => void;
  feedback?: WizardStepFeedbackStateEntry;
}

// ============================================================================
// SIDEBAR STEP ITEM
// ============================================================================

function SidebarStepItem({
  step,
  stepIndex,
  status,
  completion,
  validation,
  isClickable,
  onClick,
  feedback,
}: SidebarStepItemProps) {
  const showValidation = feedback?.showValidation ?? status !== "pending";
  const shouldSurfaceErrors = feedback?.showErrors ?? showValidation;
  const shouldSurfaceWarnings = feedback?.showWarnings ?? showValidation;

  const hasErrors = validation.hasErrors && shouldSurfaceErrors;
  const hasWarnings = validation.hasWarnings && shouldSurfaceWarnings;
  const errorCount = hasErrors ? validation.errorCount : 0;
  const warningCount = hasWarnings ? validation.warningCount : 0;

  const getStatusIcon = () => {
    if (hasErrors) {
      return (
        <div className="h-6 w-6 rounded-full border border-rose-500/40 bg-rose-500/10 flex items-center justify-center">
          <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
        </div>
      );
    }

    if (status === "completed") {
      return (
        <div className="h-6 w-6 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        </div>
      );
    }

    if (hasWarnings) {
      return (
        <div className="h-6 w-6 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        </div>
      );
    }

    if (status === "current") {
      return (
        <div className="h-6 w-6 rounded-full border border-border bg-muted flex items-center justify-center">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="w-6 h-6 rounded-full border border-border/50 bg-muted/60 flex items-center justify-center">
        <span className="text-xs font-medium text-muted-foreground">
          {stepIndex + 1}
        </span>
      </div>
    );
  };

  const getStatusStyles = () => {
    if (hasErrors) {
      return "border-rose-200 bg-rose-50 hover:bg-rose-100";
    }

    if (status === "completed") {
      return "border-emerald-200 bg-emerald-50 hover:bg-emerald-100";
    }

    if (hasWarnings) {
      return "border-amber-200 bg-amber-50 hover:bg-amber-100";
    }

    if (status === "current") {
      return "border-border bg-muted/50 hover:bg-muted";
    }

    return "border-border bg-background hover:bg-muted/40";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
              getStatusStyles(),
              !isClickable && "opacity-60 cursor-not-allowed",
            )}
            onClick={() => isClickable && onClick()}
            whileHover={isClickable ? { scale: 1.02 } : {}}
            whileTap={isClickable ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getStatusIcon()}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      status === "current" && "text-foreground",
                      status === "completed" && "text-emerald-700",
                      hasErrors && "text-rose-700",
                      status === "pending" &&
                        !hasErrors &&
                        !hasWarnings &&
                        "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-col gap-1">
                {hasErrors && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1 py-0"
                  >
                    {errorCount}
                  </Badge>
                )}
                {hasWarnings && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {warningCount}
                  </Badge>
                )}
                {step.optional && status !== "completed" && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    Optional
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {(completion > 0 || status === "current") && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {status === "completed" ? 100 : completion}%
                  </span>
                </div>
                <Progress
                  value={status === "completed" ? 100 : completion}
                  className="h-1"
                />
              </div>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.description}</p>
            <div className="flex flex-wrap gap-1">
              {(step.requiredFieldCount || 0) > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {step.requiredFieldCount} required
                </Badge>
              )}
              {step.optional && (
                <Badge variant="secondary" className="text-[10px]">
                  Optional
                </Badge>
              )}
              {hasErrors && (
                <Badge variant="destructive" className="text-[10px]">
                  {errorCount} error
                  {errorCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {hasWarnings && (
                <Badge variant="secondary" className="text-[10px]">
                  {warningCount} warning
                  {warningCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Sidebar progress component with compact design and rich information
 */
export function WizardSidebarProgress({
  currentStep,
  stepStatuses,
  stepCompletions,
  stepValidations,
  stepFeedbackState,
  overallCompletion,
  completedFields,
  totalFields,
  onStepClick,
  canSkipCurrentStep = false,
  steps,
}: WizardSidebarProgressProps) {
  return (
    <div className="space-y-4">
      {/* Overall progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Progress</h3>
          <Badge
            variant={
              overallCompletion >= 90
                ? "default"
                : overallCompletion >= 60
                  ? "secondary"
                  : "outline"
            }
            className="text-xs"
          >
            {overallCompletion}%
          </Badge>
        </div>

        <Progress value={overallCompletion} className="h-2" />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Step {currentStep + 1} of {stepStatuses.length}
          </span>
          <span>
            {completedFields} / {totalFields} fields
          </span>
        </div>

        {canSkipCurrentStep && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-[10px]">
              Current step is optional
            </Badge>
          </div>
        )}
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const status = stepStatuses[index];
          const completion = stepCompletions[step.id] || 0;
          const validation = stepValidations[step.id] || {
            hasErrors: false,
            hasWarnings: false,
            errorCount: 0,
            warningCount: 0,
          };
          const feedback = stepFeedbackState?.[step.id];
          const isClickable =
            onStepClick && (status === "completed" || index <= currentStep);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SidebarStepItem
                step={step}
                stepIndex={index}
                status={status}
                completion={completion}
                validation={validation}
                isClickable={!!isClickable}
                onClick={() => onStepClick?.(index)}
                feedback={feedback}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="pt-3 border-t space-y-2">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="text-center">
            <div className="font-medium text-green-600">
              {stepStatuses.filter((s) => s === "completed").length}
            </div>
            <div className="text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">
              {steps.reduce((acc, step) => {
                const validation = stepValidations[step.id];
                if (!validation) return acc;
                const feedback = stepFeedbackState?.[step.id];
                const shouldShowErrors = feedback?.showErrors ?? true;
                return acc + (validation.hasErrors && shouldShowErrors ? 1 : 0);
              }, 0)}
            </div>
            <div className="text-muted-foreground">With Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
