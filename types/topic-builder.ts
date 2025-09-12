/**
 * Core data interfaces for the Topic Builder application
 *
 * This module defines all TypeScript interfaces and types needed for the Topic Builder
 * wizard that supports both subject-first and industry-first content topic generation flows.
 *
 * For schema validation and field mappings, see /types/schemas.ts
 * For backend API interfaces, see /types/backend.ts
 */

// ============================================================================
// ENUM TYPE DEFINITIONS
// ============================================================================

/**
 * Wizard mode variations for the Topic Builder wizard
 */
export type WizardMode = "subject-first" | "industry-first";

/**
 * Industry/domain categories
 */
export type Industry =
  | "technology"
  | "healthcare"
  | "finance"
  | "education"
  | "travel"
  | "food"
  | "fashion"
  | "business"
  | "marketing"
  | "science"
  | "sports"
  | "lifestyle"
  | "government"
  | "real-estate"
  | "ecommerce"
  | "hr"
  | "legal"
  | "fitness"
  | "other";

/**
 * Content purpose/goal types
 */
export type PurposeType =
  | "educate-inform"
  | "entertain-engage"
  | "inspire-motivate"
  | "persuade-convince"
  | "promote-product"
  | "drive-seo"
  | "thought-leadership"
  | "other";

/**
 * Main form data interface for the Topic Builder wizard
 *
 * Updated for TypeForm-style single-question-per-screen flow.
 * Supports both flow variations:
 * - Subject-first: User starts with a specific topic/subject
 * - Industry-first: User starts with industry selection
 */
export interface TopicBuilderFormData {
  /** Wizard mode selection - determines which wizard variation to use */
  wizardMode: WizardMode;

  /** Subject-first flow: specific topic or subject (required for subject-first flow) */
  subject?: string;

  /** Industry/Domain selection (required for both flows) */
  industry: Industry;
  /** Custom industry specification when "Other" is selected */
  industry_other?: string;

  /** Audience and targeting configuration */
  /** Target audience description or persona chips */
  audience?: string[];

  /** Content goals and style preferences */
  /** Primary purposes/goals of the content */
  purpose: PurposeType[];
  /** Custom purpose when "Other" is selected */
  purpose_other?: string;

  /** Advanced options and seed inputs */
  /** Number of topics to generate */
  num_topics: number;
}

/**
 * Interface for individual generated topics
 *
 * Represents a single AI-generated topic with metadata and scoring.
 * This is the frontend representation containing UI-specific fields.
 *
 * @see SaveTopicItem in /types/backend.ts for backend API format
 * @see GeneratedTopicSchema in /types/schemas.ts for validation
 */
export interface GeneratedTopic {
  /** Unique identifier for the topic */
  id: string;
  /** The main topic title/headline */
  title: string;
  /** Specific angle or approach for the topic */
  angle: string;
  /** Optional detailed description */
  description?: string;
  /** Channels/platforms this topic fits well */
  channel_fit: string[];
  /** Audience segments this topic appeals to */
  audience_fit: string[];
  /** Explanation of why this topic would work well */
  why_it_works: string;
  /** AI-generated quality scores */
  scores: {
    /** How relevant the topic is to the input criteria (0-1) */
    relevance: number;
    /** How fresh/trending the topic is (0-1) */
    freshness: number;
    /** How novel/unique the topic approach is (0-1) */
    novelty: number;
  };
  /** Categorization tags for the topic */
  tags: string[];
  /** Whether the topic has been saved to user's library */
  is_saved?: boolean;
  /** Optimistic UI state: marks topic as saved while API call is in progress */
  _optimisticSaved?: boolean;
  /** Tracks if topic is currently being saved (for loading states) */
  _isBeingSaved?: boolean;
}

/**
 * Request payload for topic generation API
 */
export interface TopicGenerationRequest {
  /** Complete form data from the wizard */
  formData: TopicBuilderFormData;
  /** Request timestamp for tracking */
  timestamp: string;
}

/**
 * Response from topic generation API
 */
export interface TopicGenerationResponse {
  /** Array of generated topics */
  topics: GeneratedTopic[];
  /** Unique identifier for this generation request */
  request_id: string;
  /** ISO timestamp when topics were generated */
  generated_at: string;
}

// Import shared types for consistency
import type { SelectOption } from "./shared";

/**
 * @deprecated Use SelectOption from "./shared" instead
 * Kept for backwards compatibility
 */
export interface MultiSelectOption extends SelectOption {}

/**
 * Configuration for wizard step
 *
 * Defines the structure and behavior of each wizard step
 */
export interface WizardStep {
  /** Step number (1-based) */
  id: number;
  /** Display title for the step */
  title: string;
  /** Description or subtitle for the step */
  description: string;
  /** Whether this step is required to complete the wizard */
  required: boolean;
  /** Whether this step is considered "advanced" (can be collapsed) */
  advanced?: boolean;
  /** Conditions that determine when this step should be shown */
  dependsOn?: {
    /** Field name to check */
    field: keyof TopicBuilderFormData;
    /** Value(s) that trigger showing this step */
    value: string | string[];
  };
}

