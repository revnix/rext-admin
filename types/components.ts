/**
 * Component Prop Type Definitions for Topic Builder
 *
 * This module defines comprehensive TypeScript interfaces for all React component props
 * in the Topic Builder application, ensuring type safety across form components,
 * results components, and common UI components.
 */

import type * as React from "react";
import type {
  Control,
  FieldErrors,
  Path,
  UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";
import type { ApiStatus, ErrorResponse } from "./api";
// Import shared types
import type {
  FieldValue,
  IconComponent,
  SelectOption,
  ValidationResult,
} from "./shared";
// Import core types
import type { GeneratedTopic, TopicBuilderFormData } from "./topic-builder";

// ============================================================================
// FORM COMPONENT PROPS
// ============================================================================

/**
 * Props for the main Topic Builder form component
 */
export interface TopicBuilderFormProps {
  /** Form methods from React Hook Form */
  form: UseFormReturn<TopicBuilderFormData>;
  /** Current step in the wizard (1-based) */
  currentStep: number;
  /** Total number of steps in the wizard */
  totalSteps: number;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Callback when form is successfully submitted */
  onSubmit: (data: TopicBuilderFormData) => void | Promise<void>;
  /** Callback when step navigation occurs */
  onStepChange: (step: number) => void;
  /** Callback when form is reset */
  onReset?: () => void;
  /** Initial form data */
  initialData?: Partial<TopicBuilderFormData>;
  /** Whether to show debug information */
  debug?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Validation schema for current step */
  validationSchema?: z.ZodSchema;
  /** Whether to auto-save form data */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  /** Callback when form data changes */
  onChange?: (data: Partial<TopicBuilderFormData>) => void;
}

/**
 * Props for individual wizard step components
 */
export interface FormStepProps<TFieldName extends Path<TopicBuilderFormData>> {
  /** Form control from React Hook Form */
  control: Control<TopicBuilderFormData>;
  /** Field errors for this step */
  errors: FieldErrors<TopicBuilderFormData>;
  /** Current form values */
  formValues: TopicBuilderFormData;
  /** Whether this step is active */
  isActive: boolean;
  /** Whether this step has been visited */
  isVisited: boolean;
  /** Whether this step is valid */
  isValid: boolean;
  /** Step number (1-based) */
  stepNumber: number;
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Fields included in this step */
  fields: TFieldName[];
  /** Callback when step validation completes */
  onValidation?: (result: ValidationResult) => void;
  /** Callback when field value changes */
  onFieldChange?: <K extends keyof TopicBuilderFormData>(
    field: K,
    value: FieldValue<TopicBuilderFormData, K>,
  ) => void;
  /** Whether to show validation errors immediately */
  showErrors?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Additional step-specific props */
  stepProps?: Record<string, unknown>;
}

/**
 * Props for form navigation controls
 */
export interface FormNavigationProps {
  /** Current step number (1-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether the current step is valid */
  isCurrentStepValid: boolean;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether first step (disable previous) */
  isFirstStep: boolean;
  /** Whether last step (show submit instead of next) */
  isLastStep: boolean;
  /** Callback to go to previous step */
  onPrevious: () => void;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to submit form */
  onSubmit: () => void;
  /** Callback to reset form */
  onReset?: () => void;
  /** Previous button text */
  previousText?: string;
  /** Next button text */
  nextText?: string;
  /** Submit button text */
  submitText?: string;
  /** Reset button text */
  resetText?: string;
  /** Whether to show reset button */
  showReset?: boolean;
  /** Whether to show step indicators */
  showStepIndicators?: boolean;
  /** Step titles for indicators */
  stepTitles?: string[];
  /** Custom CSS classes */
  className?: string;
}

/**
 * Props for form field wrapper components
 */
export interface FormFieldProps<TFieldName extends Path<TopicBuilderFormData>> {
  /** Field name */
  name: TFieldName;
  /** Form control */
  control: Control<TopicBuilderFormData>;
  /** Field label */
  label: string;
  /** Field description/help text */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom validation rules */
  rules?: object;
  /** Custom CSS classes */
  className?: string;
  /** Field error message */
  error?: string;
  /** Whether to show validation state visually */
  showValidation?: boolean;
}

// ============================================================================
// RESULTS COMPONENT PROPS
// ============================================================================

/**
 * Props for the topic results container component
 */
export interface TopicResultsProps {
  /** Generated topics to display */
  topics: GeneratedTopic[];
  /** API status */
  status: ApiStatus;
  /** Error information if generation failed */
  error?: ErrorResponse | Error | null;
  /** Whether user can interact with results */
  interactive?: boolean;
  /** Callback when topic is selected */
  onTopicSelect?: (topic: GeneratedTopic) => void;
  /** Callback when topics are saved */
  onTopicsSave?: (topicIds: string[]) => void | Promise<void>;
  /** Callback when topic is regenerated */
  onTopicRegenerate?: (topicId: string) => void | Promise<void>;
  /** Callback when topics are exported */
  onTopicsExport?: (topicIds: string[], format: string) => void | Promise<void>;
  /** Callback when results are cleared */
  onClear?: () => void;
  /** Selected topic IDs */
  selectedTopicIds?: string[];
  /** Whether to show bulk actions */
  showBulkActions?: boolean;
  /** Whether to show export options */
  showExportOptions?: boolean;
  /** Whether to show regeneration options */
  showRegenerateOptions?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Loading state for specific actions */
  loadingStates?: {
    saving?: boolean;
    exporting?: boolean;
    regenerating?: boolean;
  };
}

/**
 * Props for individual topic card components
 */
export interface TopicCardProps {
  /** Topic data to display */
  topic: GeneratedTopic;
  /** Whether topic is selected */
  isSelected?: boolean;
  /** Whether topic is being loaded/processed */
  isLoading?: boolean;
  /** Whether card is interactive */
  interactive?: boolean;
  /** Card display variant */
  variant?: "default" | "compact" | "detailed";
  /** Callback when topic is clicked */
  onClick?: (topic: GeneratedTopic) => void;
  /** Callback when topic is selected/deselected */
  onSelect?: (topic: GeneratedTopic, selected: boolean) => void;
  /** Callback when save button is clicked */
  onSave?: (topic: GeneratedTopic) => void;
  /** Callback when regenerate button is clicked */
  onRegenerate?: (topic: GeneratedTopic) => void;
  /** Callback when edit button is clicked */
  onEdit?: (topic: GeneratedTopic) => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Whether to show scores */
  showScores?: boolean;
  /** Whether to show tags */
  showTags?: boolean;
  /** Whether to show audience fit */
  showAudienceFit?: boolean;
  /** Whether to show channel fit */
  showChannelFit?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Topic filter configuration
 */
export interface TopicFilters {
  tags?: string[];
  channels?: string[];
  audiences?: string[];
  minRelevance?: number;
  minFreshness?: number;
  minNovelty?: number;
  searchQuery?: string;
}

/**
 * Props for topic filtering controls
 */
export interface TopicFilterProps {
  /** Available filter options */
  availableFilters: {
    tags: string[];
    channels: string[];
    audiences: string[];
  };
  /** Current filter values */
  filters: TopicFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: TopicFilters) => void;
  /** Callback when filters are cleared */
  onClearFilters: () => void;
  /** Whether to show advanced filters */
  showAdvanced?: boolean;
  /** Number of topics matching current filters */
  matchingCount?: number;
  /** Total number of topics */
  totalCount?: number;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Props for topic sorting controls
 */
export interface TopicSortProps {
  /** Available sort options */
  sortOptions: Array<{
    label: string;
    value: string;
    field:
      | keyof GeneratedTopic
      | "scores.relevance"
      | "scores.trend_level"
      | "scores.uniqueness";
    direction?: "asc" | "desc";
  }>;
  /** Current sort configuration */
  sortBy: string;
  /** Sort direction */
  sortDirection: "asc" | "desc";
  /** Callback when sort changes */
  onSortChange: (sortBy: string, direction: "asc" | "desc") => void;
  /** Whether to show direction toggle */
  showDirectionToggle?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Props for bulk action controls in results
 */
export interface BulkActionProps {
  /** Selected topic IDs */
  selectedIds: string[];
  /** Total number of topics */
  totalCount: number;
  /** Available bulk actions */
  actions: Array<{
    id: string;
    label: string;
    icon?: IconComponent;
    variant?: "default" | "destructive";
    disabled?: boolean;
  }>;
  /** Callback when bulk action is triggered */
  onAction: (actionId: string, selectedIds: string[]) => void | Promise<void>;
  /** Callback when selection is cleared */
  onClearSelection: () => void;
  /** Callback when all items are selected */
  onSelectAll: () => void;
  /** Loading states for specific actions */
  loadingStates?: Record<string, boolean>;
  /** Custom CSS classes */
  className?: string;
}

// ============================================================================
// COMMON COMPONENT PROPS
// ============================================================================

/**
 * Enhanced button props extending HTML button with custom variants
 * Note: Individual button components use CVA's VariantProps for proper type inference.
 * This interface provides a general type for button-like components.
 */
export interface ButtonProps
  extends Omit<React.ComponentProps<"button">, "size"> {
  /** Whether button is in loading state */
  loading?: boolean;
  /** Loading text to show */
  loadingText?: string;
  /** Icon to display (React component) */
  icon?: IconComponent;
  /** Icon position */
  iconPosition?: "left" | "right";
  /** Whether button should render as child component */
  asChild?: boolean;
  /** Tooltip text */
  tooltip?: string;
  /** Button size variant */
  size?: "default" | "sm" | "lg" | "icon";
  /** Button visual variant */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

/**
 * Enhanced input props extending HTML input
 */
export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size"> {
  /** Input validation state */
  state?: "default" | "error" | "success" | "warning";
  /** Left icon component */
  leftIcon?: IconComponent;
  /** Right icon component */
  rightIcon?: IconComponent;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Success message */
  successMessage?: string;
  /** Whether input is in loading state */
  loading?: boolean;
  /** Callback when clear button is clicked (for search inputs) */
  onClear?: () => void;
  /** Whether to show clear button */
  showClear?: boolean;
  /** Input size variant */
  size?: "default" | "sm" | "lg";
}

/**
 * Enhanced select props for custom select components
 */
export interface SelectProps<T = string> {
  /** Available options */
  options: Array<{
    label: string;
    value: T;
    disabled?: boolean;
    description?: string;
    icon?: IconComponent;
  }>;
  /** Current selected value */
  value: T | undefined;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether select is disabled */
  disabled?: boolean;
  /** Whether select is in loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether to allow custom values */
  allowCustom?: boolean;
  /** Callback when custom value is added */
  onCustomAdd?: (value: string) => void;
  /** Whether select is required */
  required?: boolean;
  /** Search placeholder for searchable selects */
  searchPlaceholder?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom CSS classes */
  className?: string;
  /** Select size variant */
  size?: "default" | "sm" | "lg";
}

/**
 * Props for multi-select components
 */
export interface MultiSelectProps<T = string>
  extends Omit<SelectProps<T>, "value" | "onChange"> {
  /** Selected values */
  selected: T[];
  /** Callback when selection changes */
  onChange: (selected: T[]) => void;
  /** Maximum number of selections allowed */
  maxSelections?: number;
  /** Whether to show selection count */
  showCount?: boolean;
  /** Custom render for selected items */
  renderSelected?: (items: T[]) => React.ReactNode;
}

/**
 * Enhanced props for chip input components with dual enter behavior and accessibility
 */
export type {
  ChipInputProps,
  ControlledChipInputProps,
} from "@/components/ui/typeform/chip-input";

/**
 * Props for components that support step advancement (wizard navigation)
 */
export interface StepAdvancementProps {
  /** Callback to advance to next wizard step */
  onStepAdvance?: () => void;
  /** Whether component should handle dual enter behavior */
  enableDualEnter?: boolean;
}

/**
 * Props for textarea components
 */
export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** Textarea validation state */
  state?: "default" | "error" | "success" | "warning";
  /** Helper text below textarea */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Success message */
  successMessage?: string;
  /** Whether to show character count */
  showCount?: boolean;
  /** Maximum character count */
  maxLength?: number;
  /** Auto-resize behavior */
  resize?: "none" | "vertical" | "horizontal" | "both" | "auto";
  /** Textarea size variant */
  size?: "default" | "sm" | "lg";
}

/**
 * Props for collapsible sections (for advanced options)
 */
export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Whether section is currently open (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Section content */
  children: React.ReactNode;
  /** Icon for the section */
  icon?: IconComponent;
  /** Whether section is disabled */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Trigger element variant */
  variant?: "default" | "ghost" | "outline";
}

/**
 * Props for step indicator components
 */
export interface StepIndicatorProps {
  /** Current step (1-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step configuration */
  steps: Array<{
    id: number;
    title: string;
    description?: string;
    icon?: IconComponent;
    optional?: boolean;
  }>;
  /** Callback when step is clicked */
  onStepClick?: (step: number) => void;
  /** Whether steps are clickable */
  interactive?: boolean;
  /** Display variant */
  variant?: "horizontal" | "vertical";
  /** Size variant */
  size?: "default" | "sm" | "lg";
  /** Custom CSS classes */
  className?: string;
}

/**
 * Props for loading spinner components
 */
export interface LoadingSpinnerProps {
  /** Loading message */
  message?: string;
  /** Spinner size */
  size?: "sm" | "default" | "lg";
  /** Whether to show overlay */
  overlay?: boolean;
  /** Spinner variant */
  variant?: "default" | "dots" | "pulse";
  /** Custom CSS classes */
  className?: string;
}

/**
 * Props for empty state components
 */
export interface EmptyStateProps {
  /** Empty state title */
  title: string;
  /** Empty state description */
  description?: string;
  /** Icon to display */
  icon?: IconComponent;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
  };
  /** Custom illustration */
  illustration?: React.ReactNode;
  /** Custom CSS classes */
  className?: string;
}

// ============================================================================
// WIZARD-SPECIFIC COMPONENT PROPS
// ============================================================================

/**
 * Props for industry selection component
 */
export interface IndustrySelectionProps {
  /** Available industry options */
  industries: SelectOption[];
  /** Selected industry */
  selectedIndustry?: string;
  /** Custom industry value (when "other" is selected) */
  customIndustry?: string;
  /** Callback when industry changes */
  onIndustryChange: (industry: string) => void;
  /** Callback when custom industry changes */
  onCustomIndustryChange: (customIndustry: string) => void;
  /** Whether YMYL detection is active */
  showYMYLDetection?: boolean;
  /** YMYL status */
  isYMYL?: boolean;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Props for audience chips/selection component
 */
export interface AudienceSelectionProps {
  /** Available audience options (can be dynamic based on industry) */
  audienceOptions: SelectOption[];
  /** Selected audiences */
  selectedAudiences: string[];
  /** Reader level selection */
  readerLevel?: string;
  /** Callback when audiences change */
  onAudiencesChange: (audiences: string[]) => void;
  /** Callback when reader level changes */
  onReaderLevelChange: (level: string) => void;
  /** Whether to show reader level selector */
  showReaderLevel?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Props for preference toggle components
 */
export interface PreferenceToggleProps {
  /** Toggle label */
  label: string;
  /** Toggle options */
  options: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Whether toggle is disabled */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// ============================================================================
// EVENT HANDLER TYPES
// ============================================================================

/**
 * Form event handlers
 */
export type FormEventHandlers = {
  onSubmit: (data: TopicBuilderFormData) => void | Promise<void>;
  onStepChange: (step: number) => void;
  onFieldChange: <K extends keyof TopicBuilderFormData>(
    field: K,
    value: FieldValue<TopicBuilderFormData, K>,
  ) => void;
  onValidation: (result: ValidationResult) => void;
  onError: (error: Error | ErrorResponse) => void;
  onReset: () => void;
};

/**
 * Results event handlers
 */
export type ResultsEventHandlers = {
  onTopicSelect: (topic: GeneratedTopic) => void;
  onTopicsSave: (topicIds: string[]) => Promise<void>;
  onTopicRegenerate: (topicId: string) => Promise<void>;
  onTopicsExport: (topicIds: string[], format: string) => Promise<void>;
  onBulkAction: (action: string, topicIds: string[]) => Promise<void>;
  onFilterChange: (filters: TopicFilters) => void;
  onSortChange: (sortBy: string, direction: "asc" | "desc") => void;
};

// ============================================================================
// UTILITY TYPES FOR COMPONENT COMPOSITION
// ============================================================================

/**
 * Props that can be forwarded to child components
 */
export type ForwardableProps = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Props for components that can be controlled or uncontrolled
 */
export type ControllableProps<T> = {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
};

/**
 * Props for components with loading states
 */
export type LoadingStateProps = {
  loading?: boolean;
  loadingText?: string;
};

/**
 * Props for components with error states
 */
export type ErrorStateProps = {
  error?: string | Error | ErrorResponse | null;
  onErrorDismiss?: () => void;
};

/**
 * Combined state props for components that might have loading/error states
 */
export type AsyncStateProps = LoadingStateProps & ErrorStateProps;

/**
 * Accessibility props for interactive components
 */
export type AccessibilityProps = {
  /** ARIA label for screen readers */
  "aria-label"?: string;
  /** ARIA described by element ID */
  "aria-describedby"?: string;
  /** ARIA expanded state for combobox-like components */
  "aria-expanded"?: boolean;
  /** ARIA required state */
  "aria-required"?: boolean;
  /** ARIA invalid state */
  "aria-invalid"?: boolean;
  /** Role for the component */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
};

/**
 * Keyboard navigation support for multi-select components
 */
export type KeyboardNavigationProps = {
  /** Currently focused chip index (-1 for input, 0+ for chips) */
  focusedChipIndex?: number;
  /** Callback when chip focus changes */
  onChipFocus?: (index: number) => void;
  /** Callback when chip is deleted via keyboard */
  onChipDelete?: (index: number) => void;
  /** Whether keyboard navigation is enabled */
  enableKeyboardNavigation?: boolean;
};

// ============================================================================
// TYPE GUARDS FOR COMPONENT PROPS
// ============================================================================

/**
 * Type guard to check if an error is a structured ErrorResponse
 */
export const isErrorResponse = (error: unknown): error is ErrorResponse => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "error_code" in error
  );
};

/**
 * Type guard to check if component has loading state
 */
export const hasLoadingState = (props: unknown): props is LoadingStateProps => {
  return typeof props === "object" && props !== null && "loading" in props;
};

/**
 * Type guard to check if component has error state
 */
export const hasErrorState = (props: unknown): props is ErrorStateProps => {
  return typeof props === "object" && props !== null && "error" in props;
};
