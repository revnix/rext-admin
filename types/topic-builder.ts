/**
 * Core data interfaces for the Topic Builder application
 *
 * This module defines all TypeScript interfaces and types needed for the Topic Builder
 * wizard that supports both subject-first and industry-first content topic generation flows.
 */

/**
 * Main form data interface for the Topic Builder wizard
 *
 * Supports both flow variations:
 * - Subject-first: User starts with a specific topic/subject
 * - Industry-first: User starts with industry selection, optionally adds focus
 */
export interface TopicBuilderFormData {
  /** Flow type selection - determines which wizard variation to use */
  flowType: "subject-first" | "industry-first";

  /** Subject-first flow: specific topic or subject (required for subject-first flow) */
  subject?: string;

  /** Industry/Domain selection (required for both flows) */
  industry: string;
  /** Custom industry specification when "Other" is selected */
  industry_other?: string;

  /** Content type and platform configuration */
  content_type: string;
  /** Custom content type when "Other" is selected */
  content_type_other?: string;
  /** Platform/channel for publication (conditional on content type) */
  platform?: string;
  /** Custom platform when "Other" is selected */
  platform_other?: string;

  /** Audience and targeting configuration */
  /** Target audience description or persona chips */
  audience?: string;
  /** Estimated size of target audience */
  audience_size?: string;
  /** Demographic age group selections */
  demographic_age: string[];
  /** Geographic/location targeting */
  demographic_location: string[];
  /** Reader experience level (beginner/intermediate/expert) */
  reader_level?: string;

  /** Content goals and style preferences */
  /** Primary purposes/goals of the content */
  purpose: string[];
  /** Custom purpose when "Other" is selected */
  purpose_other?: string;
  /** Content goal types (tutorial, explainer, news, etc.) */
  content_goal: string[];
  /** Tone and voice preferences */
  tone: string[];
  /** Custom tone when "Other" is selected */
  tone_other?: string;

  /** Advanced options and seed inputs */
  /** Keywords or key phrases to focus on */
  keywords?: string;
  /** Topics or angles to exclude */
  exclude?: string;
  /** Industry-first flow: specific focus within the industry */
  focus?: string;
  /** Number of topic ideas to generate */
  num_ideas: number;
  /** Additional notes or special instructions */
  notes?: string;

  /** Localization preferences */
  /** Target region/country */
  region?: string;
  /** Content language */
  language?: string;

  /** Content sensitivity and compliance */
  /** Auto-detected for sensitive industries (health/finance/legal) */
  is_ymyl?: boolean;

  /** Content preference toggles */
  /** Balance between trending vs evergreen content */
  fresh_vs_evergreen?: "fresh" | "evergreen" | "balanced";
  /** Balance between safe/conventional vs original/contrarian */
  safe_vs_original?: "safe" | "original" | "balanced";
}

/**
 * Interface for individual generated topic ideas
 *
 * Represents a single AI-generated topic with metadata and scoring
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
  /** Array of generated topic ideas */
  topics: GeneratedTopic[];
  /** Unique identifier for this generation request */
  request_id: string;
  /** ISO timestamp when topics were generated */
  generated_at: string;
}

/**
 * Option interface for multi-select components
 *
 * Used by MultiSelect and SelectWithCustom UI components
 */
export interface MultiSelectOption {
  /** Display label for the option */
  label: string;
  /** Internal value for the option */
  value: string;
}

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
