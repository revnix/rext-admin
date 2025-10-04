/**
 * Content Creation Wizard Type Definitions
 *
 * This module contains all type definitions for the content creation wizard,
 * including form data, wizard configuration, and component interfaces.
 */

import type { FormFieldValue, SelectOption, ValidationResult } from "./shared";
import type { GeneratedTopic } from "./topic-builder";

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/** Platform options for content creation */
export type Platform = "Website" | "Social Media";

/** Content types based on platform */
export interface ContentTypeOptions {
  Website:
    | "Article"
    | "Blog Post"
    | "Landing Page"
    | "Case Study"
    | "White Paper";
  "Social Media": "Thread" | "Carousel" | "Post" | "Poll" | "Video Script";
}

/** Audience size categories */
export type AudienceSize = "Small" | "Medium" | "Large";

/** Reading level options */
export type ReadingLevel = "Beginner" | "Intermediate" | "Advanced";

/** Research level options */
export type ResearchLevel = "Basic" | "Comprehensive" | "Expert";

/** Fact checking levels */
export type FactCheckingLevel = "Basic" | "Standard" | "Strict";

/** Content freshness time ranges */
export type ContentFreshness =
  | "Very Recent (1 month)"
  | "Recent (6 months)"
  | "Moderate (1 year)"
  | "Extended (2 years)"
  | "All Time";

/** Content length configuration */
export interface ContentLengthOption {
  type: "preset" | "custom";
  preset?: "Short" | "Medium" | "Long";
  custom?: {
    value: number;
    unit: "words" | "characters" | "tweets";
  };
}

// ============================================================================
// FORM DATA INTERFACES
// ============================================================================

/**
 * Metadata for tracking pre-filled fields from topic data
 */
export interface TopicPrefillingMetadata extends Record<string, unknown> {
  /** Topic ID that was used for pre-filling */
  topicId?: string;
  /** Fields that were auto-filled from topic data */
  prefilledFields: Record<string, boolean>;
  /** Original topic suggested_defaults for reference */
  originalSuggestedDefaults?: Record<string, unknown>;
  /** Original topic user_settings for reference */
  originalUserSettings?: Record<string, unknown>;
}

/**
 * Main form data interface for the content creation wizard
 * Contains all data collected across all wizard steps
 */
export interface ContentCreationFormData {
  // Step 1: Topic & Content Configuration
  topicId: string;
  platform: Platform;
  contentType: string; // Dynamic based on platform
  industry: string;

  // Step 2: Audience & Goals
  audienceSize: AudienceSize;
  audienceType: string[];
  readingLevel: ReadingLevel;
  goals: string[];

  // Step 3: Voice & Localization
  tone: string[];
  region: string;
  language: string;

  // Step 4: Content Structure
  contentLength: ContentLengthOption;
  primaryKeywords: string[];
  searchIntent: string[];
  includeTOC: boolean;
  includeSummary: boolean;
  includeCTA: boolean;
  includeKeyTakeaways: boolean;

  // Step 5: Research Settings (Simplified)
  researchLevel: ResearchLevel;
  includeLatestInfo: boolean;
  includeExamples: boolean;
  factChecking: FactCheckingLevel;
  contentFreshness: ContentFreshness;
  includeStatistics: boolean;
  includeQuotes: boolean;
  competitorAnalysis: boolean;

  // Step 6: Human Review
  enableHumansInLoop: boolean;
  humanReviewers: string[];

  // Auto-handled fields (not shown in wizard)
  projectId?: string; // Auto-attached
  flowName?: string; // Auto-generated
  format: "Markdown"; // Default
  includeFrontMatter: boolean; // Auto true

  // Metadata (not visible to user)
  _topicPrefillingMetadata?: TopicPrefillingMetadata;
}

/**
 * Partial form data type for incomplete wizard state
 */
export type PartialContentCreationFormData = Partial<ContentCreationFormData>;

// ============================================================================
// WIZARD CONFIGURATION INTERFACES
// ============================================================================

/**
 * Field dependency configuration for conditional logic
 */
export interface FieldDependency {
  /** Field that this dependency depends on */
  field: keyof ContentCreationFormData;
  /** Values that trigger this dependency */
  values: FormFieldValue[];
  /** Action to take when dependency is met */
  action: "show" | "hide" | "filter-options" | "suggest-values";
  /** Target field for filter-options action */
  targetField?: keyof ContentCreationFormData;
}

