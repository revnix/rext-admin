/**
 * Topic Builder Component Types
 * Consolidated interfaces and types for all topic builder components
 */

import type { UseFormReturn } from "react-hook-form";
import type { TopicBuilderFormData } from "./topic-builder";
import type {
  NavigationDirection,
  QuestionConfig,
  WizardProgress,
} from "./wizard";

// Main Topic Builder Wizard
export interface TopicBuilderWizardProps {
  /** Initial form data */
  initialData?: Partial<TopicBuilderFormData>;

  /** Custom completion handler */
  onComplete?: (formData: TopicBuilderFormData) => void;

  /** Auto-advance after selections */
  autoAdvance?: boolean;

  /** Show progress indicator */
  showProgress?: boolean;

  /** Allow back navigation */
  allowBackNavigation?: boolean;

  /** Custom class name */
  className?: string;

  /** Shared topic builder hook instance (optional) */
  topicBuilderHook?: {
    generateTopics: (overrideFormData?: TopicBuilderFormData) => Promise<void>;
    isGenerating: boolean;
    updateFormData: (
      field: keyof TopicBuilderFormData,
      value: string | string[] | number | boolean,
    ) => void;
    formData: TopicBuilderFormData;
  };
}

// Question Wizard
export interface QuestionWizardProps {
  /** Array of question configurations */
  questions: QuestionConfig[];

  /** Current question index */
  currentQuestionIndex: number;

  /** Form data */
  formData: TopicBuilderFormData;

  /** Update form data function */
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;

  /** React Hook Form instance */
  form: UseFormReturn<TopicBuilderFormData>;

  /** Navigation handlers */
  onNext: () => boolean;
  onPrevious: () => boolean;
  onGoToQuestion: (index: number) => boolean;

  /** Enhanced navigation handlers */
  enterEditMode?: (questionIndex: number) => void;
  isInEditMode?: boolean;
  saveAndReturnToReview?: () => boolean;

  /** Validation */
  getQuestionError: (questionId: string) => string | undefined;

  /** Loading states */
  isSubmitting?: boolean;
  isLoading?: boolean;

  /** Completion handler */
  onComplete: () => void;

  /** Optional customization */
  className?: string;
  showProgress?: boolean;
  allowBackNavigation?: boolean;
  autoAdvance?: boolean;
}

// Wizard Container
export interface WizardContainerProps {
  questions: QuestionConfig[];
  currentQuestionIndex: number;
  formData: TopicBuilderFormData;
  form: UseFormReturn<TopicBuilderFormData>;
  onNext: () => boolean;
  onPrevious: () => boolean;
  onGoToQuestion: (index: number) => boolean;
  autoAdvance?: boolean;
  allowBackNavigation?: boolean;
  className?: string;
  children: (props: {
    currentQuestion: QuestionConfig;
    direction: NavigationDirection;
    isFirstQuestion: boolean;
    isLastQuestion: boolean;
    currentQuestionValidation: { isValid: boolean; errors: string[] };
    progress: { current: number; total: number; percentage: number };
    handleNext: () => boolean;
    handlePrevious: () => boolean;
    handleGoToQuestion: (index: number) => boolean;
    handleQuestionChange: (
      field: keyof TopicBuilderFormData,
      value: TopicBuilderFormData[keyof TopicBuilderFormData],
    ) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
  }) => React.ReactNode;
}

// Question Renderer
export interface QuestionRendererProps {
  questions: QuestionConfig[];
  currentQuestionIndex: number;
  currentQuestion: QuestionConfig;
  direction: NavigationDirection;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  form: UseFormReturn<TopicBuilderFormData>;
  getQuestionError: (questionId: string) => string | undefined;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSubmitting?: boolean;
  isLoading?: boolean;
  allowBackNavigation?: boolean;
  showProgress?: boolean;
  autoAdvance?: boolean;
  currentQuestionValidation: { isValid: boolean; errors: string[] };
  progress: { current: number; total: number; percentage: number };
  handleNext: () => boolean;
  handlePrevious: () => boolean;
  handleGoToQuestion: (index: number) => boolean;
  enterEditMode?: (questionIndex: number) => void;
  isInEditMode?: boolean;
  saveAndReturnToReview?: () => boolean;
}

// Question Step
export interface QuestionStepProps {
  /** Question configuration */
  question: QuestionConfig;

  /** Current form data */
  formData: TopicBuilderFormData;

  /** Update form data handler */
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;

  /** React Hook Form instance */
  form: UseFormReturn<TopicBuilderFormData>;

  /** Validation error for this question */
  error?: string;

  /** Progress information */
  progress?: WizardProgress;

  /** Loading state */
  isLoading?: boolean;

  /** Navigation controls component */
  navigationControls?: React.ReactNode;

  /** Optional styling */
  className?: string;

  /** Question navigation callbacks */
  onGoToQuestion?: (index: number) => boolean;
  enterEditMode?: (questionIndex: number) => void;
  getQuestionError?: (questionId: string) => string | undefined;
  questions?: QuestionConfig[];
  onStepAdvance?: () => void;
}

// Wizard Progress
export interface WizardProgressProps {
  /** Current step number (1-based) */
  current: number;

  /** Total number of steps */
  total: number;

  /** Progress percentage (0-100) */
  percentage: number;

  /** Step click handler */
  onStepClick?: (index: number) => void;

  /** Questions array for step information */
  questions: QuestionConfig[];

  /** Optional styling */
  className?: string;
}

// Wizard Navigation
export interface WizardNavigationProps {
  /** Whether the back button should be enabled */
  canGoBack: boolean;

  /** Whether the next button should be enabled */
  canGoForward: boolean;

  /** Whether this is the first question */
  isFirstQuestion: boolean;

  /** Whether this is the last question */
  isLastQuestion: boolean;

  /** Whether form is currently submitting */
  isSubmitting: boolean;

  /** Whether content is loading */
  isLoading: boolean;

  /** Next button handler */
  onNext: () => void;

  /** Previous button handler */
  onPrevious: () => void;

  /** Custom next button label */
  nextLabel?: string;

  /** Custom previous button label */
  previousLabel?: string;

  /** Optional styling */
  className?: string;

  /** Edit mode state */
  isInEditMode?: boolean;

  /** Save and return handler for edit mode */
  onSaveAndReturn?: () => boolean;
}

// Question-specific prop interfaces
export interface BaseQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  form: UseFormReturn<TopicBuilderFormData>;
  error?: string;
  isLoading?: boolean;
}

export interface ContentTypeQuestionProps extends BaseQuestionProps {}
export interface SubjectQuestionProps extends BaseQuestionProps {}
export interface WizardModeQuestionProps extends BaseQuestionProps {}
export interface AudienceQuestionProps extends BaseQuestionProps {
  onStepAdvance?: () => void;
}
export interface PlatformQuestionProps extends BaseQuestionProps {}
export interface NotesQuestionProps extends BaseQuestionProps {}
export interface IndustryQuestionProps extends BaseQuestionProps {}
export interface ToneQuestionProps extends BaseQuestionProps {}
export interface NumTopicsQuestionProps extends BaseQuestionProps {}
export interface PurposeQuestionProps extends BaseQuestionProps {}

export interface ReviewQuestionProps extends BaseQuestionProps {
  onGoToQuestion?: (index: number) => boolean;
  enterEditMode?: (questionIndex: number) => void;
  getQuestionError?: (questionId: string) => string | undefined;
  questions?: QuestionConfig[];
}

export interface ReviewCardProps {
  title: string;
  value: React.ReactNode;
  onEdit?: () => void;
  error?: string;
}
