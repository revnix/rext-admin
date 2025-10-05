/**
 * Wizard Configuration - Main Export
 *
 * Combines all wizard steps and provides helper functions for the
 * content creation wizard.
 */

import type {
  PartialContentCreationFormData,
  WizardConfig,
  WizardField,
  WizardStep,
} from "@/types/content-creation";

// Import all steps
import { STEP_1 } from "./step-1-basics";
import { STEP_2 } from "./step-2-audience";
import { STEP_3 } from "./step-3-voice";
import { STEP_4 } from "./step-4-structure";
import { STEP_5 } from "./step-5-research";
import { STEP_6 } from "./step-6-review";

// Re-export all options for convenience
export * from "./step-1-basics";
export * from "./step-2-audience";
export * from "./step-3-voice";
export * from "./step-4-structure";
export * from "./step-5-research";
export * from "./step-6-review";

// ============================================================================
// COMPLETE WIZARD CONFIGURATION
// ============================================================================

export const WIZARD_STEPS: WizardStep[] = [
  STEP_1,
  STEP_2,
  STEP_3,
  STEP_4,
  STEP_5,
  STEP_6,
];

export const WIZARD_CONFIG: WizardConfig = {
  steps: WIZARD_STEPS,
  validation: {
    minCompletionForDraft: 25, // Can save draft after completing 25% of fields
    requiredForSubmission: [
      "topicId",
      "platform",
      "contentType",
      "industry",
      "audienceSize",
      "audienceType",
      "readingLevel",
      "goals",
      "tone",
      "region",
      "language",
      "contentLength",
      "researchLevel",
      "factChecking",
      "contentFreshness",
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get step by ID
 */
export const getStepById = (stepId: string): WizardStep | undefined => {
  return WIZARD_STEPS.find((step) => step.id === stepId);
};

/**
 * Get field by ID across all steps
 */
export const getFieldById = (
  fieldId: keyof PartialContentCreationFormData
): WizardField | undefined => {
  for (const step of WIZARD_STEPS) {
    const field = step.fields.find((f) => f.id === fieldId);
    if (field) return field;
  }
  return undefined;
};

/**
 * Calculate wizard completion percentage
 */
export const calculateCompletionPercentage = (
  formData: PartialContentCreationFormData
): number => {
  const allFields = WIZARD_STEPS.flatMap((step) =>
    step.fields.filter((field) => field.required)
  );
  const completedFields = allFields.filter((field) => {
    const value = formData[field.id];
    return value !== undefined && value !== null && value !== "";
  });

  return Math.round((completedFields.length / allFields.length) * 100);
};

/**
 * Get next incomplete required field
 */
export const getNextIncompleteField = (
  formData: PartialContentCreationFormData
): WizardField | null => {
  for (const step of WIZARD_STEPS) {
    for (const field of step.fields) {
      if (field.required) {
        const value = formData[field.id];
        if (value === undefined || value === null || value === "") {
          return field;
        }
      }
    }
  }
  return null;
};
