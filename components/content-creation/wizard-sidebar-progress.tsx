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
import { WIZARD_STEPS } from "@/lib/content-creation/wizard-config";
import { cn } from "@/lib/utils";

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
}

interface SidebarStepItemProps {
  step: (typeof WIZARD_STEPS)[0];
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
}: SidebarStepItemProps) {
  const getStatusIcon = () => {
    if (validation.hasErrors) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    if (status === "completed") {
      return <Check className="h-4 w-4 text-green-500" />;
    }

    if (validation.hasWarnings) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }

    if (status === "current") {
      return <Target className="h-4 w-4 text-primary" />;
    }

    return (
      <div className="w-6 h-6 rounded-full bg-muted border border-muted-foreground/30 flex items-center justify-center">
        <span className="text-xs font-medium text-muted-foreground">
          {stepIndex + 1}
        </span>
      </div>
    );
  };

  const getStatusStyles = () => {
    if (validation.hasErrors) {
      return "border-red-200 bg-red-50 hover:bg-red-100";
    }

    if (status === "current") {
      return "border-primary bg-primary/5 hover:bg-primary/10";
    }

    if (status === "completed") {
      return "border-green-200 bg-green-50 hover:bg-green-100";
    }

    if (validation.hasWarnings) {
      return "border-yellow-200 bg-yellow-50 hover:bg-yellow-100";
    }

    return "border-muted bg-background hover:bg-muted/50";
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
                      status === "current" && "text-primary",
                      status === "completed" && "text-green-700",
                      validation.hasErrors && "text-red-700",
                      status === "pending" &&
                        !validation.hasErrors &&
                        !validation.hasWarnings &&
                        "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-col gap-1">
                {validation.hasErrors && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1 py-0"
                  >
                    {validation.errorCount}
                  </Badge>
                )}
                {validation.hasWarnings && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {validation.warningCount}
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
              {validation.hasErrors && (
                <Badge variant="destructive" className="text-[10px]">
                  {validation.errorCount} error
                  {validation.errorCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {validation.hasWarnings && (
                <Badge variant="secondary" className="text-[10px]">
                  {validation.warningCount} warning
                  {validation.warningCount !== 1 ? "s" : ""}
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
  overallCompletion,
  completedFields,
  totalFields,
  onStepClick,
  canSkipCurrentStep = false,
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
        {WIZARD_STEPS.map((step, index) => {
          const status = stepStatuses[index];
          const completion = stepCompletions[step.id] || 0;
          const validation = stepValidations[step.id] || {
            hasErrors: false,
            hasWarnings: false,
            errorCount: 0,
            warningCount: 0,
          };
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
              {Object.values(stepValidations).reduce(
                (acc, v) => acc + (v.hasErrors ? 1 : 0),
                0,
              )}
            </div>
            <div className="text-muted-foreground">With Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
