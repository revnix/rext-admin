/**
 * Wizard Step 2: Audience & Goals
 *
 * Defines fields, options, and validation for audience targeting and
 * content goals configuration.
 */

import type {
  PartialContentCreationFormData,
  WizardField,
  WizardStep,
} from "@/types/content-creation";
import type { SelectOption, ValidationResult } from "@/types/shared";

// ============================================================================
// AUDIENCE OPTIONS
// ============================================================================

export const AUDIENCE_SIZE_OPTIONS: SelectOption[] = [
  {
    label: "Small (1K-10K)",
    value: "Small",
    description: "Close-knit community",
  },
  {
    label: "Medium (10K-100K)",
    value: "Medium",
    description: "Growing audience",
  },
  {
    label: "Large (100K+)",
    value: "Large",
    description: "Broad reach audience",
  },
];

export const getAudienceTypeOptions = (industry?: string): SelectOption[] => {
  const baseOptions = [
    { label: "Consumers", value: "Consumers" },
    { label: "Businesses", value: "Businesses" },
    { label: "Enterprises", value: "Enterprises" },
    { label: "Students", value: "Students" },
    { label: "Professionals", value: "Professionals" },
    { label: "Seniors", value: "Seniors" },
    { label: "Teens", value: "Teens" },
    { label: "Parents", value: "Parents" },
  ];

  // Industry-specific filtering logic
  const industryFilters: Record<string, string[]> = {
    Technology: ["Businesses", "Enterprises", "Professionals", "Students"],
    Healthcare: ["Consumers", "Professionals", "Seniors", "Parents"],
    Finance: ["Consumers", "Businesses", "Enterprises", "Professionals"],
    Education: ["Students", "Professionals", "Parents"],
    Marketing: ["Businesses", "Professionals"],
    "E-commerce": ["Consumers", "Businesses"],
  };

  if (industry && industryFilters[industry]) {
    return baseOptions.filter((option) =>
      industryFilters[industry].includes(option.value),
    );
  }

  return baseOptions;
};

export const READING_LEVEL_OPTIONS: SelectOption[] = [
  {
    label: "Beginner",
    value: "Beginner",
    description: "Simple, easy to understand",
  },
  {
    label: "Intermediate",
    value: "Intermediate",
    description: "Some technical terms",
  },
  {
    label: "Advanced",
    value: "Advanced",
    description: "Technical, industry-specific",
  },
];

export const GOALS_OPTIONS: SelectOption[] = [
  { label: "Educate", value: "Educate", description: "Inform and teach" },
  { label: "Entertain", value: "Entertain", description: "Engage and amuse" },
  { label: "Inspire", value: "Inspire", description: "Motivate and encourage" },
  {
    label: "Persuade",
    value: "Persuade",
    description: "Convince and influence",
  },
  {
    label: "Promote",
    value: "Promote",
    description: "Market products/services",
  },
  {
    label: "Drive SEO",
    value: "Drive SEO",
    description: "Improve search rankings",
  },
  {
    label: "Thought Leadership",
    value: "Thought Leadership",
    description: "Establish authority",
  },
];

// ============================================================================
// STEP FIELDS
// ============================================================================

export const STEP_2_FIELDS: WizardField[] = [
  {
    id: "audienceSize",
    label: "Audience Size",
    type: "radio",
    required: true,
    options: AUDIENCE_SIZE_OPTIONS,
    helpText: "Approximate size of your target audience",
    defaultValue: "Medium",
  },
  {
    id: "audienceType",
    label: "Who's your audience?",
    type: "multi-select",
    required: true,
    options: (formData) => getAudienceTypeOptions(formData.industry),
    dependsOn: [{ field: "industry", values: [], action: "filter-options" }],
    maxSelections: 3,
    helpText: "Select up to 3 audience types",
  },
  {
    id: "readingLevel",
    label: "Reading Level",
    type: "radio",
    required: true,
    options: READING_LEVEL_OPTIONS,
    helpText: "How technical should the content be?",
    defaultValue: "Intermediate",
  },
  {
    id: "goals",
    label: "Content Goals",
    type: "multi-select",
    required: true,
    options: GOALS_OPTIONS,
    maxSelections: 3,
    helpText: "What do you want to achieve with this content?",
  },
];

// ============================================================================
// VALIDATION
// ============================================================================

export const validateStep2 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.audienceSize) errors.push("Please select audience size");
  if (!formData.audienceType?.length)
    errors.push("Please select at least one audience type");
  if (!formData.readingLevel) errors.push("Please select reading level");
  if (!formData.goals?.length) errors.push("Please select at least one goal");

  return { isValid: errors.length === 0, errors };
};

// ============================================================================
// STEP DEFINITION
// ============================================================================

export const STEP_2: WizardStep = {
  id: "audience-goals",
  title: "Audience & Goals",
  description: "Define who you're writing for and what you want to achieve",
  fields: STEP_2_FIELDS,
  validate: validateStep2,
  requiredFieldCount: 4,
};
