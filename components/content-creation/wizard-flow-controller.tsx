/**
 * Wizard Flow Controller
 *
 * Advanced flow control component that manages wizard navigation logic,
 * step transitions, validation flows, and user guidance.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Info,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import { WIZARD_STEPS } from "@/lib/content-creation/wizard-config";
import { cn } from "@/lib/utils";
import type { PartialContentCreationFormData } from "@/types/content-creation";

// ============================================================================
// TYPES
// ============================================================================

export interface FlowControllerProps {
  /** Current step index */
  currentStep: number;
  /** Form data */
  formData: PartialContentCreationFormData;
  /** Dependency engine for validation */
  dependencyEngine: WizardDependencyEngine;
  /** Whether form has unsaved changes */
  hasUnsavedChanges: boolean;
  /** Navigation handlers */
  onStepChange: (stepIndex: number) => void;
  onSaveDraft: () => void;
  /** Display mode */
  mode?: "full" | "compact" | "minimal";
  /** Whether to show guidance */
  showGuidance?: boolean;
  /** Whether to enable smart navigation */
  enableSmartNavigation?: boolean;
}

export interface FlowState {
  /** Recommended next action */
  recommendedAction:
    | "complete-current"
    | "fix-errors"
    | "proceed-next"
    | "review-all"
    | "submit";
  /** Priority issues to address */
  priorityIssues: Array<{
    stepIndex: number;
    stepTitle: string;
    issueType: "error" | "warning" | "incomplete";
    message: string;
    severity: "high" | "medium" | "low";
  }>;
  /** Available navigation options */
  navigationOptions: Array<{
    action:
      | "next"
      | "previous"
      | "skip"
      | "goto-step"
      | "goto-error"
      | "goto-incomplete";
    label: string;
    enabled: boolean;
    reason?: string;
    stepIndex?: number;
  }>;
  /** Flow completion percentage */
  completionPercentage: number;
  /** Estimated time to completion */
  estimatedTimeToComplete?: number;
}

// ============================================================================
// FLOW ANALYSIS FUNCTIONS
// ============================================================================

