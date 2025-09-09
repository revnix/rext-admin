/**
 * TypeScript type definitions for the TypeForm-like Topic Builder Wizard
 *
 * This module defines all types, interfaces, and enums needed for the new
 * single-question-per-screen wizard flow, including navigation, animations,
 * validation, and accessibility patterns.
 */

import type { TopicBuilderFormData } from "./topic-builder";

// ============================================================================
// CORE WIZARD TYPES
// ============================================================================

/**
 * Direction of navigation through the wizard
 */
export type NavigationDirection = "forward" | "backward";

/**
 * Current state of a wizard question
 */
export type QuestionState = "not-visited" | "current" | "completed" | "skipped";

/**
 * Progress information for the wizard
 */
export interface WizardProgress {
  /** Current step number (1-based) */
  current: number;
  /** Total number of steps */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * Types of questions in the wizard
 */
export type QuestionType =
  | "single-select" // Radio button selection
  | "multi-select" // Checkbox selection
  | "text-input" // Text input or textarea
  | "number-input" // Number input
  | "chip-input" // Chip/tag input
  | "wizard-mode" // Initial wizard mode selection
  | "slider" // Number slider
  | "conditional"; // Conditional question based on previous answers

/**
 * Validation result for a question or field
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Question configuration definition
 */
export interface QuestionConfig {
  /** Unique identifier for the question */
  id: string;

  /** Type of question component */
  type: QuestionType;

  /** Main question title (large, conversational) */
  title: string;

  /** Optional subtitle/description for additional context */
  description?: string;

  /** Whether this question is required to proceed */
  required: boolean;

  /** Function to determine if this question should be shown */
  conditional?: (formData: TopicBuilderFormData) => boolean;

  /** Custom validation function for this question */
  validation?: (
    value: unknown,
    formData: TopicBuilderFormData,
  ) => ValidationResult;

  /** Whether to auto-advance after selection (for single-select) */
  autoAdvance?: boolean;

  /** Help text shown below the question */
  helpText?: string;

  /** Accessibility label override */
  accessibilityLabel?: string;

  /** Estimated time to complete this question (in seconds) */
  estimatedTime?: number;
}

/**
 * Option for select-type questions
 */
export interface QuestionOption {
  /** Unique value for this option */
  value: string;

  /** Display label for the option */
  label: string;

  /** Optional description for more context */
  description?: string;

  /** Icon component name (from lucide-react) */
  icon?: string;

  /** Whether this option is disabled */
  disabled?: boolean;

  /** Accessibility label override */
  accessibilityLabel?: string;
}

// ============================================================================
// WIZARD STATE MANAGEMENT
// ============================================================================

/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
  questionIndex: number;
  timestamp: Date;
  formDataSnapshot: Partial<TopicBuilderFormData>;
}

/**
 * Current wizard state
 */
export interface WizardState {
  // Form data
  formData: TopicBuilderFormData;

  // Navigation state
  currentQuestionIndex: number;
  questionSequence: string[];
  navigationHistory: NavigationHistoryEntry[];
  direction: NavigationDirection;

  // Validation state
  fieldErrors: Record<string, string>;
  fieldWarnings: Record<string, string[]>;
  touchedFields: Set<string>;
  isValid: boolean;

  // UI state
  isTransitioning: boolean;
  isSubmitting: boolean;
  isLoading: boolean;

  // Configuration
  autoAdvance: boolean;
  skipOptionalQuestions: boolean;

  // Progress tracking
  startTime: Date;
  questionStartTimes: Record<string, Date>;

  // Accessibility
  announcements: string[];
  focusTarget?: string;
}

/**
 * Wizard configuration options
 */
export interface WizardConfig {
  /** Initial form data */
  initialData?: Partial<TopicBuilderFormData>;

  /** Auto-advance after selections by default */
  autoAdvance?: boolean;

  /** Allow skipping optional questions */
  allowSkipping?: boolean;

  /** Show progress bar */
  showProgress?: boolean;

  /** Show time estimates */
  showTimeEstimates?: boolean;

  /** Animation duration in milliseconds */
  animationDuration?: number;

  /** Respect reduced motion preferences */
  respectReducedMotion?: boolean;

  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;

