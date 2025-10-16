/**
 * Wizard State Management Hook
 *
 * This hook provides a clean interface for managing wizard state with the dependency engine.
 * It encapsulates the reducer logic and provides convenient methods for state updates.
 */

import { useCallback, useReducer } from "react";
import {
  createInitialWizardState,
  wizardActions,
  wizardStateReducer,
} from "@/lib/content-creation/wizard-state";
import type {
  PartialContentCreationFormData,
  WizardState,
} from "@/types/content-creation";
import type { FormFieldValue } from "@/types/shared";

export interface UseWizardStateReturn {
  // State
  state: WizardState;

  // Navigation actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;

  // Form field actions
  updateField: (
    field: keyof PartialContentCreationFormData,
    value: FormFieldValue,
  ) => void;
  updateMultipleFields: (fields: PartialContentCreationFormData) => void;
  touchField: (field: keyof PartialContentCreationFormData) => void;

  // Validation actions
  setError: (
    field: keyof PartialContentCreationFormData,
    error: string,
  ) => void;
  clearError: (field: keyof PartialContentCreationFormData) => void;

  // Wizard control actions
  resetWizard: () => void;
  submitForm: () => void;

  // Topic prefilling actions
  clearAutoFilledValues: () => void;
  prefillFromTopic: (
    topicData: unknown,
    suggestedDefaults: Record<string, unknown> | undefined,
    userSettings: Record<string, unknown> | undefined,
  ) => void;
}

/**
 * Custom hook for managing wizard state
 *
 * This hook provides a clean API for interacting with the wizard state reducer.
 * All actions are memoized for performance.
 *
 * @param initialData - Initial form data to populate the wizard
 * @returns Wizard state and action methods
 */
export function useWizardState(
  initialData: PartialContentCreationFormData = {},
): UseWizardStateReturn {
  const [state, dispatch] = useReducer(
    wizardStateReducer,
    initialData,
    createInitialWizardState,
  );

  // Navigation actions
  const nextStep = useCallback(() => {
    dispatch(wizardActions.nextStep());
  }, []);

  const previousStep = useCallback(() => {
    dispatch(wizardActions.previousStep());
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    dispatch(wizardActions.goToStep(stepIndex));
  }, []);

  // Form field actions
  const updateField = useCallback(
    (field: keyof PartialContentCreationFormData, value: FormFieldValue) => {
      dispatch(wizardActions.updateField(field, value));
    },
    [],
  );

  const updateMultipleFields = useCallback(
    (fields: PartialContentCreationFormData) => {
      dispatch(wizardActions.updateMultipleFields(fields));
    },
    [],
  );

  const touchField = useCallback(
    (field: keyof PartialContentCreationFormData) => {
      dispatch(wizardActions.touchField(field));
    },
    [],
  );

  // Validation actions
  const setError = useCallback(
    (field: keyof PartialContentCreationFormData, error: string) => {
      dispatch(wizardActions.setError(field, error));
    },
    [],
  );

  const clearError = useCallback(
    (field: keyof PartialContentCreationFormData) => {
      dispatch(wizardActions.clearError(field));
    },
    [],
  );

  // Wizard control actions
  const resetWizard = useCallback(() => {
    dispatch(wizardActions.resetWizard());
  }, []);

  const submitForm = useCallback(() => {
    dispatch(wizardActions.submitForm());
  }, []);

  // Topic prefilling actions
  const clearAutoFilledValues = useCallback(() => {
    dispatch(wizardActions.clearAutoFilledValues());
  }, []);

  const prefillFromTopic = useCallback(
    (
      topicData: unknown,
      suggestedDefaults: Record<string, unknown> | undefined,
      userSettings: Record<string, unknown> | undefined,
    ) => {
      dispatch(
        wizardActions.prefillFromTopic(
          topicData,
          suggestedDefaults,
          userSettings,
        ),
      );
    },
    [],
  );

  return {
    state,
    nextStep,
    previousStep,
    goToStep,
    updateField,
    updateMultipleFields,
    touchField,
    setError,
    clearError,
    resetWizard,
    submitForm,
    clearAutoFilledValues,
    prefillFromTopic,
  };
}
