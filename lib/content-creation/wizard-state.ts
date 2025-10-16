/**
 * Wizard State Management
 *
 * This module contains the state reducer and action creators for the content creation wizard.
 * It's designed to be scalable and work seamlessly with the dependency engine.
 */

import { WIZARD_CONFIG } from "@/lib/content-creation/wizard-config";
import type {
  ContentFreshness,
  ContentLengthOption,
  PartialContentCreationFormData,
  WizardAction,
  WizardState,
} from "@/types/content-creation";
import type { FormFieldValue } from "@/types/shared";

/**
 * Initial wizard state factory
 */
export function createInitialWizardState(
  initialData: PartialContentCreationFormData = {},
): WizardState {
  return {
    currentStep: 0,
    formData: initialData,
    errors: {},
    touched: {},
    isStepValid: true,
    canProceed: false,
    isSaving: false,
    hasUnsavedChanges: false,
  };
}

/**
 * Wizard state reducer for managing complex form state
 *
 * This reducer is designed to work with the dependency engine and supports:
 * - Step navigation
 * - Field updates with dependency tracking
 * - Validation error management
 * - Topic prefilling with metadata
 * - Auto-filled value clearing
 */
export function wizardStateReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(
          state.currentStep + 1,
          WIZARD_CONFIG.steps.length - 1,
        ),
      };

    case "PREVIOUS_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };

    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: Math.max(
          0,
          Math.min(action.payload, WIZARD_CONFIG.steps.length - 1),
        ),
      };

    case "UPDATE_FIELD": {
      const { field, value } = action.payload;
      const newFormData = { ...state.formData, [field]: value };

      return {
        ...state,
        formData: newFormData,
        hasUnsavedChanges: true,
        touched: { ...state.touched, [field]: true },
        // Clear field error if value is provided
        errors:
          value !== undefined && value !== null && value !== ""
            ? { ...state.errors, [field]: undefined }
            : state.errors,
      };
    }

    case "UPDATE_MULTIPLE_FIELDS": {
      const newFormData = { ...state.formData, ...action.payload };

      return {
        ...state,
        formData: newFormData,
        hasUnsavedChanges: true,
      };
    }

    case "SET_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.error,
        },
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        errors: { ...state.errors, [action.payload]: undefined },
      };

    case "TOUCH_FIELD":
      return {
        ...state,
        touched: { ...state.touched, [action.payload]: true },
      };

    case "RESET_WIZARD":
      return createInitialWizardState();

    case "SUBMIT_FORM":
      return {
        ...state,
        isSaving: true,
      };

    case "CLEAR_AUTOFILLED_VALUES": {
      const currentMetadata = state.formData._topicPrefillingMetadata;
      if (!currentMetadata?.prefilledFields) {
        return state; // No auto-filled fields to clear
      }

      const newFormData = { ...state.formData };
      const newTouched = { ...state.touched };
      const clearedFields: string[] = [];

      // Clear auto-filled fields that haven't been manually modified
      Object.entries(currentMetadata.prefilledFields).forEach(
        ([field, isAutofilled]) => {
          if (
            isAutofilled &&
            !state.touched[field as keyof PartialContentCreationFormData]
          ) {
            // Clear the field value
            delete newFormData[field as keyof PartialContentCreationFormData];
            clearedFields.push(field);
          }
        },
      );

      // Update metadata to remove cleared fields
      const updatedPrefilledFields = { ...currentMetadata.prefilledFields };
      clearedFields.forEach((field) => {
        delete updatedPrefilledFields[field];
      });

      // If no auto-filled fields remain, remove the metadata entirely
      if (Object.keys(updatedPrefilledFields).length === 0) {
        delete newFormData._topicPrefillingMetadata;
      } else {
        newFormData._topicPrefillingMetadata = {
          ...currentMetadata,
          prefilledFields: updatedPrefilledFields,
        };
      }

      return {
        ...state,
        formData: newFormData,
        touched: newTouched,
        hasUnsavedChanges: true,
      };
    }

    case "PREFILL_FROM_TOPIC": {
      const { topicData, suggestedDefaults, userSettings } = action.payload;
      const prefilledFields: Record<string, boolean> = {};
      const newFormData = { ...state.formData };

      // Map suggested_defaults to form fields
      if (suggestedDefaults) {
        if (suggestedDefaults.platform) {
          newFormData.platform = suggestedDefaults.platform as
            | "Website"
            | "Social Media";
          prefilledFields.platform = true;
        }
        if (suggestedDefaults.industry) {
          newFormData.industry = suggestedDefaults.industry as string;
          prefilledFields.industry = true;
        }
        if (suggestedDefaults.audienceType) {
          newFormData.audienceType = Array.isArray(
            suggestedDefaults.audienceType,
          )
            ? (suggestedDefaults.audienceType as string[])
            : [suggestedDefaults.audienceType as string];
          prefilledFields.audienceType = true;
        }
        if (suggestedDefaults.readingLevel) {
          const levels = Array.isArray(suggestedDefaults.readingLevel)
            ? suggestedDefaults.readingLevel
            : [suggestedDefaults.readingLevel];
          newFormData.readingLevel = levels[0] as
            | "Beginner"
            | "Intermediate"
            | "Advanced";
          prefilledFields.readingLevel = true;
        }
        if (suggestedDefaults.goals && Array.isArray(suggestedDefaults.goals)) {
          newFormData.goals = suggestedDefaults.goals as string[];
          prefilledFields.goals = true;
        }
        if (suggestedDefaults.tone && Array.isArray(suggestedDefaults.tone)) {
          newFormData.tone = suggestedDefaults.tone as string[];
          prefilledFields.tone = true;
        }
        if (suggestedDefaults.region) {
          newFormData.region = suggestedDefaults.region as string;
          prefilledFields.region = true;
        }
        if (suggestedDefaults.contentLength) {
          newFormData.contentLength =
            suggestedDefaults.contentLength as ContentLengthOption;
          prefilledFields.contentLength = true;
        }
        if (
          suggestedDefaults.primaryKeywords &&
          Array.isArray(suggestedDefaults.primaryKeywords)
        ) {
          newFormData.primaryKeywords =
            suggestedDefaults.primaryKeywords as string[];
          prefilledFields.primaryKeywords = true;
        }
        if (typeof suggestedDefaults.includeTOC === "boolean") {
          newFormData.includeTOC = suggestedDefaults.includeTOC;
          prefilledFields.includeTOC = true;
        }
        if (typeof suggestedDefaults.includeSummary === "boolean") {
          newFormData.includeSummary = suggestedDefaults.includeSummary;
          prefilledFields.includeSummary = true;
        }
        if (typeof suggestedDefaults.includeCTA === "boolean") {
          newFormData.includeCTA = suggestedDefaults.includeCTA;
          prefilledFields.includeCTA = true;
        }
        if (typeof suggestedDefaults.includeKeyTakeaways === "boolean") {
          newFormData.includeKeyTakeaways =
            suggestedDefaults.includeKeyTakeaways;
          prefilledFields.includeKeyTakeaways = true;
        }
      }

      // Map user_settings for Research Settings step
      if (userSettings) {
        if (userSettings.research_level) {
          newFormData.researchLevel = userSettings.research_level as
            | "Basic"
            | "Comprehensive"
            | "Expert";
          prefilledFields.researchLevel = true;
        }
        if (typeof userSettings.include_latest_info === "boolean") {
          newFormData.includeLatestInfo = userSettings.include_latest_info;
          prefilledFields.includeLatestInfo = true;
        }
        if (typeof userSettings.include_examples === "boolean") {
          newFormData.includeExamples = userSettings.include_examples;
          prefilledFields.includeExamples = true;
        }
        if (userSettings.fact_checking) {
          newFormData.factChecking = userSettings.fact_checking as
            | "Basic"
            | "Standard"
            | "Strict";
          prefilledFields.factChecking = true;
        }
        if (userSettings.content_freshness) {
          newFormData.contentFreshness =
            userSettings.content_freshness as ContentFreshness;
          prefilledFields.contentFreshness = true;
        }
        if (typeof userSettings.include_statistics === "boolean") {
          newFormData.includeStatistics = userSettings.include_statistics;
          prefilledFields.includeStatistics = true;
        }
        if (typeof userSettings.include_quotes === "boolean") {
          newFormData.includeQuotes = userSettings.include_quotes;
          prefilledFields.includeQuotes = true;
        }
        if (typeof userSettings.competitor_analysis === "boolean") {
          newFormData.competitorAnalysis = userSettings.competitor_analysis;
          prefilledFields.competitorAnalysis = true;
        }
      }

      // Set topic ID and metadata
      newFormData.topicId = topicData.id;
      prefilledFields.topicId = true;

      newFormData._topicPrefillingMetadata = {
        topicId: topicData.id,
        prefilledFields,
        originalSuggestedDefaults: suggestedDefaults,
        originalUserSettings: userSettings,
      };

      return {
        ...state,
        formData: newFormData,
        hasUnsavedChanges: true,
      };
    }

    default:
      return state;
  }
}