function analyzeWizardFlow(
  currentStep: number,
  formData: PartialContentCreationFormData,
  dependencyEngine: WizardDependencyEngine,
): FlowState {
  const fullValidation = dependencyEngine.validateAll();
  const priorityIssues: FlowState["priorityIssues"] = [];
  const navigationOptions: FlowState["navigationOptions"] = [];

  // Analyze each step for issues
  WIZARD_STEPS.forEach((step, index) => {
    const stepValidation = dependencyEngine.validateStep(step);
    const visibleFields = dependencyEngine.getVisibleFields(step);

    // Add errors
    Object.entries(stepValidation.errors).forEach(([fieldId, error]) => {
      if (error) {
        priorityIssues.push({
          stepIndex: index,
          stepTitle: step.title,
          issueType: "error",
          message: `${fieldId}: ${error}`,
          severity: index <= currentStep ? "high" : "medium",
        });
      }
    });

    // Add incomplete required fields
    const requiredFields = visibleFields.filter((field) => field.required);
    const incompleteRequired = requiredFields.filter((field) => {
      const value = formData[field.id];
      return (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    });

    if (incompleteRequired.length > 0) {
      priorityIssues.push({
        stepIndex: index,
        stepTitle: step.title,
        issueType: "incomplete",
        message: `${incompleteRequired.length} required field${incompleteRequired.length === 1 ? "" : "s"} incomplete`,
        severity: index <= currentStep ? "high" : "low",
      });
    }
  });

  // Sort issues by severity and step order
  priorityIssues.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    return a.stepIndex - b.stepIndex;
  });

  // Determine recommended action
  let recommendedAction: FlowState["recommendedAction"];
  const currentStepIssues = priorityIssues.filter(
    (issue) => issue.stepIndex === currentStep,
  );
  const hasHighPriorityIssues = priorityIssues.some(
    (issue) => issue.severity === "high",
  );

  if (fullValidation.readyForSubmission) {
    recommendedAction = "submit";
  } else if (currentStepIssues.length > 0) {
    recommendedAction = currentStepIssues.some(
      (issue) => issue.issueType === "error",
    )
      ? "fix-errors"
      : "complete-current";
  } else if (hasHighPriorityIssues) {
    recommendedAction = "fix-errors";
  } else if (fullValidation.overallCompletion >= 80) {
    recommendedAction = "review-all";
  } else {
    recommendedAction = "proceed-next";
  }

  // Build navigation options
  const currentStepConfig = WIZARD_STEPS[currentStep];
  const canCompleteCurrentStep =
    currentStepConfig && dependencyEngine.canCompleteStep(currentStepConfig);

  // Next step option
  if (currentStep < WIZARD_STEPS.length - 1) {
    navigationOptions.push({
      action: "next",
      label: "Next Step",
      enabled: canCompleteCurrentStep,
      reason: canCompleteCurrentStep
        ? undefined
        : "Complete current step first",
    });
  }

  // Previous step option
  if (currentStep > 0) {
    navigationOptions.push({
      action: "previous",
      label: "Previous Step",
      enabled: true,
    });
  }

  // Skip option (if current step is optional)
  if (currentStepConfig?.optional) {
    navigationOptions.push({
      action: "skip",
      label: "Skip This Step",
      enabled: true,
    });
  }

  // Go to first error
  const firstErrorStep = priorityIssues.find(
    (issue) => issue.issueType === "error",
  );
  if (firstErrorStep) {
    navigationOptions.push({
      action: "goto-error",
      label: "Fix First Error",
      enabled: true,
      stepIndex: firstErrorStep.stepIndex,
    });
  }

  // Go to first incomplete
  const firstIncompleteStep = priorityIssues.find(
    (issue) => issue.issueType === "incomplete",
  );
  if (firstIncompleteStep && firstIncompleteStep.stepIndex !== currentStep) {
    navigationOptions.push({
      action: "goto-incomplete",
      label: "Complete Required Fields",
      enabled: true,
      stepIndex: firstIncompleteStep.stepIndex,
    });
  }

  // Estimate time to completion (very rough estimate)
  const remainingSteps = WIZARD_STEPS.length - currentStep - 1;
  const avgFieldsPerStep = 4;
  const avgTimePerField = 30; // seconds
  const estimatedTimeToComplete =
    remainingSteps * avgFieldsPerStep * avgTimePerField +
    priorityIssues.length * 60; // Extra time for fixing issues

  return {
    recommendedAction,
    priorityIssues: priorityIssues.slice(0, 5), // Show top 5 issues
    navigationOptions,
    completionPercentage: fullValidation.overallCompletion,
    estimatedTimeToComplete: Math.max(estimatedTimeToComplete, 60),
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WizardFlowController({
  currentStep,
  formData,
  dependencyEngine,
  hasUnsavedChanges,
  onStepChange,
  onSaveDraft: _onSaveDraft,
  mode = "full",
  showGuidance = true,
  enableSmartNavigation = true,
}: FlowControllerProps) {
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Analyze flow state
  useEffect(() => {
    const state = analyzeWizardFlow(currentStep, formData, dependencyEngine);
    setFlowState(state);
  }, [currentStep, formData, dependencyEngine]);

  // Handle navigation actions
  const handleNavigationAction = useCallback(
    (action: FlowState["navigationOptions"][0]) => {
      switch (action.action) {
        case "next":
          onStepChange(Math.min(currentStep + 1, WIZARD_STEPS.length - 1));
          break;
        case "previous":
          onStepChange(Math.max(currentStep - 1, 0));
          break;
        case "goto-step":
        case "goto-error":
        case "goto-incomplete":
          if (action.stepIndex !== undefined) {
            onStepChange(action.stepIndex);
          }
          break;
        case "skip":
          onStepChange(Math.min(currentStep + 1, WIZARD_STEPS.length - 1));
          break;
      }
    },
    [currentStep, onStepChange],
  );

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h`;
  }, []);

  if (!flowState || mode === "minimal") {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className={cn("w-full", mode === "compact" && "shadow-sm")}>
        <CardContent className={cn("p-6", mode === "compact" && "p-4")}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Flow Guidance</h3>
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    flowState.completionPercentage >= 90 ? "default" : "outline"
                  }
                  className="text-xs"
                >
                  {flowState.completionPercentage}% complete
                </Badge>
                {mode === "full" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? "Hide" : "Show"} Details
                  </Button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <Progress
                value={flowState.completionPercentage}
                className="h-2"
              />
              {flowState.estimatedTimeToComplete && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress: {flowState.completionPercentage}%</span>
                  <span>
                    Est. {formatTime(flowState.estimatedTimeToComplete)}{" "}
                    remaining
                  </span>
                </div>
              )}
            </div>

            {/* Recommended action */}
            {showGuidance && (
              <Alert
                className={cn(
                  flowState.recommendedAction === "fix-errors" &&
                    "border-red-200 bg-red-50",
                  flowState.recommendedAction === "submit" &&
                    "border-green-200 bg-green-50",
                )}
              >
                <div className="flex items-start gap-2">
                  {flowState.recommendedAction === "fix-errors" && (
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  {flowState.recommendedAction === "submit" && (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  )}
                  {!["fix-errors", "submit"].includes(
                    flowState.recommendedAction,
                  ) && <Info className="h-4 w-4 text-blue-600 mt-0.5" />}
                  <AlertDescription>
                    {flowState.recommendedAction === "complete-current" &&
                      "Complete the current step to continue"}
                    {flowState.recommendedAction === "fix-errors" &&
                      "Fix validation errors before proceeding"}
                    {flowState.recommendedAction === "proceed-next" &&
                      "Continue to the next step"}
                    {flowState.recommendedAction === "review-all" &&
                      "Review all steps before submitting"}
                    {flowState.recommendedAction === "submit" &&
                      "All requirements met - ready to submit!"}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Priority issues */}
            {showDetails && flowState.priorityIssues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Priority Issues:
                </h4>
                <AnimatePresence>
                  {flowState.priorityIssues.slice(0, 3).map((issue, index) => (
                    <motion.div
                      key={`${issue.stepIndex}-${issue.message}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        className={cn(
                          "p-2 rounded border text-xs",
                          issue.issueType === "error" &&
                            "border-red-200 bg-red-50",
                          issue.issueType === "warning" &&
                            "border-yellow-200 bg-yellow-50",
                          issue.issueType === "incomplete" &&
                            "border-blue-200 bg-blue-50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                issue.issueType === "error"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px] px-1"
                            >
                              Step {issue.stepIndex + 1}
                            </Badge>
                            <span>{issue.message}</span>
                          </div>
                          {issue.stepIndex !== currentStep && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onStepChange(issue.stepIndex)}
                              className="h-6 px-2 text-xs"
                            >
                              Go to step
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Navigation options */}
            {enableSmartNavigation &&
              flowState.navigationOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {flowState.navigationOptions
                    .slice(0, mode === "compact" ? 3 : 5)
                    .map((option) => (
                      <Tooltip key={option.action}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={
                              option.action === "next" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handleNavigationAction(option)}
                            disabled={!option.enabled}
                            className="gap-1 text-xs"
                          >
                            {option.action === "next" && (
                              <ArrowRight className="h-3 w-3" />
                            )}
                            {option.action === "previous" && (
                              <ArrowLeft className="h-3 w-3" />
                            )}
                            {option.action === "goto-error" && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {option.action === "goto-incomplete" && (
                              <Clock className="h-3 w-3" />
                            )}
                            {option.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {option.reason ||
                            `${option.label} - Click to navigate`}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
