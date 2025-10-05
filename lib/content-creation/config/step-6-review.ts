/**
 * Wizard Step 6: Review & Launch
 *
 * Defines fields, options, and validation for human review settings
 * and final launch configuration.
 */

import type {
  PartialContentCreationFormData,
  WizardField,
  WizardStep,
} from "@/types/content-creation";
import type { ValidationResult } from "@/types/shared";

// ============================================================================
// STEP FIELDS
// ============================================================================

export const STEP_6_FIELDS: WizardField[] = [
  {
    id: "enableHumansInLoop",
    label: "Enable Human Review",
    type: "toggle",
    required: false,
    helpText: "Add human reviewers to approve content before publication",
    defaultValue: false,
  },
  {
    id: "humanReviewers",
    label: "Select Reviewers",
    type: "multi-select",
    required: false,
    visible: (formData) => formData.enableHumansInLoop || false,
    options: [], // Will be loaded from API (team members)
    helpText: "Choose team members to review the generated content",
  },
];

// ============================================================================
// VALIDATION
// ============================================================================

export const validateStep6 = (
  formData: PartialContentCreationFormData
): ValidationResult => {
  const errors: string[] = [];

  if (formData.enableHumansInLoop && !formData.humanReviewers?.length) {
    errors.push(
      "Please select at least one reviewer when human review is enabled"
    );
  }

  return { isValid: errors.length === 0, errors };
};

// ============================================================================
// STEP DEFINITION
// ============================================================================

export const STEP_6: WizardStep = {
  id: "review-launch",
  title: "Review & Launch",
  description:
    "Set up human review process and finalize your content creation",
  fields: STEP_6_FIELDS,
  validate: validateStep6,
  requiredFieldCount: 0,
  optional: true,
};