/**
 * Action Creators
 *
 * These functions create properly typed actions for the wizard reducer
 */

export const wizardActions = {
  nextStep: (): WizardAction => ({ type: "NEXT_STEP" }),

  previousStep: (): WizardAction => ({ type: "PREVIOUS_STEP" }),

  goToStep: (stepIndex: number): WizardAction => ({
    type: "GO_TO_STEP",
    payload: stepIndex,
  }),

  updateField: (
    field: keyof PartialContentCreationFormData,
    value: FormFieldValue,
  ): WizardAction => ({
    type: "UPDATE_FIELD",
    payload: { field, value },
  }),

  updateMultipleFields: (
    fields: PartialContentCreationFormData,
  ): WizardAction => ({
    type: "UPDATE_MULTIPLE_FIELDS",
    payload: fields,
  }),

  setError: (
    field: keyof PartialContentCreationFormData,
    error: string,
  ): WizardAction => ({
    type: "SET_ERROR",
    payload: { field, error },
  }),

  clearError: (field: keyof PartialContentCreationFormData): WizardAction => ({
    type: "CLEAR_ERROR",
    payload: field,
  }),

  touchField: (field: keyof PartialContentCreationFormData): WizardAction => ({
    type: "TOUCH_FIELD",
    payload: field,
  }),

  resetWizard: (): WizardAction => ({ type: "RESET_WIZARD" }),

  submitForm: (): WizardAction => ({ type: "SUBMIT_FORM" }),

  clearAutoFilledValues: (): WizardAction => ({
    type: "CLEAR_AUTOFILLED_VALUES",
  }),

  prefillFromTopic: (
    topicData: unknown,
    suggestedDefaults: Record<string, unknown> | undefined,
    userSettings: Record<string, unknown> | undefined,
  ): WizardAction => ({
    type: "PREFILL_FROM_TOPIC",
    payload: {
      topicData: topicData as never,
      suggestedDefaults,
      userSettings,
    },
  }),
};
