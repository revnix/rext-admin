/**
 * Content Creation Wizard - Main Orchestrator Component
 *
 * This is a clean orchestrator that ties together all wizard functionality:
 * - State management (via useWizardState)
 * - Validation (via useWizardValidation)
 * - Navigation (via useWizardNavigation)
 * - Topic prefilling (via useTopicPrefilling)
 * - Dependency engine integration
 * - Cascading field updates
 *
 * The component is designed to be scalable and maintainable:
 * - All complex logic is extracted to custom hooks
 * - Dependency engine is integrated at every level
 * - UI is composed from smaller, reusable components
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTopicPrefilling } from "@/hooks/content-creation/use-topic-prefilling";
import { useWizardNavigation } from "@/hooks/content-creation/use-wizard-navigation";
import { useWizardState } from "@/hooks/content-creation/use-wizard-state";
import { useWizardValidation } from "@/hooks/content-creation/use-wizard-validation";
import { useCreditGate } from "@/hooks/use-credit-gate";
import {
  applyCascadingUpdates,
  createDependencyEngine,
  getChangedFields,
} from "@/lib/content-creation/dependency-engine";
import { WIZARD_CONFIG } from "@/lib/content-creation/wizard-config";
import { useCurrentWorkspace } from "@/stores/workspace";
import type {
  ContentCreationWizardProps,
  PartialContentCreationFormData,
} from "@/types/content-creation";
import { WizardAutoFillAlert } from "./wizard-autofill-alert";
import { WizardNavigation } from "./wizard-navigation";
import { WizardSidebarProgress } from "./wizard-sidebar-progress";
import { WizardStepRenderer } from "./wizard-step-renderer";

/**
 * Main Content Creation Wizard Component
 *
 * This component orchestrates the entire wizard experience by:
 * 1. Managing wizard state through custom hooks
 * 2. Integrating the dependency engine for conditional logic
 * 3. Handling cascading field updates
 * 4. Coordinating validation and navigation
 * 5. Managing topic prefilling
 *
 * The architecture is highly scalable:
 * - New fields: Add to wizard config + dependency rules
 * - New validation: Add to dependency engine
 * - New prefill sources: Extend useTopicPrefilling hook
 * - New navigation patterns: Extend useWizardNavigation hook
 *
 * @param props - Wizard configuration and callbacks
 */
