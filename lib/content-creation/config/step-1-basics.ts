/**
 * Wizard Step 1: Topic & Content Configuration
 *
 * Defines fields, options, and validation for the first step where users
 * select their topic and define basic content parameters.
 */

import type {
  PartialContentCreationFormData,
  Platform,
  WizardField,
  WizardStep,
} from "@/types/content-creation";
import type { SelectOption, ValidationResult } from "@/types/shared";

// ============================================================================
// PLATFORM & CONTENT TYPE OPTIONS
// ============================================================================

export const PLATFORM_OPTIONS: SelectOption[] = [
  {
    label: "Website",
    value: "Website",
    description: "Articles, blog posts, landing pages",
  },
  {
    label: "Social Media",
    value: "Social Media",
    description: "Threads, carousels, posts, videos",
    disabled: true,
    tooltip: "Coming soon",
  },
];

export const getContentTypeOptions = (platform: Platform): SelectOption[] => {
  const comingSoonTooltip = "Coming soon";

  const options: Record<Platform, SelectOption[]> = {
    Website: [
      {
        label: "Article / Blog Post",
        value: "Article",
        description: "Long-form or narrative content for your site",
      },
      {
        label: "Landing Page",
        value: "Landing Page",
        description: "Conversion-focused content",
        disabled: true,
        tooltip: comingSoonTooltip,
      },
      {
        label: "Case Study",
        value: "Case Study",
        description: "Success story documentation",
        disabled: true,
        tooltip: comingSoonTooltip,
      },
      {
        label: "White Paper",
        value: "White Paper",
        description: "In-depth technical content",
        disabled: true,
        tooltip: comingSoonTooltip,
      },
    ],
    "Social Media": [
      {
        label: "Thread",
        value: "Thread",
        description: "Multi-part Twitter/X thread",
        disabled: true,
        tooltip: comingSoonTooltip,
      },
      {
        label: "Carousel",
        value: "Carousel",
        description: "Instagram/LinkedIn carousel",
        disabled: true,
        tooltip: comingSoonTooltip,
      },
      {
        label: "Post",
        value: "Post",
        description: "Single social media post",
        disabled: true,
        tooltip: comingSoonTooltip,
      },
      {
        label: "Poll",
        value: "Poll",
        description: "Interactive poll content",
        disabled: true,
        tooltip: comingSoonTooltip,
      },
      {
        label: "Video Script",
        value: "Video Script",
        description: "Script for video content",
        disabled: true,
        tooltip: comingSoonTooltip,
      },
    ],
  };

  return options[platform] || [];
};

export const INDUSTRY_OPTIONS: SelectOption[] = [
  { label: "Technology", value: "Technology" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Finance", value: "Finance" },
  { label: "Education", value: "Education" },
  { label: "Marketing", value: "Marketing" },
  { label: "E-commerce", value: "E-commerce" },
  { label: "Manufacturing", value: "Manufacturing" },
  { label: "Real Estate", value: "Real Estate" },
  { label: "Entertainment", value: "Entertainment" },
  { label: "Consulting", value: "Consulting" },
  { label: "Other", value: "Other" },
];

// ============================================================================
// STEP FIELDS
// ============================================================================

export const STEP_1_FIELDS: WizardField[] = [
  {
    id: "topicId",
    label: "Select Topic",
    type: "dropdown",
    required: true,
    helpText: "Choose the topic you want to create content about",
    options: [], // Will be loaded from API
  },
  {
    id: "platform",
    label: "Select Platform",
    type: "radio",
    required: true,
    options: PLATFORM_OPTIONS,
    helpText: "Where will this content be published?",
    defaultValue: "Website",
  },
  {
    id: "contentType",
    label: "Content Type",
    type: "radio",
    required: true,
    defaultValue: "Article",
    options: (formData) =>
      getContentTypeOptions(formData.platform || "Website"),
    dependsOn: [
      {
        field: "platform",
        values: ["Website", "Social Media"],
        action: "filter-options",
      },
    ],
    helpText: "What type of content do you want to create?",
  },
  {
    id: "industry",
    label: "Industry",
    type: "radio",
    required: true,
    options: INDUSTRY_OPTIONS,
    helpText: "Your business industry (can be pre-filled from topic)",
  },
];

// ============================================================================
// VALIDATION
// ============================================================================

export const validateStep1 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.topicId) errors.push("Please select a topic");
  if (!formData.platform) errors.push("Please select a platform");
  if (!formData.contentType) errors.push("Please select a content type");
  if (!formData.industry) errors.push("Please select an industry");

  return { isValid: errors.length === 0, errors };
};

// ============================================================================
// STEP DEFINITION
// ============================================================================

export const STEP_1: WizardStep = {
  id: "topic-content",
  title: "Topic & Content Type",
  description:
    "Choose your topic and define what type of content you want to create",
  fields: STEP_1_FIELDS,
  validate: validateStep1,
  requiredFieldCount: 4,
};