/**
 * Individual wizard field configuration
 */
export interface WizardField {
  /** Unique field identifier */
  id: keyof ContentCreationFormData;
  /** Human-readable field label */
  label: string;
  /** Field input type */
  type:
    | "radio"
    | "multi-select"
    | "dropdown"
    | "toggle"
    | "tag-input"
    | "custom-length"
    | "text";
  /** Whether field is required */
  required: boolean;
  /** Static options or function to generate options based on form data */
  options?:
    | SelectOption[]
    | ((formData: PartialContentCreationFormData) => SelectOption[]);
  /** Field dependencies for conditional display/behavior */
  dependsOn?: FieldDependency[];
  /** Function to determine if field should be visible */
  visible?: (formData: PartialContentCreationFormData) => boolean;
  /** Help text displayed under field */
  helpText?: string;
  /** Default value for field */
  defaultValue?: FormFieldValue;
  /** Placeholder text for input fields */
  placeholder?: string;
  /** Maximum number of selections for multi-select */
  maxSelections?: number;
  /** Whether to show field as inline or block */
  layout?: "inline" | "block";
}

/**
 * Wizard step configuration
 */
export interface WizardStep {
  /** Unique step identifier */
  id: string;
  /** Step title displayed to user */
  title: string;
  /** Step description/subtitle */
  description: string;
  /** Fields included in this step */
  fields: WizardField[];
  /** Whether step can be skipped */
  optional?: boolean;
  /** Function to validate step completion */
  validate?: (formData: PartialContentCreationFormData) => ValidationResult;
  /** Minimum fields required to proceed */
  requiredFieldCount?: number;
}

/**
 * Complete wizard configuration
 */
export interface WizardConfig {
  /** All wizard steps */
  steps: WizardStep[];
  /** Global validation rules */
  validation: {
    /** Minimum completion percentage to allow saving draft */
    minCompletionForDraft: number;
    /** Fields that must be completed before final submission */
    requiredForSubmission: (keyof ContentCreationFormData)[];
  };
}

// ============================================================================
// WIZARD STATE INTERFACES
// ============================================================================

/**
 * Controls when wizard sidebar should surface validation feedback per step
 */
export interface WizardStepFeedbackStateEntry {
  /** Whether general validation indicators should display */
  showValidation: boolean;
  /** Whether error styling/badges should appear */
  showErrors: boolean;
  /** Whether warning styling/badges should appear */
  showWarnings: boolean;
  /** Whether the step has been interacted with or completed */
  isVisited: boolean;
}

/**
 * Current wizard state
 */
export interface WizardState {
  /** Current step index (0-based) */
  currentStep: number;
  /** Form data collected so far */
  formData: PartialContentCreationFormData;
  /** Field-level errors */
  errors: Partial<Record<keyof ContentCreationFormData, string>>;
  /** Fields that have been touched/interacted with */
  touched: Partial<Record<keyof ContentCreationFormData, boolean>>;
  /** Whether current step is valid */
  isStepValid: boolean;
  /** Whether user can proceed to next step */
  canProceed: boolean;
  /** Whether wizard is in saving state */
  isSaving: boolean;
  /** Last auto-save timestamp */
  lastSaved?: Date;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Wizard navigation actions
 */
export type WizardAction =
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "GO_TO_STEP"; payload: number }
  | {
      type: "UPDATE_FIELD";
      payload: { field: keyof ContentCreationFormData; value: FormFieldValue };
    }
  | {
      type: "UPDATE_MULTIPLE_FIELDS";
      payload: Partial<ContentCreationFormData>;
    }
  | {
      type: "SET_ERROR";
      payload: { field: keyof ContentCreationFormData; error: string };
    }
  | { type: "CLEAR_ERROR"; payload: keyof ContentCreationFormData }
  | { type: "TOUCH_FIELD"; payload: keyof ContentCreationFormData }
  | { type: "SAVE_DRAFT" }
  | { type: "LOAD_DRAFT"; payload: PartialContentCreationFormData }
  | { type: "RESET_WIZARD" }
  | { type: "SUBMIT_FORM" }
  | { type: "CLEAR_AUTOFILLED_VALUES" }
  | {
      type: "PREFILL_FROM_TOPIC";
      payload: {
        topicData: GeneratedTopic;
        suggestedDefaults?: Record<string, unknown>;
        userSettings?: Record<string, unknown>;
      };
    };

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

