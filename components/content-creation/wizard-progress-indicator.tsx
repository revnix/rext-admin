"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WIZARD_STEPS } from "@/lib/content-creation/wizard-config";
import { cn } from "@/lib/utils";
import type { WizardProgressProps } from "@/types/content-creation";

// Enhanced progress indicator props
interface EnhancedWizardProgressIndicatorProps extends WizardProgressProps {
  /** Called when step is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Step completion percentages */
  stepCompletions?: Record<string, number>;
  /** Step validation states */
  stepValidations?: Record<
    string,
    {
      hasErrors: boolean;
      hasWarnings: boolean;
      errorCount: number;
      warningCount: number;
    }
  >;
  /** Whether to show detailed view */
  showDetails?: boolean;
  /** Compact mode for smaller screens */
  compact?: boolean;
  /** Time spent on each step (in seconds) */
  timeSpentPerStep?: Record<string, number>;
}

interface StepIconProps {
  status: "completed" | "current" | "pending";
  stepNumber: number;
  hasErrors?: boolean;
  hasWarnings?: boolean;
  className?: string;
}

/**
 * Enhanced step icon component with validation states
 */
function StepIcon({
  status,
  stepNumber,
  hasErrors,
  hasWarnings,
  className,
}: StepIconProps) {
  const getIconContent = () => {
    if (status === "completed") {
      return <Check className="h-4 w-4" />;
    }

    if (hasErrors) {
      return <AlertCircle className="h-4 w-4" />;
    }

    return <span className="text-sm font-medium">{stepNumber}</span>;
  };

  const getStatusStyles = () => {
    if (hasErrors) {
      return "bg-red-500 border-red-500 text-white";
    }

    if (hasWarnings) {
      return "bg-yellow-500 border-yellow-500 text-white";
    }

    switch (status) {
      case "completed":
        return "bg-green-500 border-green-500 text-white";
      case "current":
        return "bg-primary border-primary text-primary-foreground";
      default:
        return "bg-muted border-muted-foreground/30 text-muted-foreground";
    }
  };

  return (
    <motion.div
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
        getStatusStyles(),
        className,
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {getIconContent()}
    </motion.div>
  );
}

/**
 * Enhanced Wizard Progress Indicator Component
 *
 * A comprehensive progress indicator that shows detailed step information,
 * validation states, completion percentages, and interactive navigation.
 */
export function WizardProgressIndicator({
  currentStep,
  totalSteps,
  completedFields,
  totalFields,
  stepStatuses,
  canSkipCurrentStep,
  onStepClick,
  stepCompletions = {},
  stepValidations = {},
  showDetails = false,
  compact = false,
  timeSpentPerStep = {},
}: EnhancedWizardProgressIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [_hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Calculate overall completion percentage
  const overallCompletion =
    totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get step data with enhanced information
  const getStepData = (index: number) => {
    const step = WIZARD_STEPS[index];
    const status = stepStatuses[index];
    const validation = stepValidations[step?.id];
    const completion = stepCompletions[step?.id] || 0;
    const timeSpent = timeSpentPerStep[step?.id] || 0;

    return {
      step,
      status,
      validation,
      completion,
      timeSpent,
      isClickable:
        onStepClick && (status === "completed" || index <= currentStep),
    };
  };
  return (
    <TooltipProvider>
      <Card className={cn("w-full", compact && "shadow-sm")}>
        <CardContent className={cn("p-6", compact && "p-4")}>
          <div className="space-y-6">
            {/* Header with overall progress */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Progress Overview</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                  <span className="font-medium">
                    {overallCompletion}% Complete
                  </span>
                </div>
              </div>

              {compact && (
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>

            {/* Overall progress bar */}
            <div className="space-y-2">
              <Progress value={overallCompletion} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {completedFields} of {totalFields} fields completed
                </span>
                {canSkipCurrentStep && (
                  <Badge variant="secondary" className="text-[10px]">
                    Current step optional
                  </Badge>
                )}
              </div>
            </div>

            {/* Step indicators */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleContent className="space-y-4">
                <div
                  className={cn(
                    "grid gap-4",
                    compact
                      ? "grid-cols-1"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  )}
                >
                  {Array.from({ length: totalSteps }).map((_, index) => {
                    const {
                      step,
                      status,
                      validation,
                      completion,
                      timeSpent,
                      isClickable,
                    } = getStepData(index);

                    if (!step) return null;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onHoverStart={() => setHoveredStep(index)}
                        onHoverEnd={() => setHoveredStep(null)}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                                status === "current" &&
                                  "border-primary bg-primary/5",
                                status === "completed" &&
                                  "border-green-200 bg-green-50",
                                status === "pending" &&
                                  "border-muted bg-muted/30",
                                validation?.hasErrors &&
                                  "border-red-200 bg-red-50",
                                validation?.hasWarnings &&
                                  !validation.hasErrors &&
                                  "border-yellow-200 bg-yellow-50",
                                isClickable && "hover:shadow-md",
                                !isClickable && "opacity-60 cursor-not-allowed",
                              )}
                              onClick={() =>
                                isClickable && onStepClick?.(index)
                              }
                            >
                              {/* Step header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <StepIcon
                                    status={status}
                                    stepNumber={index + 1}
                                    hasErrors={validation?.hasErrors}
                                    hasWarnings={validation?.hasWarnings}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h4
                                      className={cn(
                                        "font-medium text-sm line-clamp-1",
                                        status === "current" && "text-primary",
                                        status === "completed" &&
                                          "text-green-700",
                                        status === "pending" &&
                                          "text-muted-foreground",
                                      )}
                                    >
                                      {step.title}
                                    </h4>
                                    {!compact && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {step.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Status badges */}
                                <div className="flex flex-col gap-1">
                                  {validation?.hasErrors && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] px-1"
                                    >
                                      {validation.errorCount} error
                                      {validation.errorCount !== 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                  {validation?.hasWarnings && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1"
                                    >
                                      {validation.warningCount} warning
                                      {validation.warningCount !== 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                  {timeSpent > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1"
                                    >
                                      <Clock className="h-2 w-2 mr-1" />
                                      {formatTime(timeSpent)}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar for this step */}
                              {completion > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Progress
                                    </span>
                                    <span className="font-medium">
                                      {completion}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={completion}
                                    className="h-1"
                                  />
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{step.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {step.description}
                              </p>
                              {(step.requiredFieldCount || 0) > 0 && (
                                <p className="text-xs">
                                  Required fields: {step.requiredFieldCount}
                                </p>
                              )}
                              {step.optional && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  Optional
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Has Errors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Has Warnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted border border-muted-foreground/30" />
                    <span>Pending</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
