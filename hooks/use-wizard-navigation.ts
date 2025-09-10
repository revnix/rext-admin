/**
 * Wizard Navigation Hook
 *
 * Manages wizard state, navigation, and validation logic for the
 * TypeForm-style single-question-per-screen flow.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { announceToScreenReader } from "@/lib/typeform-utils";
import {
  STEP_VALIDATION_SCHEMAS,
  TopicBuilderFormDataSchema,
} from "@/types/schemas";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type {
  QuestionConfig,
  ValidationResult,
  WizardProgress,
} from "@/types/wizard";

export interface UseWizardNavigationProps {
  /** Initial form data */
  initialFormData?: Partial<TopicBuilderFormData>;

  /** Auto-advance after selections */
  autoAdvance?: boolean;

  /** Allow back navigation */
  allowBackNavigation?: boolean;

  /** Completion handler */
  onComplete: (formData: TopicBuilderFormData) => void;
}

export interface UseWizardNavigationReturn {
  // Form state
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;

  // React Hook Form integration
  form: UseFormReturn<TopicBuilderFormData>;

  // Navigation state
  currentQuestionIndex: number;
  questions: QuestionConfig[];
  currentQuestion: QuestionConfig;
  progress: WizardProgress;

  // Navigation actions
  onNext: () => boolean;
  onPrevious: () => boolean;
  onGoToQuestion: (index: number) => boolean;

  // Validation
  validateCurrentQuestion: () => ValidationResult;
  getQuestionError: (questionId: string) => string | undefined;

  // Loading states
  isSubmitting: boolean;
  isLoading: boolean;

  // Settings
  autoAdvance: boolean;
  allowBackNavigation: boolean;
}

// Default form data with smart defaults per requirements
const getDefaultFormData = (): TopicBuilderFormData => ({
  wizardMode: "industry-first", // Default: "I want to explore my industry"
  industry: "business", // Smart default for broad applicability
  content_type: "blog-post", // Most common content type
  purpose: ["educate-inform"], // Smart default: "Who are you creating this for?" equivalent
  tone: ["professional-formal"], // Smart default for professional content
  num_topics: 5,
});

