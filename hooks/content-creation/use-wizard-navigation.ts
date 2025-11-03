/**
 * Wizard Navigation Hook
 *
 * This hook handles all wizard navigation logic with full dependency engine support.
 * It ensures that users can only proceed when dependencies are satisfied and
 * validation passes.
 *
 * Key Features:
 * - Smart step navigation with validation checks
 * - Dependency-aware step transitions
 * - Form submission with comprehensive validation
 * - Navigation to incomplete steps
 */

import { useCallback } from "react";
import { toast } from "sonner";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import { WIZARD_CONFIG } from "@/lib/content-creation/wizard-config";
import { log } from "@/lib/logger";
import type {
  ContentCreationFormData,
  PartialContentCreationFormData,
  WizardState,
} from "@/types/content-creation";

export interface UseWizardNavigationParams {
  dependencyEngine: WizardDependencyEngine;
  wizardState: WizardState;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  touchField: (field: keyof PartialContentCreationFormData) => void;
  submitForm: () => void;
  onSubmit?: (data: ContentCreationFormData) => Promise<void>;
  onCancel?: () => void;
}

export interface UseWizardNavigationReturn {
  // Basic navigation
  handleNextStep: () => void;
  handlePreviousStep: () => void;
  handleGoToStep: (stepIndex: number) => void;

  // Form actions
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;

  // Smart navigation
  handleGoToFirstError: () => void;
  handleGoToFirstIncomplete: () => void;
  handleSkipStep: () => void;

  // Navigation state
  canGoNext: boolean;
  canGoBack: boolean;
  canSubmit: boolean;
}

/**
 * Custom hook for wizard navigation with dependency engine support
 *
 * This hook provides all navigation handlers with built-in validation
 * and dependency checking. It ensures users can only proceed when
 * all requirements are met.
 *
 * @param params - Navigation parameters including dependency engine and state
 * @returns Navigation handlers and state flags
 */
export function useWizardNavigation({
  dependencyEngine,
  wizardState,
  nextStep,
  previousStep,
  goToStep,
  touchField,
  submitForm,
  onSubmit,
  onCancel,
}: UseWizardNavigationParams): UseWizardNavigationReturn {
  // Navigate to next step with validation
  const handleNextStep = useCallback(() => {
    const currentStepConfig = WIZARD_CONFIG.steps[wizardState.currentStep];

    // Check if step can be completed using comprehensive validation
    const canComplete = dependencyEngine.canCompleteStep(currentStepConfig);

    if (!canComplete) {
      // Mark all fields as touched to show validation errors
      const visibleFields =
        dependencyEngine.getVisibleFields(currentStepConfig);
      visibleFields.forEach((field: { id: string }) => {
        touchField(field.id as keyof PartialContentCreationFormData);
      });

      // Get detailed validation to provide better error messages
      const stepValidation = dependencyEngine.validateStep(currentStepConfig);
      const errorCount = Object.keys(stepValidation.errors).length;

      toast.error(
        `Please fix ${errorCount} validation ${errorCount === 1 ? "error" : "errors"} before proceeding. ` +
          `Step completion: ${stepValidation.completionPercentage}%`,
      );
      return;
    }

    nextStep();
  }, [wizardState.currentStep, dependencyEngine, nextStep, touchField]);

  // Navigate to previous step
  const handlePreviousStep = useCallback(() => {
    previousStep();
  }, [previousStep]);

  // Navigate to specific step
  const handleGoToStep = useCallback(
    (stepIndex: number) => {
      goToStep(stepIndex);
    },
    [goToStep],
  );

  // Submit form with comprehensive validation
  const handleSubmit = useCallback(async () => {
    // Use comprehensive validation system for final submission check
    const fullValidation = dependencyEngine.validateAll();

    if (!fullValidation.readyForSubmission) {
      // Find the first incomplete step for better UX
      const nextIncompleteStep = dependencyEngine.getNextIncompleteStep();

      if (nextIncompleteStep) {
        const stepIndex = WIZARD_CONFIG.steps.findIndex(
          (s) => s.id === nextIncompleteStep.id,
        );
        if (stepIndex !== -1 && stepIndex !== wizardState.currentStep) {
          goToStep(stepIndex);
        }
      }

      const errorCount = Object.keys(fullValidation.errors).length;
      toast.error(
        `Form validation failed - ${errorCount} ${errorCount === 1 ? "error" : "errors"} found. ` +
          `Overall completion: ${fullValidation.overallCompletion}% (90% required)`,
      );
      return;
    }

    submitForm();

    try {
      await onSubmit?.(wizardState.formData as ContentCreationFormData);
      toast.success(
        "Content creation started! Your content is being generated. You'll be notified when it's ready.",
      );
    } catch (error) {
      log.error("Form submission failed:", error);
      toast.error(
        `Submission failed - ${error instanceof Error ? error.message : "An unexpected error occurred"}`,
      );
    }
  }, [
    wizardState.formData,
    wizardState.currentStep,
    dependencyEngine,
    onSubmit,
    submitForm,
    goToStep,
  ]);

  // Cancel wizard with confirmation if there are unsaved changes
  const handleCancel = useCallback(() => {
    if (wizardState.hasUnsavedChanges) {
      const shouldLeave = confirm(
        "You have unsaved changes. Are you sure you want to leave? Your progress will be lost.",
      );

      if (!shouldLeave) return;
    }

    onCancel?.();
  }, [wizardState.hasUnsavedChanges, onCancel]);

  // Smart navigation: go to first step with errors
  const handleGoToFirstError = useCallback(() => {
    const nextIncompleteStep = dependencyEngine.getNextIncompleteStep();
    if (nextIncompleteStep) {
      const stepIndex = WIZARD_CONFIG.steps.findIndex(
        (s) => s.id === nextIncompleteStep.id,
      );
      if (stepIndex !== -1) {
        goToStep(stepIndex);
      }
    }
  }, [dependencyEngine, goToStep]);

  // Smart navigation: go to first incomplete step
  const handleGoToFirstIncomplete = useCallback(() => {
    // Find first step with validation errors
    for (let i = 0; i < WIZARD_CONFIG.steps.length; i++) {
      const step = WIZARD_CONFIG.steps[i];
      const stepValidation = dependencyEngine.validateStep(step);
      if (Object.keys(stepValidation.errors).length > 0) {
        goToStep(i);
        return;
      }
    }
  }, [dependencyEngine, goToStep]);

  // Skip current step (only if optional)
  const handleSkipStep = useCallback(() => {
    const currentStepConfig = WIZARD_CONFIG.steps[wizardState.currentStep];
    if (currentStepConfig?.optional) {
      nextStep();
    }
  }, [wizardState.currentStep, nextStep]);

  // Calculate navigation state
  const currentStepConfig = WIZARD_CONFIG.steps[wizardState.currentStep];
  const stepValidation = dependencyEngine.validateStep(currentStepConfig);
  const canGoNext = stepValidation.isValid;
  const canGoBack = wizardState.currentStep > 0;

  // Check if form is ready for submission
  const fullValidation = dependencyEngine.validateAll();
  const canSubmit = fullValidation.readyForSubmission;

  return {
    // Basic navigation
    handleNextStep,
    handlePreviousStep,
    handleGoToStep,

    // Form actions
    handleSubmit,
    handleCancel,

    // Smart navigation
    handleGoToFirstError,
    handleGoToFirstIncomplete,
    handleSkipStep,

    // Navigation state
    canGoNext,
    canGoBack,
    canSubmit,
  };
}
