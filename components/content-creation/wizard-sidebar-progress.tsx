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
  completion: _completion,
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
      return "border-border bg-muted/40 hover:bg-muted";
    }

    if (status === "current") {
      return "border-border bg-muted/50 hover:bg-muted";
    }

    return "border-border bg-background hover:bg-muted/40";
  };

  return (
    <motion.div
      className={cn(
        "p-3 rounded-md border-2 cursor-pointer transition-all duration-200",
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
            <Badge variant="destructive" className="text-[10px] px-1 py-0">
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
    </motion.div>
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
  completedFields: _completedFields,
  totalFields: _totalFields,
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
    </div>
  );
}
