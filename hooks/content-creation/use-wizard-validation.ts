/**
 * Wizard Validation Hook
 *
 * This hook integrates the dependency engine with wizard state for validation,
 * progress tracking, and conditional field visibility.
 *
 * Key Features:
 * - Validates steps based on dependency engine rules
 * - Calculates progress and completion percentages
 * - Manages sidebar validation state
 * - Handles conditional field visibility
 */

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import { WIZARD_CONFIG } from "@/lib/content-creation/wizard-config";
import type {
  PartialContentCreationFormData,
  WizardState,
  WizardStep,
  WizardStepFeedbackStateEntry,
} from "@/types/content-creation";

export interface WizardValidationData {
  // Overall validation
  fullValidation: {
    isValid: boolean;
    errors: Record<string, string>;
    warnings?: Record<string, string[]>;
    overallCompletion: number;
    readyForSubmission: boolean;
  };

  // Progress tracking
  progress: {
    completedFields: number;
    totalFields: number;
    overallCompletion: number;
    readyForSubmission: boolean;
    totalErrors: number;
    totalWarnings: number;
  };

  // Sidebar data
  sidebarData: {
    completions: Record<string, number>;
    validations: Record<
      string,
      {
        hasErrors: boolean;
        hasWarnings: boolean;
        errorCount: number;
        warningCount: number;
      }
    >;
    feedback: Record<string, WizardStepFeedbackStateEntry>;
  };
}

/**
 * Custom hook for wizard validation with dependency engine integration
 *
 * This hook handles all validation logic, progress calculations, and
 * sidebar state generation. It automatically updates when form data
 * or the current step changes.
 *
 * @param dependencyEngine - The dependency engine instance
 * @param wizardState - Current wizard state
 * @param setError - Function to set field errors
 * @param clearError - Function to clear field errors
 * @returns Validation data and helper functions
 */
