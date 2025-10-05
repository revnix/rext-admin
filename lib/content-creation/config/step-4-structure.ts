/**
 * Wizard Step 4: Content Structure
 *
 * Defines fields, options, and validation for content length, keywords,
 * SEO settings, and structural elements.
 */

import type {
  PartialContentCreationFormData,
  WizardField,
  WizardStep,
} from "@/types/content-creation";
import type { SelectOption, ValidationResult } from "@/types/shared";

// ============================================================================
// CONTENT STRUCTURE OPTIONS
// ============================================================================

export const getContentLengthOptions = (
  contentType?: string,
): SelectOption[] => {
  const options: Record<string, SelectOption[]> = {
    Thread: [
      { label: "Short (5-10 tweets)", value: "Short" },
      { label: "Medium (10-15 tweets)", value: "Medium" },
      { label: "Long (15-25 tweets)", value: "Long" },
      { label: "Custom", value: "Custom" },
    ],
    Article: [
      { label: "Short (500-800 words)", value: "Short" },
      { label: "Medium (800-1500 words)", value: "Medium" },
      { label: "Long (1500-3000 words)", value: "Long" },
      { label: "Custom", value: "Custom" },
    ],
    "Blog Post": [
      { label: "Short (300-600 words)", value: "Short" },
      { label: "Medium (600-1200 words)", value: "Medium" },
      { label: "Long (1200-2500 words)", value: "Long" },
      { label: "Custom", value: "Custom" },
    ],
  };

  return options[contentType || "Article"] || options.Article;
};

export const SEARCH_INTENT_OPTIONS: SelectOption[] = [
  {
    label: "Informational",
    value: "Informational",
    description: "Seeking information",
  },
  {
    label: "Navigational",
    value: "Navigational",
    description: "Finding specific sites",
  },
  {
    label: "Transactional",
    value: "Transactional",
    description: "Ready to buy/act",
  },
  {
    label: "Commercial",
    value: "Commercial",
    description: "Researching to buy",
  },
];

// ============================================================================
// STEP FIELDS
// ============================================================================

export const STEP_4_FIELDS: WizardField[] = [
  {
    id: "contentLength",
    label: "How long should it be?",
    type: "custom-length",
    required: true,
    options: (formData) => getContentLengthOptions(formData.contentType),
    dependsOn: [{ field: "contentType", values: [], action: "filter-options" }],
    helpText: "Choose a preset length or specify custom requirements",
    defaultValue: { type: "preset", preset: "Medium" },
  },
  {
    id: "primaryKeywords",
    label: "Primary Keywords",
    type: "tag-input",
    required: false,
    helpText: "Main keywords for SEO (optional, AI can suggest based on topic)",
    placeholder: "Enter keywords...",
  },
  {
    id: "searchIntent",
    label: "Search Intent",
    type: "multi-select",
    required: false,
    options: SEARCH_INTENT_OPTIONS,
    visible: (formData) => formData.goals?.includes("Drive SEO") || false,
    helpText: "What are users looking for when they search?",
  },
  {
    id: "includeTOC",
    label: "Include Table of Contents",
    type: "toggle",
    required: false,
    visible: (formData) => {
      if (formData.contentLength?.type === "preset") {
        return ["Medium", "Long"].includes(formData.contentLength.preset || "");
      }
      return true;
    },
    helpText: "Add a table of contents for longer content",
    defaultValue: false,
  },
  {
    id: "includeSummary",
    label: "Include Summary",
    type: "toggle",
    required: false,
    visible: (formData) => {
      if (formData.contentLength?.type === "preset") {
        return ["Medium", "Long"].includes(formData.contentLength.preset || "");
      }
      return true;
    },
    helpText: "Add an executive summary",
    defaultValue: false,
  },
  {
    id: "includeCTA",
    label: "Include Call-to-Action",
    type: "toggle",
    required: false,
    visible: (formData) =>
      formData.goals?.some((goal) => ["Promote", "Persuade"].includes(goal)) ||
      false,
    helpText: "Add a call-to-action section",
    defaultValue: false,
  },
  {
    id: "includeKeyTakeaways",
    label: "Include Key Takeaways",
    type: "toggle",
    required: false,
    helpText: "Add a key takeaways section",
    defaultValue: false,
  },
];

// ============================================================================
// VALIDATION
// ============================================================================

export const validateStep4 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.contentLength) errors.push("Please specify content length");

  return { isValid: errors.length === 0, errors };
};

// ============================================================================
// STEP DEFINITION
// ============================================================================

export const STEP_4: WizardStep = {
  id: "content-structure",
  title: "Content Structure",
  description: "Configure length, keywords, and structural elements",
  fields: STEP_4_FIELDS,
  validate: validateStep4,
  requiredFieldCount: 1,
};
