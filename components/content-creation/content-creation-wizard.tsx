"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eraser } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import { useDraftManager } from "@/hooks/use-draft-manager";
import { useTopic } from "@/hooks/use-topics";
import {
  applyCascadingUpdates,
  createDependencyEngine,
  getChangedFields,
} from "@/lib/content-creation/dependency-engine";
import type { Draft } from "@/lib/content-creation/draft-manager";
import { WIZARD_CONFIG } from "@/lib/content-creation/wizard-config";
import type {
  ContentCreationFormData,
  ContentCreationWizardProps,
  ContentFreshness,
  ContentLengthOption,
  PartialContentCreationFormData,
  WizardAction,
  WizardState,
  WizardStepFeedbackStateEntry,
} from "@/types/content-creation";
import type { FormFieldValue } from "@/types/shared";
import { DraftManagerUI } from "./draft-manager-ui";
import { WizardNavigation } from "./wizard-navigation";
import { WizardSidebarProgress } from "./wizard-sidebar-progress";
import { WizardStepRenderer } from "./wizard-step-renderer";

/**
 * Wizard state reducer for managing complex form state
 */
function wizardStateReducer(
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

    case "SAVE_DRAFT":
      return {
        ...state,
        isSaving: true,
      };

    case "LOAD_DRAFT":
      return {
        ...state,
        formData: action.payload,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      };

    case "RESET_WIZARD":
      return {
        currentStep: 0,
        formData: {},
        errors: {},
        touched: {},
        isStepValid: true,
        canProceed: false,
        isSaving: false,
        hasUnsavedChanges: false,
      };

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
 * Main Content Creation Wizard Component
 *
 * This component manages the entire wizard flow with state management,
 * validation, auto-save, and dependency handling.
 */
export function ContentCreationWizard({
  initialData = {},
  initialTopicId,
  onSubmit,
  onSaveDraft,
  onCancel,
  debug = false,
}: ContentCreationWizardProps) {
  // Initialize wizard state
  const [state, dispatch] = useReducer(wizardStateReducer, {
    currentStep: 0,
    formData: initialData,
    errors: {},
    touched: {},
    isStepValid: true,
    canProceed: false,
    isSaving: false,
    hasUnsavedChanges: false,
  });

  // Dependency engine for conditional logic
  const [dependencyEngine] = useState(() =>
    createDependencyEngine(WIZARD_CONFIG.steps, initialData),
  );

  // Draft management integration
  const { state: draftState, actions: draftActions } = useDraftManager({
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    minCompletionForAutoSave: 25,
    showToasts: false, // We'll handle toast notifications manually
    debug,
  });

  // Auto-save timer ref and form data tracking
  const lastFormDataRef = useRef<PartialContentCreationFormData>(initialData);
  const isInitializedRef = useRef(false);
  // Track last validation errors for the current step to avoid loops
  const lastStepErrorsRef = useRef<Record<string, string | undefined>>({});

  // Update dependency engine when form data changes
  useEffect(() => {
    dependencyEngine.updateFormData(state.formData);
  }, [state.formData, dependencyEngine]);

  // Fetch topic data if initialTopicId is provided
  const { data: initialTopic, isSuccess: isInitialTopicLoaded } = useTopic(
    initialTopicId || "",
  );

  // Handle pre-filling from initial topic
  useEffect(() => {
    if (
      initialTopicId &&
      isInitialTopicLoaded &&
      initialTopic &&
      !state.formData.topicId
    ) {
      // Only pre-fill if we haven't already set a topic
      dispatch({
        type: "PREFILL_FROM_TOPIC",
        payload: {
          topicData: initialTopic,
          suggestedDefaults: initialTopic.suggested_defaults,
          userSettings: undefined, // user_settings not implemented yet
        },
      });
    }
  }, [
    initialTopicId,
    isInitialTopicLoaded,
    initialTopic,
    state.formData.topicId,
  ]);

  // Calculate validation data
  const fullValidation = dependencyEngine.validateAll();
  const progress = dependencyEngine.calculateProgress();

  // Enhanced progress data
  const enhancedProgress = {
    ...progress,
    overallCompletion: fullValidation.overallCompletion,
    readyForDraft: fullValidation.readyForDraft,
    readyForSubmission: fullValidation.readyForSubmission,
    totalErrors: Object.keys(fullValidation.errors).length,
    totalWarnings: fullValidation.warnings
      ? Object.keys(fullValidation.warnings).length
      : 0,
  };

  // Initialize auto-save when component mounts
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;

      // Start auto-save with current data provider
      draftActions.startAutoSave(() => ({
        formData: state.formData,
        currentStep: state.currentStep,
        completionPercentage: enhancedProgress.overallCompletion,
      }));
    }

    return () => {
      draftActions.stopAutoSave();
    };
  }, [
    draftActions,
    state.formData,
    state.currentStep,
    enhancedProgress.overallCompletion,
  ]);

  // Update draft manager when form data changes
  useEffect(() => {
    if (isInitializedRef.current && state.hasUnsavedChanges) {
      // The draft manager will handle auto-save timing automatically
      // We just need to ensure it has the latest data
    }
  }, [state.hasUnsavedChanges]);

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
          dispatch({
            type: "UPDATE_MULTIPLE_FIELDS",
            payload: updatedFormData,
          });
        }
      }

      lastFormDataRef.current = state.formData;
    }
  }, [state.formData, dependencyEngine]);

  // Keep a snapshot of current step's errors to compare on next validation
  useEffect(() => {
    const currentStepConfig = WIZARD_CONFIG.steps[state.currentStep];
    if (!currentStepConfig) {
      lastStepErrorsRef.current = {};
      return;
    }
    const visibleFields = dependencyEngine.getVisibleFields(currentStepConfig);
    const snapshot: Record<string, string | undefined> = {};
    for (const field of visibleFields) {
      snapshot[field.id] = state.errors[field.id];
    }
    lastStepErrorsRef.current = snapshot;
  }, [state.currentStep, state.errors, dependencyEngine]);

  // Validate current step and update state with enhanced validation
  useEffect(() => {
    const currentStepConfig = WIZARD_CONFIG.steps[state.currentStep];
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
          dispatch({ type: "CLEAR_ERROR", payload: field.id });
        } else if (next && prev !== next) {
          dispatch({
            type: "SET_ERROR",
            payload: {
              field: field.id as keyof PartialContentCreationFormData,
              error: next,
            },
          });
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
    if (validation.warnings) {
      Object.entries(validation.warnings).forEach(([fieldId, warnings]) => {
        if (
          warnings.length > 0 &&
          state.touched[fieldId as keyof PartialContentCreationFormData]
        ) {
          toast.info(`Suggestion for ${fieldId}: ${warnings[0]}`, {
            duration: 3000,
          });
        }
      });
    }
  }, [state.currentStep, state.touched, dependencyEngine]);

  // Field change handler
  const handleFieldChange = useCallback(
    (field: keyof PartialContentCreationFormData, value: FormFieldValue) => {
      dispatch({ type: "UPDATE_FIELD", payload: { field, value } });
    },
    [],
  );

  // Field touch handler
  const handleFieldTouch = useCallback(
    (field: keyof PartialContentCreationFormData) => {
      dispatch({ type: "TOUCH_FIELD", payload: field });
    },
    [],
  );

  // Helper function to count clearable auto-filled fields
  const getClearableFieldsCount = useCallback(() => {
    const metadata = state.formData._topicPrefillingMetadata;
    if (!metadata?.prefilledFields) return 0;

    return Object.entries(metadata.prefilledFields).filter(
      ([field, isAutofilled]) =>
        isAutofilled &&
        !state.touched[field as keyof PartialContentCreationFormData],
    ).length;
  }, [state.formData._topicPrefillingMetadata, state.touched]);

  // Handle clearing auto-filled values
  const handleClearAutoFilledValues = useCallback(() => {
    dispatch({ type: "CLEAR_AUTOFILLED_VALUES" });
  }, []);

  const sidebarCompletions: Record<string, number> = {};
  const sidebarValidations: Record<
    string,
    {
      hasErrors: boolean;
      hasWarnings: boolean;
      errorCount: number;
      warningCount: number;
    }
  > = {};
  const sidebarFeedback: Record<string, WizardStepFeedbackStateEntry> = {};

  WIZARD_CONFIG.steps.forEach((step, index) => {
    const stepValidation = dependencyEngine.validateStep(step);
    const visibleFields = dependencyEngine.getVisibleFields(step);

    const hasTouchedField = visibleFields.some(
      (field) =>
        !!state.touched[field.id as keyof PartialContentCreationFormData],
    );

    const isBeforeCurrent = index < state.currentStep;
    const isCurrent = index === state.currentStep;
    const shouldSurface = isBeforeCurrent || hasTouchedField;

    const errorCount = Object.keys(stepValidation.errors).length;
    const warningCount = stepValidation.warnings
      ? Object.keys(stepValidation.warnings).length
      : 0;

    sidebarCompletions[step.id] = stepValidation.completionPercentage || 0;
    sidebarValidations[step.id] = {
      hasErrors: errorCount > 0,
      hasWarnings: warningCount > 0,
      errorCount,
      warningCount,
    };

    sidebarFeedback[step.id] = {
      showValidation: shouldSurface || isCurrent,
      showErrors: shouldSurface,
      showWarnings: shouldSurface,
      isVisited: shouldSurface || isCurrent,
    };
  });

  // Step navigation handlers with enhanced validation
  const handleNextStep = useCallback(() => {
    const currentStepConfig = WIZARD_CONFIG.steps[state.currentStep];

    // Check if step can be completed using comprehensive validation
    const canComplete = dependencyEngine.canCompleteStep(currentStepConfig);

    if (!canComplete) {
      // Mark all fields as touched to show validation errors
      const visibleFields =
        dependencyEngine.getVisibleFields(currentStepConfig);
      visibleFields.forEach((field) => {
        dispatch({ type: "TOUCH_FIELD", payload: field.id });
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

    dispatch({ type: "NEXT_STEP" });
  }, [state.currentStep, dependencyEngine]);

  const handlePreviousStep = useCallback(() => {
    dispatch({ type: "PREVIOUS_STEP" });
  }, []);

  const handleGoToStep = useCallback((stepIndex: number) => {
    dispatch({ type: "GO_TO_STEP", payload: stepIndex });
  }, []);

  // Form submission handler with comprehensive validation
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
        if (stepIndex !== -1 && stepIndex !== state.currentStep) {
          dispatch({ type: "GO_TO_STEP", payload: stepIndex });
        }
      }

      const errorCount = Object.keys(fullValidation.errors).length;
      toast.error(
        `Form validation failed - ${errorCount} ${errorCount === 1 ? "error" : "errors"} found. ` +
          `Overall completion: ${fullValidation.overallCompletion}% (90% required)`,
      );
      return;
    }

    dispatch({ type: "SUBMIT_FORM" });

    try {
      await onSubmit?.(state.formData as ContentCreationFormData);
      toast.success(
        "Content creation started! Your content is being generated. You'll be notified when it's ready.",
      );
    } catch (error) {
      console.error("Form submission failed:", error);
      toast.error(
        `Submission failed - ${error instanceof Error ? error.message : "An unexpected error occurred"}`,
      );
    }
  }, [state.formData, state.currentStep, dependencyEngine, onSubmit]);

  // Manual draft save handler with comprehensive validation
  const handleSaveDraft = useCallback(async () => {
    const fullValidation = dependencyEngine.validateAll();

    if (!fullValidation.readyForDraft) {
      toast.error(
        `Cannot save draft - Please complete at least 60% of the form (currently ${fullValidation.overallCompletion}%) with no critical errors.`,
      );
      return;
    }

    dispatch({ type: "SAVE_DRAFT" });

    try {
      const draft = await draftActions.saveDraft(
        state.formData,
        state.currentStep,
        fullValidation.overallCompletion,
        { isAutoSave: false },
      );

      if (draft) {
        dispatch({ type: "LOAD_DRAFT", payload: state.formData });
        onSaveDraft?.(state.formData);
      }
    } catch (error) {
      console.error("Draft save failed:", error);
      toast.error("Save failed - Failed to save your draft. Please try again.");
    }
  }, [
    state.formData,
    state.currentStep,
    dependencyEngine,
    draftActions,
    onSaveDraft,
  ]);

  // Handle draft loading
  const handleLoadDraft = useCallback(
    async (formData: PartialContentCreationFormData, draft: Draft) => {
      try {
        // Update wizard state with loaded data
        dispatch({ type: "LOAD_DRAFT", payload: formData });

        // Navigate to the step where the draft was saved
        if (
          draft.currentStep >= 0 &&
          draft.currentStep < WIZARD_CONFIG.steps.length
        ) {
          dispatch({ type: "GO_TO_STEP", payload: draft.currentStep });
        }

        toast.success(`Draft loaded: ${draft.title}`, {
          description: `Progress: ${draft.completionPercentage}% complete`,
        });
      } catch (error) {
        console.error("Failed to load draft:", error);
        toast.error("Failed to load draft");
      }
    },
    [],
  );

  // Handle successful draft save
  const handleDraftSaved = useCallback(
    (draft: Draft) => {
      dispatch({ type: "LOAD_DRAFT", payload: state.formData });

      if (debug) {
        console.log(
          "Draft saved:",
          draft.title,
          `${draft.completionPercentage}% complete`,
        );
      }
    },
    [state.formData, debug],
  );

  // Smart navigation handlers
  const handleGoToFirstError = useCallback(() => {
    const nextIncompleteStep = dependencyEngine.getNextIncompleteStep();
    if (nextIncompleteStep) {
      const stepIndex = WIZARD_CONFIG.steps.findIndex(
        (s) => s.id === nextIncompleteStep.id,
      );
      if (stepIndex !== -1) {
        dispatch({ type: "GO_TO_STEP", payload: stepIndex });
      }
    }
  }, [dependencyEngine]);

  const handleGoToFirstIncomplete = useCallback(() => {
    // Find first step with validation errors
    for (let i = 0; i < WIZARD_CONFIG.steps.length; i++) {
      const step = WIZARD_CONFIG.steps[i];
      const stepValidation = dependencyEngine.validateStep(step);
      if (Object.keys(stepValidation.errors).length > 0) {
        dispatch({ type: "GO_TO_STEP", payload: i });
        return;
      }
    }
  }, [dependencyEngine]);

  const handleSkipStep = useCallback(() => {
    const currentStepConfig = WIZARD_CONFIG.steps[state.currentStep];
    if (currentStepConfig?.optional) {
      dispatch({ type: "NEXT_STEP" });
    }
  }, [state.currentStep]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (state.hasUnsavedChanges) {
      const shouldLeave = confirm(
        "You have unsaved changes. Are you sure you want to leave? Your progress will be lost.",
      );

      if (!shouldLeave) return;
    }

    onCancel?.();
  }, [state.hasUnsavedChanges, onCancel]);

  const currentStepConfig = WIZARD_CONFIG.steps[state.currentStep];
  const clearableFieldsCount = getClearableFieldsCount();

  return (
    <div className="wizard-container w-full">
      <div className="space-y-8">
        {/* Clear Auto-filled Values Button */}
        {clearableFieldsCount > 0 && (
          <Alert className="border-blue-200 bg-blue-50/30">
            <AlertDescription className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {clearableFieldsCount} field
                  {clearableFieldsCount !== 1 ? "s" : ""} pre-filled from topic
                </div>
                <div className="text-xs text-muted-foreground">
                  You can clear these auto-filled values to start fresh
                </div>
              </div>
              <ConfirmationDialog
                title="Clear Auto-filled Values?"
                description={`This will clear ${clearableFieldsCount} field${clearableFieldsCount !== 1 ? "s" : ""} that were automatically filled from the topic. Fields you've edited will not be affected.`}
                confirmText="Clear Fields"
                variant="default"
                onConfirm={handleClearAutoFilledValues}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Eraser className="h-4 w-4" />
                  Clear Auto-filled Values
                </Button>
              </ConfirmationDialog>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Auto-save Status */}
        {(state.hasUnsavedChanges || draftState.lastSaved) && (
          <Alert
            className={
              enhancedProgress.readyForDraft
                ? ""
                : "border-yellow-200 bg-yellow-50"
            }
          >
            <AlertDescription className="flex items-center justify-between">
              <div className="space-y-1">
                {state.hasUnsavedChanges ? (
                  <div>Unsaved changes will be auto-saved in 30 seconds</div>
                ) : draftState.lastSaved ? (
                  <div>
                    Last auto-saved at{" "}
                    {new Date(draftState.lastSaved).toLocaleTimeString()}
                  </div>
                ) : (
                  <div>Auto-save enabled</div>
                )}
                {!enhancedProgress.readyForDraft && state.hasUnsavedChanges && (
                  <div className="text-xs text-muted-foreground">
                    Need {60 - enhancedProgress.overallCompletion}% more
                    completion for draft save
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {draftState.isSaving && (
                  <Badge variant="secondary" className="text-xs">
                    Saving...
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={
                    !enhancedProgress.readyForDraft || draftState.isSaving
                  }
                >
                  Save Now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Wizard Content */}
        <div className="wizard-step-container w-full">
          <Card className="wizard-card min-h-[600px] w-full max-w-none">
            <CardContent className="p-0">
              <div className="flex flex-col xl:flex-row">
                {/* Step Content */}
                <div className="flex-1 p-6 lg:p-10 w-full max-w-none">
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
                          dispatch={dispatch}
                          onLaunch={onSubmit}
                          onSaveDraft={handleSaveDraft}
                          onGoToStep={handleGoToStep}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Enhanced Sidebar */}
                <div className="xl:w-80 bg-gradient-to-b from-muted/20 to-muted/30 p-6 xl:border-l border-border/50">
                  <div className="space-y-6">
                    {/* Enhanced Step Progress */}
                    <WizardSidebarProgress
                      currentStep={state.currentStep}
                      steps={WIZARD_CONFIG.steps}
                      stepStatuses={WIZARD_CONFIG.steps.map((_, index) => {
                        if (index < state.currentStep) return "completed";
                        if (index === state.currentStep) return "current";
                        return "pending";
                      })}
                      stepCompletions={sidebarCompletions}
                      stepValidations={sidebarValidations}
                      stepFeedbackState={sidebarFeedback}
                      overallCompletion={enhancedProgress.overallCompletion}
                      completedFields={enhancedProgress.completedFields}
                      totalFields={enhancedProgress.totalFields}
                      onStepClick={handleGoToStep}
                      canSkipCurrentStep={currentStepConfig?.optional || false}
                    />

                    <Separator />

                    {/* Draft Management */}
                    <DraftManagerUI
                      formData={state.formData}
                      currentStep={state.currentStep}
                      completionPercentage={enhancedProgress.overallCompletion}
                      onLoadDraft={handleLoadDraft}
                      onSaveDraft={handleDraftSaved}
                      compact={true}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Navigation */}
        <WizardNavigation
          currentStep={state.currentStep}
          totalSteps={WIZARD_CONFIG.steps.length}
          currentStepTitle={currentStepConfig?.title}
          canGoNext={!Object.values(state.errors).some((error) => error)}
          canGoBack={state.currentStep > 0}
          canSubmit={enhancedProgress.readyForSubmission}
          isLoading={state.isSaving || draftState.isSaving}
          onNext={handleNextStep}
          onBack={handlePreviousStep}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          canSkipStep={currentStepConfig?.optional || false}
          onSkipStep={handleSkipStep}
          onGoToFirstError={handleGoToFirstError}
          onGoToFirstIncomplete={handleGoToFirstIncomplete}
          nextStepHint={
            state.currentStep < WIZARD_CONFIG.steps.length - 1
              ? `Next: ${WIZARD_CONFIG.steps[state.currentStep + 1]?.title}`
              : undefined
          }
          previousStepHint={
            state.currentStep > 0
              ? `Previous: ${WIZARD_CONFIG.steps[state.currentStep - 1]?.title}`
              : undefined
          }
          completionHint={`${enhancedProgress.overallCompletion}% complete`}
          hasErrors={enhancedProgress.totalErrors > 0}
          hasWarnings={enhancedProgress.totalWarnings > 0}
          errorCount={enhancedProgress.totalErrors}
          warningCount={enhancedProgress.totalWarnings}
          isDraftSaving={draftState.isSaving}
          lastDraftSaved={draftState.lastSaved || undefined}
          enableKeyboardShortcuts={true}
          compact={false}
        />
      </div>
    </div>
  );
}