/**
 * Props for the main wizard container component
 */
export interface ContentCreationWizardProps {
  /** Initial form data (for editing existing content) */
  initialData?: PartialContentCreationFormData;
  /** Initial topic ID from URL parameter */
  initialTopicId?: string | null;
  /** Callback when form is successfully submitted */
  onSubmit?: (data: ContentCreationFormData) => Promise<void>;
  /** Callback when draft is saved */
  onSaveDraft?: (data: PartialContentCreationFormData) => Promise<void>;
  /** Callback when wizard is cancelled */
  onCancel?: () => void;
  /** Whether to show debug information */
  debug?: boolean;
}

/**
 * Props for individual step components
 */
export interface WizardStepProps {
  /** Current step configuration */
  step: WizardStep;
  /** Current form data */
  formData: PartialContentCreationFormData;
  /** Field error messages */
  errors: Partial<Record<keyof ContentCreationFormData, string>>;
  /** Touched fields */
  touched: Partial<Record<keyof ContentCreationFormData, boolean>>;
  /** Whether step is currently active */
  isActive: boolean;
  /** Callback when field value changes */
  onFieldChange: (
    field: keyof ContentCreationFormData,
    value: FormFieldValue,
  ) => void;
  /** Callback when field is touched */
  onFieldTouch: (field: keyof ContentCreationFormData) => void;
  /** Whether step can be skipped */
  canSkip?: boolean;
}

/**
 * Props for the wizard progress indicator
 */
export interface WizardProgressProps {
  /** Current step index */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Completed fields count */
  completedFields: number;
  /** Total fields count */
  totalFields: number;
  /** Step completion status */
  stepStatuses: ("completed" | "current" | "pending")[];
  /** Whether current step can be skipped */
  canSkipCurrentStep: boolean;
}

// ============================================================================
// API INTERFACES
// ============================================================================

/**
 * Request payload for content creation
 */
export interface CreateContentRequest extends ContentCreationFormData {
  /** Auto-generated request ID */
  requestId: string;
  /** Timestamp when request was created */
  createdAt: string;
}

/**
 * Response from content creation API
 */
export interface CreateContentResponse {
  /** Created content ID */
  contentId: string;
  /** Flow execution ID for tracking progress */
  flowExecutionId: string;
  /** Initial status */
  status: "queued" | "processing" | "completed" | "failed";
  /** Estimated completion time in seconds */
  estimatedCompletion?: number;
  /** Any immediate validation warnings */
  warnings?: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract content type based on platform
 */
export type ContentTypeForPlatform<T extends Platform> = T extends "Website"
  ? ContentTypeOptions["Website"]
  : T extends "Social Media"
    ? ContentTypeOptions["Social Media"]
    : never;

/**
 * Type guard to check if form data is complete
 */
export const isCompleteFormData = (
  data: PartialContentCreationFormData,
): data is ContentCreationFormData => {
  const requiredFields: (keyof ContentCreationFormData)[] = [
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
    "includeLatestInfo",
    "includeExamples",
    "factChecking",
    "contentFreshness",
    "includeStatistics",
    "includeQuotes",
    "competitorAnalysis",
    "enableHumansInLoop",
    "format",
    "includeFrontMatter",
  ];

  return requiredFields.every(
    (field) => data[field] !== undefined && data[field] !== null,
  );
};

/**
 * Default form data values
 */
export const getDefaultFormData = (): PartialContentCreationFormData => ({
  platform: "Website",
  audienceSize: "Medium",
  readingLevel: "Intermediate",
  tone: [],
  region: "International/Global",
  language: "English",
  contentLength: { type: "preset", preset: "Medium" },
  primaryKeywords: [],
  searchIntent: [],
  includeTOC: false,
  includeSummary: false,
  includeCTA: false,
  includeKeyTakeaways: false,
  researchLevel: "Comprehensive",
  includeLatestInfo: true,
  includeExamples: true,
  factChecking: "Standard",
  contentFreshness: "Recent (6 months)",
  includeStatistics: true,
  includeQuotes: true,
  competitorAnalysis: false,
  enableHumansInLoop: false,
  humanReviewers: [],
  format: "Markdown",
  includeFrontMatter: true,
});