export function useWizardValidation(
  dependencyEngine: WizardDependencyEngine,
  wizardState: WizardState,
  setError: (
    field: keyof PartialContentCreationFormData,
    error: string,
  ) => void,
  clearError: (field: keyof PartialContentCreationFormData) => void,
): WizardValidationData {
  // Track last validation errors for the current step to avoid loops
  const lastStepErrorsRef = useRef<Record<string, string | undefined>>({});

  // Calculate validation data (memoized for performance)
  const fullValidation = useMemo(
    () => dependencyEngine.validateAll(),
    [dependencyEngine],
  );

  const progress = useMemo(() => {
    const baseProgress = dependencyEngine.calculateProgress();
    return {
      ...baseProgress,
      overallCompletion: fullValidation.overallCompletion,
      readyForSubmission: fullValidation.readyForSubmission,
      totalErrors: Object.keys(fullValidation.errors).length,
      totalWarnings: fullValidation.warnings
        ? Object.keys(fullValidation.warnings).length
        : 0,
    };
  }, [dependencyEngine, fullValidation]);

  // Generate sidebar data (memoized)
  const sidebarData = useMemo(() => {
    const completions: Record<string, number> = {};
    const validations: Record<
      string,
      {
        hasErrors: boolean;
        hasWarnings: boolean;
        errorCount: number;
        warningCount: number;
      }
    > = {};
    const feedback: Record<string, WizardStepFeedbackStateEntry> = {};

    WIZARD_CONFIG.steps.forEach((step, index) => {
      const stepValidation = dependencyEngine.validateStep(step);
      const visibleFields = dependencyEngine.getVisibleFields(step);

      const hasTouchedField = visibleFields.some(
        (field) =>
          !!wizardState.touched[
            field.id as keyof PartialContentCreationFormData
          ],
      );

      const isBeforeCurrent = index < wizardState.currentStep;
      const isCurrent = index === wizardState.currentStep;
      const shouldSurface = isBeforeCurrent || hasTouchedField;

      const errorCount = Object.keys(stepValidation.errors).length;
      const warningCount = stepValidation.warnings
        ? Object.keys(stepValidation.warnings).length
        : 0;

      completions[step.id] = stepValidation.completionPercentage || 0;
      validations[step.id] = {
        hasErrors: errorCount > 0,
        hasWarnings: warningCount > 0,
        errorCount,
        warningCount,
      };

      feedback[step.id] = {
        showValidation: shouldSurface || isCurrent,
        showErrors: shouldSurface,
        showWarnings: shouldSurface,
        isVisited: shouldSurface || isCurrent,
      };
    });

    return { completions, validations, feedback };
  }, [dependencyEngine, wizardState.currentStep, wizardState.touched]);

  // Validate current step and update errors
  useEffect(() => {
    const currentStepConfig = WIZARD_CONFIG.steps[wizardState.currentStep];
    if (!currentStepConfig) return;

    const validation = dependencyEngine.validateStep(currentStepConfig);
    const visibleFields = dependencyEngine.getVisibleFields(currentStepConfig);
    const nextErrors = validation.errors as Record<string, string | undefined>;

    // Diff with last snapshot to avoid redundant dispatches and loops
    let hasDiff = false;
    for (const field of visibleFields) {
      if (
        (lastStepErrorsRef.current[field.id] || undefined) !==
        (nextErrors[field.id] || undefined)
      ) {
        hasDiff = true;
        break;
      }
    }

    if (hasDiff) {
      for (const field of visibleFields) {
        const prev = lastStepErrorsRef.current[field.id];
        const next = nextErrors[field.id];
        if (prev && !next) {
          clearError(field.id as keyof PartialContentCreationFormData);
        } else if (next && prev !== next) {
          setError(field.id as keyof PartialContentCreationFormData, next);
        }
      }

      // Update snapshot to the latest
      const snapshot: Record<string, string | undefined> = {};
      for (const field of visibleFields) {
        snapshot[field.id] = nextErrors[field.id];
      }
      lastStepErrorsRef.current = snapshot;
    }

    // Show warnings as toast notifications for improved UX
    if (validation.warnings && typeof validation.warnings === "object") {
      Object.entries(validation.warnings).forEach(([fieldId, warnings]) => {
        const warningArray = Array.isArray(warnings) ? warnings : [];
        if (
          warningArray.length > 0 &&
          wizardState.touched[fieldId as keyof PartialContentCreationFormData]
        ) {
          toast.info(`Suggestion for ${fieldId}: ${warningArray[0]}`, {
            duration: 3000,
          });
        }
      });
    }
  }, [
    wizardState.currentStep,
    wizardState.touched,
    dependencyEngine,
    setError,
    clearError,
  ]);

  return {
    fullValidation,
    progress,
    sidebarData,
  };
}

/**
 * Helper hook for checking if a step can be completed
 *
 * This hook provides a convenient way to check if the current step
 * meets all requirements to proceed to the next step.
 *
 * @param dependencyEngine - The dependency engine instance
 * @param currentStep - Current step index
 * @returns Object with canComplete flag and error message
 */
export function useStepCompletion(
  dependencyEngine: WizardDependencyEngine,
  currentStep: number,
): {
  canComplete: boolean;
  errorMessage: string | null;
  errorCount: number;
  completionPercentage: number;
} {
  return useMemo(() => {
    const currentStepConfig = WIZARD_CONFIG.steps[currentStep];
    if (!currentStepConfig) {
      return {
        canComplete: false,
        errorMessage: "Invalid step",
        errorCount: 0,
        completionPercentage: 0,
      };
    }

    const canComplete = dependencyEngine.canCompleteStep(currentStepConfig);
    const validation = dependencyEngine.validateStep(currentStepConfig);
    const errorCount = Object.keys(validation.errors).length;

    return {
      canComplete,
      errorMessage: canComplete
        ? null
        : `Please fix ${errorCount} validation ${errorCount === 1 ? "error" : "errors"} before proceeding.`,
      errorCount,
      completionPercentage: validation.completionPercentage || 0,
    };
  }, [dependencyEngine, currentStep]);
}

/**
 * Helper hook for finding the next incomplete step
 *
 * This is useful for smart navigation when the user tries to submit
 * an incomplete form.
 *
 * @param dependencyEngine - The dependency engine instance
 * @returns Next incomplete step or null
 */
export function useNextIncompleteStep(
  dependencyEngine: WizardDependencyEngine,
): WizardStep | null {
  return useMemo(() => {
    return dependencyEngine.getNextIncompleteStep();
  }, [dependencyEngine]);
}