  /** Custom question sequence (overrides default logic) */
  customSequence?: string[];
}

// ============================================================================
// WIZARD ACTIONS
// ============================================================================

/**
 * Actions that can be dispatched to update wizard state
 */
export type WizardAction =
  | { type: "INITIALIZE_WIZARD"; config: WizardConfig }
  | {
      type: "UPDATE_FORM_DATA";
      field: keyof TopicBuilderFormData;
      value: unknown;
    }
  | { type: "GO_TO_NEXT_QUESTION" }
  | { type: "GO_TO_PREVIOUS_QUESTION" }
  | { type: "GO_TO_QUESTION"; questionIndex: number }
  | { type: "SKIP_QUESTION" }
  | { type: "SET_FIELD_ERROR"; field: string; error: string }
  | { type: "CLEAR_FIELD_ERROR"; field: string }
  | { type: "SET_FIELD_WARNING"; field: string; warnings: string[] }
  | { type: "CLEAR_FIELD_WARNING"; field: string }
  | { type: "SET_TRANSITIONING"; isTransitioning: boolean }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "ADD_ANNOUNCEMENT"; announcement: string }
  | { type: "CLEAR_ANNOUNCEMENTS" }
  | { type: "SET_FOCUS_TARGET"; target?: string }
  | { type: "RESET_WIZARD" };

// ============================================================================
// WIZARD CONTEXT
// ============================================================================

/**
 * Context value provided by WizardProvider
 */
export interface WizardContextValue {
  // Current state
  state: WizardState;

  // Form data access
  formData: TopicBuilderFormData;

  // Navigation state
  currentQuestion: QuestionConfig;
  currentQuestionIndex: number;
  totalQuestions: number;
  progress: number;
  canGoNext: boolean;
  canGoBack: boolean;
  canSkip: boolean;

  // Navigation actions
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestion: (index: number) => void;
  skipQuestion: () => void;

  // Form actions
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  resetForm: () => void;

  // Validation
  validateCurrentQuestion: () => boolean;
  validateField: (field: keyof TopicBuilderFormData) => ValidationResult;
  getFieldError: (field: keyof TopicBuilderFormData) => string | undefined;
  getFieldWarnings: (field: keyof TopicBuilderFormData) => string[] | undefined;

  // UI state
  isTransitioning: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  direction: NavigationDirection;

  // Calculated properties
  estimatedTimeRemaining: number;
  completionPercentage: number;
  questionSequence: string[];

  // Accessibility
  announceToScreenReader: (message: string) => void;
  setFocusTarget: (target?: string) => void;
}

// ============================================================================
// QUESTION COMPONENT TYPES
// ============================================================================

/**
 * Base props for all question components
 */
export interface BaseQuestionProps {
  /** Called when user wants to go to next question */
  onNext?: () => void;

  /** Called when user wants to go to previous question */
  onBack?: () => void;

  /** Called when user wants to skip this question */
  onSkip?: () => void;

  /** Whether to auto-advance after selection */
  autoAdvance?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Whether this question is currently disabled */
  disabled?: boolean;
}

/**
 * Props for single-select questions
 */
export interface SingleSelectQuestionProps extends BaseQuestionProps {
  /** Available options */
  options: QuestionOption[];

  /** Currently selected value */
  value?: string;

  /** Called when selection changes */
  onChange: (value: string) => void;

  /** Custom option renderer */
  renderOption?: (option: QuestionOption, selected: boolean) => React.ReactNode;
}

/**
 * Props for multi-select questions
 */
export interface MultiSelectQuestionProps extends BaseQuestionProps {
  /** Available options */
  options: QuestionOption[];

  /** Currently selected values */
  value: string[];

  /** Called when selection changes */
  onChange: (values: string[]) => void;

  /** Minimum number of selections required */
  minSelections?: number;

  /** Maximum number of selections allowed */
  maxSelections?: number;

  /** Custom option renderer */
  renderOption?: (option: QuestionOption, selected: boolean) => React.ReactNode;
}

/**
 * Props for text input questions
 */
export interface TextInputQuestionProps extends BaseQuestionProps {
  /** Current text value */
  value: string;

  /** Called when text changes */
  onChange: (value: string) => void;

