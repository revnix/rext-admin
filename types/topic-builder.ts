/**
 * Core data interfaces for the Topic Builder application
 *
 * This module defines all TypeScript interfaces and types needed for the Topic Builder
 * wizard that supports both subject-first and industry-first content topic generation flows.
 */

// ============================================================================
// ENUM TYPE DEFINITIONS
// ============================================================================

/**
 * Flow type variations for the Topic Builder wizard
 */
export type FlowType = "subject-first" | "industry-first";

/**
 * Content type/format options
 */
export type ContentType =
  | "blog-post"
  | "social-media"
  | "video-content"
  | "podcast"
  | "infographic"
  | "ebook-guide"
  | "case-study"
  | "whitepaper"
  | "newsletter"
  | "presentation"
  | "press-release"
  | "other";

/**
 * Platform/channel options for content distribution
 */
export type Platform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "website"
  | "blog"
  | "vimeo"
  | "other";

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
 * Reader experience level options
 */
export type ReaderLevel = "beginner" | "intermediate" | "expert";

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
 * Content goal categories
 */
export type ContentGoalType =
  | "tutorial"
  | "explainer"
  | "news-trend"
  | "opinion-leadership"
  | "listicle"
  | "case-study"
  | "comparison"
  | "faq"
  | "other";

/**
 * Tone and voice options
 */
export type ToneType =
  | "professional-formal"
  | "casual-conversational"
  | "friendly-warm"
  | "humorous-playful"
  | "serious-academic"
  | "technical-analytical"
  | "simple-accessible"
  | "inspirational-uplifting"
  | "other";

/**
 * Audience size categories
 */
export type AudienceSize = "small" | "medium" | "large" | "massive";

/**
 * Geographic region options
 */
export type Region =
  | "us"
  | "uk"
  | "canada"
  | "australia"
  | "pakistan"
  | "india"
  | "europe"
  | "global"
  | "other";

/**
 * Language options
 */
export type Language =
  | "english"
  | "urdu"
  | "spanish"
  | "french"
  | "german"
  | "arabic"
  | "chinese"
  | "japanese"
  | "other";

/**
 * Content preference toggles
 */
export type PreferenceToggle = "fresh" | "evergreen" | "balanced";
export type OriginalityToggle = "safe" | "original" | "balanced";

/**
 * Main form data interface for the Topic Builder wizard
 *
 * Supports both flow variations:
 * - Subject-first: User starts with a specific topic/subject
 * - Industry-first: User starts with industry selection, optionally adds focus
 */
export interface TopicBuilderFormData {
  /** Flow type selection - determines which wizard variation to use */
  flowType: FlowType;

  /** Subject-first flow: specific topic or subject (required for subject-first flow) */
  subject?: string;

  /** Industry/Domain selection (required for both flows) */
  industry: Industry;
  /** Custom industry specification when "Other" is selected */
  industry_other?: string;

  /** Content type and platform configuration */
  content_type: ContentType;
  /** Custom content type when "Other" is selected */
  content_type_other?: string;
  /** Platform/channel for publication (conditional on content type) */
  platform?: Platform;
  /** Custom platform when "Other" is selected */
  platform_other?: string;

  /** Audience and targeting configuration */
  /** Target audience description or persona chips */
  audience?: string;
  /** Estimated size of target audience */
  audience_size?: AudienceSize;
  /** Demographic age group selections */
  demographic_age: string[];
  /** Geographic/location targeting */
  demographic_location: string[];
  /** Reader experience level (beginner/intermediate/expert) */
  reader_level?: ReaderLevel;

  /** Content goals and style preferences */
  /** Primary purposes/goals of the content */
  purpose: PurposeType[];
  /** Custom purpose when "Other" is selected */
  purpose_other?: string;
  /** Content goal types (tutorial, explainer, news, etc.) */
  content_goal: ContentGoalType[];
  /** Tone and voice preferences */
  tone: ToneType[];
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
  region?: Region;
  /** Content language */
  language?: Language;

  /** Content sensitivity and compliance */
  /** Auto-detected for sensitive industries (health/finance/legal) */
  is_ymyl?: boolean;