export function useWizardNavigation({
  initialFormData,
  autoAdvance = false,
  allowBackNavigation = true,
  onComplete,
}: UseWizardNavigationProps): UseWizardNavigationReturn {
  // Initialize React Hook Form with Zod validation
  const form = useForm<TopicBuilderFormData>({
    resolver: zodResolver(TopicBuilderFormDataSchema) as any,
    defaultValues: {
      ...getDefaultFormData(),
      ...initialFormData,
    },
    mode: "onChange", // Real-time validation
  });

  // Watch form data for reactivity
  const formData = form.watch();

  // Navigation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, _setIsLoading] = useState(false);

  // Define question sequence based on wizard mode
  const questions = useMemo((): QuestionConfig[] => {
    const baseQuestions: QuestionConfig[] = [
      {
        id: "wizardMode",
        type: "wizard-mode",
        title: "How do you want to brainstorm?",
        description:
          "Choose your preferred approach to generate content topics.",
        required: true,
      },
    ];

    // Subject-first flow
    if (formData.wizardMode === "subject-first") {
      baseQuestions.push({
        id: "subject",
        type: "text-input",
        title: "What topic do you want to create content about?",
        description:
          "Be as specific as possible. This will help us generate more targeted topics.",
        required: true,
        helpText:
          "Example: 'Digital marketing strategies for small restaurants'",
      });
    }

    // Common questions for both flows
    baseQuestions.push(
      {
        id: "industry",
        type: "single-select",
        title: "What industry are you in?",
        description:
          "This helps us tailor content topics to your specific market.",
        required: true,
      },
      {
        id: "content_type",
        type: "single-select",
        title: "What type of content are you creating?",
        description: "Different formats work better for different purposes.",
        required: true,
      },
    );

    // Platform question (conditional on content type)
    if (formData.content_type === "social-media") {
      baseQuestions.push({
        id: "platform",
        type: "single-select",
        title: "Which platform will you publish on?",
        description:
          "Each platform has its own style and audience preferences.",
        required: true,
      });
    }

    // Remaining questions
    baseQuestions.push(
      {
        id: "audience",
        type: "chip-input",
        title: "Who is your target audience?",
        description: "Describe the people you want to reach with your content.",
        required: false,
        helpText:
          "Add up to 5 audience segments (e.g., 'small business owners', 'marketing professionals')",
      },
      {
        id: "purpose",
        type: "multi-select",
        title: "What's your main goal?",
        description: "What do you want to achieve with your content?",
        required: true,
      },
      {
        id: "tone",
        type: "multi-select",
        title: "What tone should your content have?",
        description: "Choose the voice and style that matches your brand.",
        required: true,
      },
      {
        id: "num_topics",
        type: "number-input",
        title: "How many topics do you want?",
        description:
          "We'll generate creative, actionable topics for you to choose from.",
        required: true,
      },
      {
        id: "notes",
        type: "text-input",
        title: "Any special requirements?",
        description: "Optional: Add any specific instructions or preferences.",
        required: false,
        helpText:
          "e.g., 'Include data and statistics', 'Make it beginner-friendly', 'Focus on current trends'",
      },
      {
        id: "review",
        type: "review",
        title: "Ready to generate topics!",
        description:
          "Review your selections below and click Generate to create your topics.",
        required: true,
      },
    );

    return baseQuestions;
  }, [formData.wizardMode, formData.content_type]);

  // Current question
  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Progress calculation
  const progress: WizardProgress = useMemo(
    () => ({
      current: currentQuestionIndex + 1,
      total: questions.length,
      percentage: ((currentQuestionIndex + 1) / questions.length) * 100,
    }),
    [currentQuestionIndex, questions.length],
  );

  // Update form data using React Hook Form
  const updateFormData = useCallback(
    (
      field: keyof TopicBuilderFormData,
      value: TopicBuilderFormData[keyof TopicBuilderFormData],
    ) => {
      form.setValue(field, value, {
        shouldValidate: true, // Trigger validation immediately
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [form],
  );

  // Validation logic using React Hook Form and step-level schemas
  const validateCurrentQuestion = useCallback((): ValidationResult => {
    if (!currentQuestion) {
      return { isValid: false, errors: ["Question not found"] };
    }

    // Special case: review step is always valid since it's just displaying information
    if (currentQuestion.id === "review") {
      return { isValid: true, errors: [] };
    }

    // Get the appropriate step validation schema
    const stepSchema =
      STEP_VALIDATION_SCHEMAS[
        currentQuestion.id as keyof typeof STEP_VALIDATION_SCHEMAS
      ];
    if (!stepSchema) {
      return { isValid: true, errors: [] }; // No schema defined, assume valid
    }

    // Validate using Zod schema
    const result = stepSchema.safeParse(formData);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => {
        const fieldName = issue.path.join(".");
        return `${fieldName}: ${issue.message}`;
      });
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }, [currentQuestion, formData]);

  // Get error for a specific question using React Hook Form
  const getQuestionError = useCallback(
    (questionId: string): string | undefined => {
      const fieldState = form.getFieldState(
        questionId as keyof TopicBuilderFormData,
      );
      return fieldState.error?.message;
    },
    [form],
  );

  // Navigation: Next
  const onNext = useCallback((): boolean => {
    console.log(
      "🔄 onNext called, currentQuestionIndex:",
      currentQuestionIndex,
      "questions.length:",
      questions.length,
    );
    const validation = validateCurrentQuestion();
    if (!validation.isValid) {
      console.log("❌ Validation failed:", validation.errors);
      return false;
    }

    if (currentQuestionIndex >= questions.length - 1) {
      // Complete the wizard
      console.log("🏁 Last question reached, completing wizard");
      setIsSubmitting(true);
      onComplete(formData);
      return true;
    } else {
      // Go to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      return true;
    }
  }, [
    currentQuestionIndex,
    questions.length,
    validateCurrentQuestion,
    onComplete,
    formData,
  ]);

  // Navigation: Previous
  const onPrevious = useCallback((): boolean => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      return true;
    }
    return false;
  }, [currentQuestionIndex]);

  // Navigation: Go to specific question
  const onGoToQuestion = useCallback(
    (index: number): boolean => {
      if (index >= 0 && index < questions.length) {
        setCurrentQuestionIndex(index);
        return true;
      }
      return false;
    },
    [questions.length],
  );

  // Announce question changes for accessibility
  useEffect(() => {
    if (currentQuestion) {
      const announcement = `Question ${progress.current} of ${progress.total}: ${currentQuestion.title}`;
      announceToScreenReader(announcement);
    }
  }, [currentQuestion, progress.current, progress.total]);

  return {
    // Form state
    formData,
    updateFormData,

    // React Hook Form integration
    form,

    // Navigation state
    currentQuestionIndex,
    questions,
    currentQuestion,
    progress,

    // Navigation actions
    onNext,
    onPrevious,
    onGoToQuestion,

    // Validation
    validateCurrentQuestion,
    getQuestionError,

    // Loading states
    isSubmitting,
    isLoading,

    // Settings
    autoAdvance,
    allowBackNavigation,
  };
}
