/**
 * Content Creation Wizard Configuration
 *
 * This module defines the complete wizard configuration including all steps,
 * fields, dependencies, and validation rules for the content creation wizard.
 */

import type {
  PartialContentCreationFormData,
  Platform,
  WizardConfig,
  WizardField,
  WizardStep,
} from "@/types/content-creation";
import type { SelectOption, ValidationResult } from "@/types/shared";

// ============================================================================
// OPTION DEFINITIONS
// ============================================================================

/** Platform options */
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

/** Content type options based on platform */
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

/** Industry options */
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

/** Audience size options */
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

/** Audience type options filtered by industry */
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

/** Reading level options */
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

/** Goals/purpose options */
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

/** Tone options with smart suggestions */
export const getToneOptions = (
  audienceType?: string[],
  readingLevel?: string,
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
        ["Professional", "Technical", "Serious"].includes(tone.value),
      )
      .concat(
        allTones.filter(
          (tone) =>
            !["Professional", "Technical", "Serious"].includes(tone.value),
        ),
      );
  }

  if (audienceType?.includes("Students") || audienceType?.includes("Teens")) {
    return allTones
      .filter((tone) => ["Casual", "Friendly", "Simple"].includes(tone.value))
      .concat(
        allTones.filter(
          (tone) => !["Casual", "Friendly", "Simple"].includes(tone.value),
        ),
      );
  }

  return allTones;
};

/** Region options */
export const REGION_OPTIONS: SelectOption[] = [
  { label: "International/Global", value: "International/Global" },
  { label: "Other", value: "Other" },
];

/** Language options (simplified for now) */
export const LANGUAGE_OPTIONS: SelectOption[] = [
  { label: "English", value: "English" },
  {
    label: "Other",
    value: "other",
    disabled: true,
  },
];

/** Content length options based on content type */
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

/** Search intent options */
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

/** Research level options */
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

/** Fact checking level options */
export const FACT_CHECKING_OPTIONS: SelectOption[] = [
  { label: "Basic", value: "Basic", description: "Standard verification" },
  {
    label: "Standard",
    value: "Standard",
    description: "Enhanced fact checking",
  },
  { label: "Strict", value: "Strict", description: "Rigorous verification" },
];

/** Content freshness options */
export const CONTENT_FRESHNESS_OPTIONS: SelectOption[] = [
  { label: "Very Recent (1 month)", value: "Very Recent (1 month)" },
  { label: "Recent (6 months)", value: "Recent (6 months)" },
  { label: "Moderate (1 year)", value: "Moderate (1 year)" },
  { label: "Extended (2 years)", value: "Extended (2 years)" },
  { label: "All Time", value: "All Time" },
];

// ============================================================================
// STEP FIELD DEFINITIONS
// ============================================================================

/** Step 1: Topic & Content Configuration Fields */
const STEP_1_FIELDS: WizardField[] = [
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

/** Step 2: Audience & Goals Fields */
const STEP_2_FIELDS: WizardField[] = [
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

/** Step 3: Voice & Style Fields */
const STEP_3_FIELDS: WizardField[] = [
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

/** Step 4: Content Structure Fields */
const STEP_4_FIELDS: WizardField[] = [
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

/** Step 5: Research Settings Fields */
const STEP_5_FIELDS: WizardField[] = [
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

/** Step 6: Review & Launch Fields */
const STEP_6_FIELDS: WizardField[] = [
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
// STEP VALIDATION FUNCTIONS
// ============================================================================

const validateStep1 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.topicId) errors.push("Please select a topic");
  if (!formData.platform) errors.push("Please select a platform");
  if (!formData.contentType) errors.push("Please select a content type");
  if (!formData.industry) errors.push("Please select an industry");

  return { isValid: errors.length === 0, errors };
};

const validateStep2 = (
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

const validateStep3 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.tone?.length) errors.push("Please select at least one tone");
  if (!formData.region) errors.push("Please select a region");
  if (!formData.language) errors.push("Please select a language");

  return { isValid: errors.length === 0, errors };
};

const validateStep4 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.contentLength) errors.push("Please specify content length");

  return { isValid: errors.length === 0, errors };
};

const validateStep5 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (!formData.researchLevel) errors.push("Please select research level");
  if (!formData.factChecking) errors.push("Please select fact checking level");
  if (!formData.contentFreshness)
    errors.push("Please select content freshness");

  return { isValid: errors.length === 0, errors };
};

const validateStep6 = (
  formData: PartialContentCreationFormData,
): ValidationResult => {
  const errors: string[] = [];

  if (formData.enableHumansInLoop && !formData.humanReviewers?.length) {
    errors.push(
      "Please select at least one reviewer when human review is enabled",
    );
  }

  return { isValid: errors.length === 0, errors };
};

// ============================================================================
// COMPLETE WIZARD CONFIGURATION
// ============================================================================

/** Complete wizard step definitions */
export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "topic-content",
    title: "Topic & Content Type",
    description:
      "Choose your topic and define what type of content you want to create",
    fields: STEP_1_FIELDS,
    validate: validateStep1,
    requiredFieldCount: 4,
  },
  {
    id: "audience-goals",
    title: "Audience & Goals",
    description: "Define who you're writing for and what you want to achieve",
    fields: STEP_2_FIELDS,
    validate: validateStep2,
    requiredFieldCount: 4,
  },
  {
    id: "voice-style",
    title: "Voice & Style",
    description: "Set the tone and style for your content",
    fields: STEP_3_FIELDS,
    validate: validateStep3,
    requiredFieldCount: 3,
  },
  {
    id: "content-structure",
    title: "Content Structure",
    description: "Configure length, keywords, and structural elements",
    fields: STEP_4_FIELDS,
    validate: validateStep4,
    requiredFieldCount: 1,
  },
  {
    id: "research-settings",
    title: "Research Settings",
    description: "Choose how thorough and current the research should be",
    fields: STEP_5_FIELDS,
    validate: validateStep5,
    requiredFieldCount: 3,
  },
  {
    id: "review-launch",
    title: "Review & Launch",
    description:
      "Set up human review process and finalize your content creation",
    fields: STEP_6_FIELDS,
    validate: validateStep6,
    requiredFieldCount: 0,
    optional: true,
  },
];

/** Complete wizard configuration */
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

/** Get step by ID */
export const getStepById = (stepId: string): WizardStep | undefined => {
  return WIZARD_STEPS.find((step) => step.id === stepId);
};

/** Get field by ID across all steps */
export const getFieldById = (
  fieldId: keyof PartialContentCreationFormData,
): WizardField | undefined => {
  for (const step of WIZARD_STEPS) {
    const field = step.fields.find((f) => f.id === fieldId);
    if (field) return field;
  }
  return undefined;
};

/** Calculate wizard completion percentage */
export const calculateCompletionPercentage = (
  formData: PartialContentCreationFormData,
): number => {
  const allFields = WIZARD_STEPS.flatMap((step) =>
    step.fields.filter((field) => field.required),
  );
  const completedFields = allFields.filter((field) => {
    const value = formData[field.id];
    return value !== undefined && value !== null && value !== "";
  });

  return Math.round((completedFields.length / allFields.length) * 100);
};

/** Get next incomplete required field */
export const getNextIncompleteField = (
  formData: PartialContentCreationFormData,
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