  /** Input type (text or textarea) */
  type?: "text" | "textarea";

  /** Placeholder text */
  placeholder?: string;

  /** Maximum character length */
  maxLength?: number;

  /** Number of rows (for textarea) */
  rows?: number;

  /** Whether to focus this input automatically */
  autoFocus?: boolean;

  /** Called when Enter key is pressed */
  onEnterKey?: () => void;
}

/**
 * Props for slider questions
 */
export interface SliderQuestionProps extends BaseQuestionProps {
  /** Current slider value */
  value: number;

  /** Called when slider value changes */
  onChange: (value: number) => void;

  /** Minimum slider value */
  min: number;

  /** Maximum slider value */
  max: number;

  /** Step increment */
  step?: number;

  /** Whether to show the current value */
  showValue?: boolean;

  /** Custom value formatter */
  formatValue?: (value: number) => string;

  /** Slider marks/labels */
  marks?: Array<{ value: number; label: string }>;
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

/**
 * Animation timing configuration
 */
export interface AnimationTiming {
  /** Duration in milliseconds */
  duration: number;

  /** Easing function */
  easing: string | number[];

  /** Delay before animation starts */
  delay?: number;
}

/**
 * Question transition animation settings
 */
export interface QuestionTransitionConfig {
  /** Entry animation */
  enter: {
    /** Initial state */
    from: Record<string, unknown>;

    /** Final state */
    to: Record<string, unknown>;

    /** Animation timing */
    timing: AnimationTiming;
  };

  /** Exit animation */
  exit: {
    /** Initial state */
    from: Record<string, unknown>;

    /** Final state */
    to: Record<string, unknown>;

    /** Animation timing */
    timing: AnimationTiming;
  };
}

/**
 * Animation preferences
 */
export interface AnimationPreferences {
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;

  /** Animation speed multiplier (0.5 = half speed, 2 = double speed) */
  speedMultiplier: number;

  /** Whether to show celebration animations */
  enableCelebrations: boolean;

  /** Whether to use spring animations */
  useSpringAnimations: boolean;
}

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

/**
 * Screen reader announcement configuration
 */
export interface ScreenReaderAnnouncement {
  /** The message to announce */
  message: string;

  /** Priority level for the announcement */
  priority: "polite" | "assertive";

  /** Whether to interrupt current announcements */
  interrupt?: boolean;

  /** Delay before making the announcement */
  delay?: number;
}

/**
 * Focus management configuration
 */
export interface FocusConfig {
  /** Element to focus when question loads */
  onQuestionLoad: "title" | "first-option" | "first-input" | "skip";

  /** Element to focus when validation fails */
  onValidationError: "error-message" | "invalid-field";

  /** Whether to scroll focused element into view */
  scrollIntoView: boolean;

  /** Scroll behavior */
  scrollBehavior: "auto" | "smooth";
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardConfig {
  /** Whether Enter key advances to next question */
  enterToNext: boolean;

  /** Whether Escape key goes to previous question */
  escapeToBack: boolean;

  /** Whether numeric keys (1-9) select options */
  numericSelection: boolean;

  /** Whether Ctrl/Cmd+Enter skips optional questions */
  skipShortcut: boolean;

  /** Custom key bindings */
  customBindings?: Record<string, () => void>;
}

// ============================================================================
// PROGRESS AND METRICS TYPES
// ============================================================================

/**
 * Question completion metrics
 */
export interface QuestionMetrics {
  /** Question ID */
  questionId: string;

  /** Time spent on this question (seconds) */
  timeSpent: number;

  /** Number of attempts/changes made */
  attempts: number;

  /** Whether the question was skipped */
  skipped: boolean;

  /** Final answer value */
  finalAnswer: unknown;

  /** Timestamp when question was completed */
  completedAt: Date;
}

/**
 * Overall wizard metrics
 */
export interface WizardMetrics {
  /** Total time spent in wizard (seconds) */
  totalTime: number;

  /** Time spent per question */
  questionMetrics: QuestionMetrics[];

  /** Number of times user went back */
  backNavigationCount: number;

  /** Number of questions skipped */
  skippedQuestions: number;

  /** Completion percentage when user left */
  exitPoint?: number;

  /** Whether wizard was completed */
  completed: boolean;