export function ContentCreationWizard({
  initialData = {},
  initialTopicId,
  onSubmit,
  onCancel,
}: ContentCreationWizardProps) {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Core wizard state (via custom hook)
  const {
    state,
    updateField,
    updateMultipleFields,
    touchField,
    setError,
    clearError,
    clearAutoFilledValues,
    prefillFromTopic,
    ...navigationActions
  } = useWizardState(initialData);

  // Dependency engine for conditional logic and validation
  const [dependencyEngine] = useState(() =>
    createDependencyEngine(WIZARD_CONFIG.steps, initialData),
  );

  // Form data tracking for cascading updates
  const lastFormDataRef = useRef<PartialContentCreationFormData>(initialData);

  // Current workspace
  const currentWorkspace = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || "";

  // Credits & Subscription — the gate fetches the balance, decides whether a
  // whole article is affordable, and owns the upgrade popup
  const { ensureCredits, creditsModal } = useCreditGate();

  // ==========================================================================
  // DEPENDENCY ENGINE INTEGRATION
  // ==========================================================================

  // Update dependency engine when form data changes
  useEffect(() => {
    dependencyEngine.updateFormData(state.formData);
  }, [state.formData, dependencyEngine]);

  // Handle cascading updates when fields change
  useEffect(() => {
    const changedFields = getChangedFields(
      lastFormDataRef.current,
      state.formData,
    );

    if (changedFields.length > 0) {
      for (const changedField of changedFields) {
        const updatedFormData = applyCascadingUpdates(
          dependencyEngine,
          changedField,
          WIZARD_CONFIG.steps,
        );

        // Update form data with cascading changes
        if (
          JSON.stringify(updatedFormData) !== JSON.stringify(state.formData)
        ) {
          updateMultipleFields(updatedFormData);
        }
      }

      lastFormDataRef.current = state.formData;
    }
  }, [state.formData, dependencyEngine, updateMultipleFields]);

  // ==========================================================================
  // VALIDATION (via custom hook)
  // ==========================================================================

  const { progress, sidebarData } = useWizardValidation(
    dependencyEngine,
    state,
    setError,
    clearError,
  );

  // ==========================================================================
  // NAVIGATION (via custom hook)
  // ==========================================================================

  const {
    handleNextStep,
    handlePreviousStep,
    handleGoToStep,
    handleSubmit,
    handleCancel,
    canGoNext,
    canGoBack,
    canSubmit,
  } = useWizardNavigation({
    dependencyEngine,
    wizardState: state,
    ...navigationActions,
    touchField,
    onSubmit,
    onCancel,
  });

  // Stop before the create request is sent unless a whole article is affordable
  const handleGuardedSubmit = () => {
    if (!ensureCredits()) return;
    void handleSubmit();
  };

  // ==========================================================================
  // TOPIC PREFILLING (via custom hook)
  // ==========================================================================

  const { clearableFieldsCount, handleClearAutoFilledValues } =
    useTopicPrefilling({
      initialTopicId: initialTopicId || undefined,
      workspaceId,
      formData: state.formData,
      prefillFromTopic,
      clearAutoFilledValues,
      touched: state.touched,
    });

  // ==========================================================================
  // FIELD HANDLERS
  // ==========================================================================

  const handleFieldChange = (
    field: keyof PartialContentCreationFormData,
    value: unknown,
  ) => {
    updateField(field, value as string | string[] | number | boolean | null);
  };

  const handleFieldTouch = (field: keyof PartialContentCreationFormData) => {
    touchField(field);
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const currentStepConfig = WIZARD_CONFIG.steps[state.currentStep];

  return (
    <div className="wizard-container w-full">
      <div className="space-y-8">
        {/* Auto-fill Alert */}
        <WizardAutoFillAlert
          clearableFieldsCount={clearableFieldsCount}
          onClear={handleClearAutoFilledValues}
        />

        {/* Main Wizard Content */}
        <div className="wizard-step-container w-full">
          <Card className="wizard-card min-h-[600px] w-full max-w-none">
            <CardContent className="p-0">
              <div className="flex flex-col xl:flex-row">
                {/* Sidebar Progress */}
                <div className="xl:w-80 bg-gradient-to-b from-muted/20 to-muted/30 p-6 xl:border-r border-border/50">
                  <div className="space-y-6">
                    <WizardSidebarProgress
                      currentStep={state.currentStep}
                      steps={WIZARD_CONFIG.steps}
                      stepStatuses={WIZARD_CONFIG.steps.map((_, index) => {
                        if (index < state.currentStep) return "completed";
                        if (index === state.currentStep) return "current";
                        return "pending";
                      })}
                      stepCompletions={sidebarData.completions}
                      stepValidations={sidebarData.validations}
                      stepFeedbackState={sidebarData.feedback}
                      overallCompletion={progress.overallCompletion}
                      completedFields={progress.completedFields}
                      totalFields={progress.totalFields}
                      onStepClick={handleGoToStep}
                      canSkipCurrentStep={currentStepConfig?.optional || false}
                    />
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 p-6 lg:p-4 w-full max-w-none">
                  <AnimatePresence mode="wait">
                    {currentStepConfig && (
                      <motion.div
                        key={`step-${state.currentStep}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        className="space-y-8 w-full max-w-none"
                      >
                        <WizardStepRenderer
                          step={currentStepConfig}
                          formData={state.formData}
                          errors={state.errors}
                          touched={state.touched}
                          isActive={true}
                          onFieldChange={handleFieldChange}
                          onFieldTouch={handleFieldTouch}
                          dependencyEngine={dependencyEngine}
                          dispatch={(action) => {
                            // Forward actions to appropriate handlers
                            if (action.type === "UPDATE_FIELD") {
                              updateField(
                                action.payload.field,
                                action.payload.value,
                              );
                            } else if (
                              action.type === "UPDATE_MULTIPLE_FIELDS"
                            ) {
                              updateMultipleFields(action.payload);
                            }
                          }}
                          onGoToStep={handleGoToStep}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <WizardNavigation
          currentStep={state.currentStep}
          totalSteps={WIZARD_CONFIG.steps.length}
          canGoNext={canGoNext}
          canGoBack={canGoBack}
          canSubmit={canSubmit}
          isLoading={state.isSaving}
          onNext={handleNextStep}
          onBack={handlePreviousStep}
          onSubmit={handleGuardedSubmit}
          onCancel={handleCancel}
        />
      </div>

      {creditsModal}
    </div>
  );
}
