/**
 * Wizard Step 5: Research Settings
 *
 * Defines fields, options, and validation for research depth,
 * fact-checking, and content freshness settings.
 */

import type {
  PartialContentCreationFormData,
  WizardField,
  WizardStep,
} from "@/types/content-creation";
import type { SelectOption, ValidationResult } from "@/types/shared";

// ============================================================================
// RESEARCH OPTIONS
// ============================================================================

export const RESEARCH_LEVEL_OPTIONS: SelectOption[] = [
  {
    label: "Basic",
    value: "Basic",
    description: "Quick research, 5-10 sources",
  },
  {
    label: "Comprehensive",
    value: "Comprehensive",
    description: "Thorough research, 10-20 sources",
  },
  {
    label: "Expert",
    value: "Expert",
    description: "Deep research, 20+ sources",
  },
];

export const FACT_CHECKING_OPTIONS: SelectOption[] = [
  { label: "Basic", value: "Basic", description: "Standard verification" },
  {
    label: "Standard",
    value: "Standard",
    description: "Enhanced fact checking",
  },
  { label: "Strict", value: "Strict", description: "Rigorous verification" },
];

export const CONTENT_FRESHNESS_OPTIONS: SelectOption[] = [
  { label: "Very Recent (1 month)", value: "Very Recent (1 month)" },
  { label: "Recent (6 months)", value: "Recent (6 months)" },
  { label: "Moderate (1 year)", value: "Moderate (1 year)" },
  { label: "Extended (2 years)", value: "Extended (2 years)" },
  { label: "All Time", value: "All Time" },
];

// ============================================================================
// STEP FIELDS
// ============================================================================

export const STEP_5_FIELDS: WizardField[] = [
  {
    id: "researchLevel",
    label: "Research Level",
    type: "radio",
    required: true,
    options: RESEARCH_LEVEL_OPTIONS,
    helpText: "How thorough should the research be?",
    defaultValue: "Comprehensive",
  },
  {
    id: "includeLatestInfo",
    label: "Include Latest Information",
    type: "toggle",
    required: false,
    helpText: "Prioritize recent developments and news",
    defaultValue: true,
  },
  {
    id: "includeExamples",
    label: "Include Examples",
    type: "toggle",
    required: false,
    helpText: "Add real-world examples and case studies",
    defaultValue: true,
  },
  {
    id: "factChecking",
    label: "Fact Checking Level",
    type: "radio",
    required: true,
    options: FACT_CHECKING_OPTIONS,
    helpText: "How rigorous should fact verification be?",
    defaultValue: "Standard",
  },
  {
    id: "contentFreshness",
    label: "Content Freshness",
    type: "radio",
    required: true,
    options: CONTENT_FRESHNESS_OPTIONS,
    helpText: "How recent should source material be?",
    defaultValue: "Recent (6 months)",
  },
  {
    id: "includeStatistics",
    label: "Include Statistics",
    type: "toggle",
    required: false,
    helpText: "Add relevant data and statistics",
    defaultValue: true,
  },
  {
    id: "includeQuotes",
    label: "Include Quotes",
    type: "toggle",
    required: false,
    helpText: "Add expert quotes and insights",
    defaultValue: true,
  },
  {
    id: "competitorAnalysis",
    label: "Competitor Analysis",
    type: "toggle",
    required: false,
    helpText: "Research competitor content for insights",
    defaultValue: false,
  },
];

// ============================================================================
// VALIDATION
// ============================================================================

export const validateStep5 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.researchLevel) errors.push("Please select research level");
  if (!formData.factChecking) errors.push("Please select fact checking level");
  if (!formData.contentFreshness)
    errors.push("Please select content freshness");

  return { isValid: errors.length === 0, errors };
};

// ============================================================================
// STEP DEFINITION
// ============================================================================

export const STEP_5: WizardStep = {
  id: "research-settings",
  title: "Research Settings",
  description: "Choose how thorough and current the research should be",
  fields: STEP_5_FIELDS,
  validate: validateStep5,
  requiredFieldCount: 3,
};