  /** Content preference toggles */
  /** Balance between trending vs evergreen content */
  fresh_vs_evergreen?: PreferenceToggle;
  /** Balance between safe/conventional vs original/contrarian */
  safe_vs_original?: OriginalityToggle;
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

// ============================================================================
// CONSTANT ARRAYS FOR FORM OPTIONS
// ============================================================================

/**
 * Flow type options for the initial wizard step
 */
export const FLOW_TYPE_OPTIONS: MultiSelectOption[] = [
  {
    label: "Subject-First - I have a specific topic in mind",
    value: "subject-first",
  },
  {
    label: "Industry-First - I want ideas for my industry",
    value: "industry-first",
  },
];

/**
 * Content type/format options
 */
export const CONTENT_TYPE_OPTIONS: MultiSelectOption[] = [
  { label: "Blog Post / Article", value: "blog-post" },
  { label: "Social Media Post", value: "social-media" },
  { label: "Video Content", value: "video-content" },
  { label: "Podcast Episode", value: "podcast" },
  { label: "Infographic", value: "infographic" },
  { label: "E-book / Guide", value: "ebook-guide" },
  { label: "Case Study", value: "case-study" },
  { label: "Whitepaper / Report", value: "whitepaper" },
  { label: "Email Newsletter", value: "newsletter" },
  { label: "Presentation / Webinar", value: "presentation" },
  { label: "Press Release", value: "press-release" },
  { label: "Other", value: "other" },
];

/**
 * Platform/channel options (shown conditionally for social media and video content)
 */
export const PLATFORM_OPTIONS: MultiSelectOption[] = [
  { label: "Facebook", value: "facebook" },
  { label: "Instagram", value: "instagram" },
  { label: "Twitter (X)", value: "twitter" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "TikTok", value: "tiktok" },
  { label: "YouTube", value: "youtube" },
  { label: "Website/Blog", value: "website" },
  { label: "Vimeo", value: "vimeo" },
  { label: "Other", value: "other" },
];

/**
 * Industry/domain options
 */
export const INDUSTRY_OPTIONS: MultiSelectOption[] = [
  { label: "Technology / IT", value: "technology" },
  { label: "Healthcare / Medical", value: "healthcare" },
  { label: "Finance / Banking", value: "finance" },
  { label: "Education / E-Learning", value: "education" },
  { label: "Travel / Hospitality", value: "travel" },
  { label: "Food / Culinary", value: "food" },
  { label: "Fashion / Beauty", value: "fashion" },
  { label: "Business / Entrepreneurship", value: "business" },
  { label: "Marketing / Advertising", value: "marketing" },
  { label: "Science / Research", value: "science" },
  { label: "Sports / Fitness", value: "sports" },
  { label: "Lifestyle / Personal Development", value: "lifestyle" },
  { label: "Government / Public Policy", value: "government" },
  { label: "Real Estate", value: "real-estate" },
  { label: "E-commerce / Retail", value: "ecommerce" },
  { label: "HR / Human Resources", value: "hr" },
  { label: "Legal / Law", value: "legal" },
  { label: "Fitness / Health", value: "fitness" },
  { label: "Other", value: "other" },
];

/**
 * Reader experience level options
 */
export const READER_LEVEL_OPTIONS: MultiSelectOption[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
];

/**
 * Content purpose/goal options
 */
export const PURPOSE_OPTIONS: MultiSelectOption[] = [
  { label: "Educate / Inform", value: "educate-inform" },
  { label: "Entertain / Engage", value: "entertain-engage" },
  { label: "Inspire / Motivate", value: "inspire-motivate" },
  { label: "Persuade / Convince", value: "persuade-convince" },
  { label: "Promote a Product/Service", value: "promote-product" },
  { label: "Drive SEO Traffic", value: "drive-seo" },
  { label: "Establish Thought Leadership", value: "thought-leadership" },
  { label: "Other", value: "other" },
];

/**
 * Content goal type options
 */
export const CONTENT_GOAL_OPTIONS: MultiSelectOption[] = [
  { label: "Tutorial / How-to", value: "tutorial" },
  { label: "Explainer / Beginner Guide", value: "explainer" },
  { label: "News / Update / Trend", value: "news-trend" },
  { label: "Opinion / Thought Leadership", value: "opinion-leadership" },
  { label: "Listicle / Checklist / Playbook", value: "listicle" },
  { label: "Case Study / Story", value: "case-study" },
  { label: "Comparison (X vs Y)", value: "comparison" },
  { label: "FAQs / Common Questions", value: "faq" },
  { label: "Other", value: "other" },
];

/**
 * Tone and voice options
 */
export const TONE_OPTIONS: MultiSelectOption[] = [
  { label: "Professional / Formal", value: "professional-formal" },
  { label: "Casual / Conversational", value: "casual-conversational" },
  { label: "Friendly / Warm", value: "friendly-warm" },
  { label: "Humorous / Playful", value: "humorous-playful" },
  { label: "Serious / Academic", value: "serious-academic" },
  { label: "Technical / Analytical", value: "technical-analytical" },
  { label: "Simple / Accessible", value: "simple-accessible" },
  { label: "Inspirational / Uplifting", value: "inspirational-uplifting" },
  { label: "Other", value: "other" },
];

/**
 * Audience size options
 */
export const AUDIENCE_SIZE_OPTIONS: MultiSelectOption[] = [
  { label: "Small (< 1,000 people)", value: "small" },
  { label: "Medium (1K - 10K people)", value: "medium" },
  { label: "Large (10K - 100K people)", value: "large" },
  { label: "Massive (100K+ people)", value: "massive" },
];

/**
 * Geographic region options
 */
export const REGION_OPTIONS: MultiSelectOption[] = [
  { label: "United States", value: "us" },
  { label: "United Kingdom", value: "uk" },
  { label: "Canada", value: "canada" },
  { label: "Australia", value: "australia" },
  { label: "Pakistan", value: "pakistan" },
  { label: "India", value: "india" },
  { label: "Europe", value: "europe" },
  { label: "Global / International", value: "global" },
  { label: "Other", value: "other" },
];

/**
 * Language options
 */
export const LANGUAGE_OPTIONS: MultiSelectOption[] = [
  { label: "English", value: "english" },
  { label: "Urdu", value: "urdu" },
  { label: "Spanish", value: "spanish" },
  { label: "French", value: "french" },
  { label: "German", value: "german" },
  { label: "Arabic", value: "arabic" },
  { label: "Chinese", value: "chinese" },
  { label: "Japanese", value: "japanese" },
  { label: "Other", value: "other" },
];

/**
 * Content preference toggle options
 */
export const PREFERENCE_TOGGLE_OPTIONS: MultiSelectOption[] = [
  { label: "Fresh & Trending", value: "fresh" },
  { label: "Evergreen", value: "evergreen" },
  { label: "Balanced", value: "balanced" },
];

/**
 * Originality toggle options
 */
export const ORIGINALITY_TOGGLE_OPTIONS: MultiSelectOption[] = [
  { label: "Safe / Conventional", value: "safe" },
  { label: "Original / Contrarian", value: "original" },
  { label: "Balanced", value: "balanced" },
];

// ============================================================================
// TYPE GUARDS FOR RUNTIME CHECKING
// ============================================================================

/**
 * Type guard to check if a value is a valid FlowType
 */
export const isValidFlowType = (value: string): value is FlowType => {
  return value === "subject-first" || value === "industry-first";
};

/**
 * Type guard to check if a value is a valid ContentType
 */
export const isValidContentType = (value: string): value is ContentType => {
  return CONTENT_TYPE_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid Platform
 */
export const isValidPlatform = (value: string): value is Platform => {
  return PLATFORM_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid Industry
 */
export const isValidIndustry = (value: string): value is Industry => {
  return INDUSTRY_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid ReaderLevel
 */
export const isValidReaderLevel = (value: string): value is ReaderLevel => {
  return READER_LEVEL_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid PurposeType
 */
export const isValidPurposeType = (value: string): value is PurposeType => {
  return PURPOSE_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid ContentGoalType
 */
export const isValidContentGoalType = (
  value: string,
): value is ContentGoalType => {
  return CONTENT_GOAL_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid ToneType
 */
export const isValidToneType = (value: string): value is ToneType => {
  return TONE_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid AudienceSize
 */
export const isValidAudienceSize = (value: string): value is AudienceSize => {
  return AUDIENCE_SIZE_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid Region
 */
export const isValidRegion = (value: string): value is Region => {
  return REGION_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid Language
 */
export const isValidLanguage = (value: string): value is Language => {
  return LANGUAGE_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid PreferenceToggle
 */
export const isValidPreferenceToggle = (
  value: string,
): value is PreferenceToggle => {
  return PREFERENCE_TOGGLE_OPTIONS.some((option) => option.value === value);
};

/**
 * Type guard to check if a value is a valid OriginalityToggle
 */
export const isValidOriginalityToggle = (
  value: string,
): value is OriginalityToggle => {
  return ORIGINALITY_TOGGLE_OPTIONS.some((option) => option.value === value);
};

/**
 * Helper function to detect YMYL (Your Money or Your Life) industries
 * YMYL content affects a person's future happiness, health, financial stability, or safety
 */
export const detectYMYL = (industry: string): boolean => {
  const ymylIndustries: Industry[] = ["healthcare", "finance", "legal"];
  return ymylIndustries.includes(industry as Industry);
};

/**
 * Helper function to validate an array of enum values
 */
export const validateEnumArray = <T extends string>(
  values: string[],
  validationFn: (value: string) => value is T,
): values is T[] => {
  return values.every(validationFn);
};