/**
 * Validation result for form steps
 */
export interface ValidationResult {
  /** Whether the current step data is valid */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
  /** Array of warning messages (non-blocking) */
  warnings?: string[];
}

/**
 * Local storage structure for saving draft form data
 */
export interface TopicBuilderDraft {
  /** Draft form data */
  formData: Partial<TopicBuilderFormData>;
  /** Current step when draft was saved */
  currentStep: number;
  /** When the draft was last saved */
  savedAt: string;
  /** Optional name/label for the draft */
  draftName?: string;
}

/**
 * Step navigation types for TypeForm-style wizard flow
 */
export type CurrentStep =
  | "wizard-mode"
  | "industry"
  | "subject"
  | "audience"
  | "purpose";

/**
 * Step history tracking for navigation
 */
export interface StepHistory {
  /** Array of visited steps in order */
  visited: CurrentStep[];
  /** Current active step */
  current: CurrentStep;
  /** Whether user can navigate backwards */
  canGoBack: boolean;
  /** Whether user can navigate forwards */
  canGoForward: boolean;
}

/**
 * Form state for step-based TypeForm wizard flow
 */
export interface TypeFormWizardState {
  /** Current step in the wizard */
  currentStep: CurrentStep;
  /** Step history for navigation */
  stepHistory: StepHistory;
  /** Form validation state per step */
  stepValidation: Record<CurrentStep, ValidationResult>;
  /** Whether to show validation errors */
  showValidation: boolean;
}

// ============================================================================
// CONSTANT ARRAYS FOR FORM OPTIONS
// ============================================================================

/**
 * Wizard mode options for the initial wizard step
 */
export const WIZARD_MODE_OPTIONS: SelectOption[] = [
  {
    label: "I have a specific topic in mind",
    value: "subject-first",
  },
  {
    label: "I want to explore my industry",
    value: "industry-first",
  },
];

/**
 * Industry/domain options
 */
export const INDUSTRY_OPTIONS: SelectOption[] = [
  { label: "Technology & IT", value: "technology" },
  { label: "Healthcare & Medical", value: "healthcare" },
  { label: "Finance & Banking", value: "finance" },
  { label: "Education & Learning", value: "education" },
  { label: "Travel & Hospitality", value: "travel" },
  { label: "Food & Culinary", value: "food" },
  { label: "Fashion & Beauty", value: "fashion" },
  { label: "Business & Entrepreneurship", value: "business" },
  { label: "Marketing & Advertising", value: "marketing" },
  { label: "Science & Research", value: "science" },
  { label: "Sports & Fitness", value: "sports" },
  { label: "Lifestyle & Personal Development", value: "lifestyle" },
  { label: "Government & Public Policy", value: "government" },
  { label: "Real Estate", value: "real-estate" },
  { label: "E-commerce & Retail", value: "ecommerce" },
  { label: "HR & Human Resources", value: "hr" },
  { label: "Legal & Law", value: "legal" },
  { label: "Health & Fitness", value: "fitness" },
  { label: "Other", value: "other" },
];

/**
 * Content purpose/goal options
 */
export const PURPOSE_OPTIONS: SelectOption[] = [
  { label: "Educate & Inform", value: "educate-inform" },
  { label: "Entertain & Engage", value: "entertain-engage" },
  { label: "Inspire & Motivate", value: "inspire-motivate" },
  { label: "Persuade & Convince", value: "persuade-convince" },
  { label: "Promote a Product/Service", value: "promote-product" },
  { label: "Drive SEO Traffic", value: "drive-seo" },
  { label: "Establish Thought Leadership", value: "thought-leadership" },
  { label: "Other", value: "other" },
];

// ============================================================================
// TYPE GUARDS FOR RUNTIME CHECKING
// ============================================================================

/**
 * Type guard to check if a value is a valid WizardMode
 */
export const isValidWizardMode = (value: string): value is WizardMode => {
  return value === "subject-first" || value === "industry-first";
};

/**
 * Type guard to check if a value is a valid Industry
 */
export const isValidIndustry = (value: string): value is Industry => {
  return INDUSTRY_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid PurposeType
 */
export const isValidPurposeType = (value: string): value is PurposeType => {
  return PURPOSE_OPTIONS.some((option) => option.value === value);
};

// YMYL detection function moved to /lib/topic-builder-utils.ts
// Import from there: import { detectYMYL } from "@/lib/topic-builder-utils"

/**
 * Helper function to validate an array of enum values
 */
export const validateEnumArray = <T extends string>(
  values: string[],
  validationFn: (value: string) => value is T,
): values is T[] => {
  return values.every(validationFn);
};
