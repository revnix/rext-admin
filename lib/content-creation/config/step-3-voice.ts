/**
 * Wizard Step 3: Voice & Style
 *
 * Defines fields, options, and validation for content voice, tone,
 * and regional/language settings.
 */

import type {
  PartialContentCreationFormData,
  WizardField,
  WizardStep,
} from "@/types/content-creation";
import type { SelectOption, ValidationResult } from "@/types/shared";

// ============================================================================
// VOICE & STYLE OPTIONS
// ============================================================================

export const getToneOptions = (
  audienceType?: string[],
  readingLevel?: string
): SelectOption[] => {
  const allTones = [
    { label: "Professional", value: "Professional" },
    { label: "Casual", value: "Casual" },
    { label: "Friendly", value: "Friendly" },
    { label: "Humorous", value: "Humorous" },
    { label: "Serious", value: "Serious" },
    { label: "Technical", value: "Technical" },
    { label: "Simple", value: "Simple" },
    { label: "Inspirational", value: "Inspirational" },
  ];

  // Smart suggestions based on audience and reading level
  if (audienceType?.includes("Enterprises") || readingLevel === "Advanced") {
    return allTones
      .filter((tone) =>
        ["Professional", "Technical", "Serious"].includes(tone.value)
      )
      .concat(
        allTones.filter(
          (tone) =>
            !["Professional", "Technical", "Serious"].includes(tone.value)
        )
      );
  }

  if (audienceType?.includes("Students") || audienceType?.includes("Teens")) {
    return allTones
      .filter((tone) => ["Casual", "Friendly", "Simple"].includes(tone.value))
      .concat(
        allTones.filter(
          (tone) => !["Casual", "Friendly", "Simple"].includes(tone.value)
        )
      );
  }

  return allTones;
};

export const REGION_OPTIONS: SelectOption[] = [
  { label: "International/Global", value: "International/Global" },
  { label: "United States", value: "United States" },
  { label: "United Kingdom", value: "United Kingdom" },
  { label: "Canada", value: "Canada" },
  { label: "Australia", value: "Australia" },
  { label: "Germany", value: "Germany" },
  { label: "France", value: "France" },
  { label: "Other", value: "Other" },
];

export const LANGUAGE_OPTIONS: SelectOption[] = [
  { label: "English", value: "English" },
];

// ============================================================================
// STEP FIELDS
// ============================================================================

export const STEP_3_FIELDS: WizardField[] = [
  {
    id: "tone",
    label: "How should it sound?",
    type: "multi-select",
    required: true,
    options: (formData) =>
      getToneOptions(formData.audienceType, formData.readingLevel),
    maxSelections: 3,
    helpText: "Select up to 3 tones that match your brand",
  },
  {
    id: "region",
    label: "Target Region",
    type: "dropdown",
    required: true,
    options: REGION_OPTIONS,
    helpText: "Geographic focus for your content",
    defaultValue: "International/Global",
  },
  {
    id: "language",
    label: "Language",
    type: "dropdown",
    required: true,
    options: LANGUAGE_OPTIONS,
    helpText: "Content language",
    defaultValue: "English",
  },
];

// ============================================================================
// VALIDATION
// ============================================================================

export const validateStep3 = (
  formData: PartialContentCreationFormData
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.tone?.length) errors.push("Please select at least one tone");
  if (!formData.region) errors.push("Please select a region");
  if (!formData.language) errors.push("Please select a language");

  return { isValid: errors.length === 0, errors };
};

// ============================================================================
// STEP DEFINITION
// ============================================================================

export const STEP_3: WizardStep = {
  id: "voice-style",
  title: "Voice & Style",
  description: "Set the tone and style for your content",
  fields: STEP_3_FIELDS,
  validate: validateStep3,
  requiredFieldCount: 3,
};