  /** Final form data */
  finalData?: TopicBuilderFormData;

  /** Device/browser information */
  userAgent: string;

  /** Whether keyboard navigation was used */
  usedKeyboard: boolean;

  /** Whether screen reader was detected */
  usedScreenReader: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic event handler type
 */
export type EventHandler<T = void> = (event?: T) => void;

/**
 * Async event handler type
 */
export type AsyncEventHandler<T = void> = (event?: T) => Promise<void>;

/**
 * Conditional type for optional properties
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Question component type registry
 */
export type QuestionComponentRegistry = {
  [K in QuestionType]: React.ComponentType<Record<string, unknown>>;
};

/**
 * Form field names from TopicBuilderFormData
 */
export type FormFieldName = keyof TopicBuilderFormData;

/**
 * Question ID type (string literal union of all question IDs)
 */
export type QuestionId =
  | "wizardMode"
  | "industry"
  | "industryOther"
  | "subject"
  | "audience"
  | "contentType"
  | "platform"
  | "purpose"
  | "purposeOther"
  | "tone"
  | "toneOther"
  | "numIdeas"
  | "notes";

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Wizard-specific error types
 */
export class WizardError extends Error {
  constructor(
    message: string,
    public code: string,
    public questionId?: string,
    public fieldName?: string,
  ) {
    super(message);
    this.name = "WizardError";
  }
}

/**
 * Navigation error (e.g., trying to go to invalid question)
 */
export class NavigationError extends WizardError {
  constructor(message: string, questionId?: string) {
    super(message, "NAVIGATION_ERROR", questionId);
    this.name = "NavigationError";
  }
}

/**
 * Validation error for form fields
 */
export class ValidationError extends WizardError {
  constructor(message: string, fieldName: string) {
    super(message, "VALIDATION_ERROR", undefined, fieldName);
    this.name = "ValidationError";
  }
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * Return type for useWizardNavigation hook
 */
export interface WizardNavigationHook {
  currentQuestion: QuestionConfig;
  currentQuestionIndex: number;
  totalQuestions: number;
  canGoNext: boolean;
  canGoBack: boolean;
  canSkip: boolean;
  progress: number;
  goToNext: () => void;
  goToBack: () => void;
  goToQuestion: (index: number) => void;
  skipQuestion: () => void;
}

/**
 * Return type for useWizardValidation hook
 */
export interface WizardValidationHook {
  errors: Record<string, string>;
  warnings: Record<string, string[]>;
  isValid: boolean;
  validateField: (field: FormFieldName, value?: unknown) => ValidationResult;
  validateCurrentQuestion: () => boolean;
  clearFieldError: (field: FormFieldName) => void;
  clearAllErrors: () => void;
}

/**
 * Return type for useWizardProgress hook
 */
export interface WizardProgressHook {
  progress: number;
  completionPercentage: number;
  estimatedTimeRemaining: number;
  currentStepTime: number;
  totalTime: number;
  metrics: WizardMetrics;
}

/**
 * Return type for useWizardAccessibility hook
 */
export interface WizardAccessibilityHook {
  announcements: string[];
  announceToScreenReader: (
    message: string,
    priority?: "polite" | "assertive",
  ) => void;
  focusTarget: string | undefined;
  setFocusTarget: (target?: string) => void;
  prefersReducedMotion: boolean;
  isKeyboardUser: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default animation durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  CELEBRATION: 1000,
} as const;

/**
 * Default timing estimates per question type (in seconds)
 */
export const DEFAULT_QUESTION_TIMES = {
  "single-select": 10,
  "multi-select": 20,
  "text-input": 30,
  slider: 15,
  conditional: 15,
} as const;

/**
 * Keyboard key codes for wizard navigation
 */
export const WIZARD_KEYS = {
  ENTER: "Enter",
  ESCAPE: "Escape",
  SPACE: " ",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  TAB: "Tab",
  DIGIT_1: "1",
  DIGIT_2: "2",
  DIGIT_3: "3",
  DIGIT_4: "4",
  DIGIT_5: "5",
  DIGIT_6: "6",
  DIGIT_7: "7",
  DIGIT_8: "8",
  DIGIT_9: "9",
} as const;

export default {};
