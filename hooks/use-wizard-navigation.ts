/**
 * Wizard Navigation Hook
 *
 * Manages wizard state, navigation, and validation logic for the
 * TypeForm-style single-question-per-screen flow.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { announceToScreenReader } from "@/lib/typeform-utils";
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

// Default form data with proper typing
const getDefaultFormData = (): TopicBuilderFormData => ({
  wizardMode: "subject-first",
  industry: "technology",
  content_type: "blog-post",
  purpose: [],
  tone: [],
  num_topics: 5,
});

export function useWizardNavigation({
  initialFormData,
  autoAdvance = false,
  allowBackNavigation = true,
  onComplete,
}: UseWizardNavigationProps): UseWizardNavigationReturn {
  // Form data state
  const [formData, setFormData] = useState<TopicBuilderFormData>(() => ({
    ...getDefaultFormData(),
    ...initialFormData,
  }));

  // Navigation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Update form data
  const updateFormData = useCallback(
    (
      field: keyof TopicBuilderFormData,
      value: TopicBuilderFormData[keyof TopicBuilderFormData],
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear field error when user updates
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    },
    [],
  );

  // Validation logic
  const validateCurrentQuestion = useCallback((): ValidationResult => {
    if (!currentQuestion) {
      return { isValid: false, errors: ["Question not found"] };
    }

    // Special case: review step is always valid since it's just displaying information
    if (currentQuestion.id === "review") {
      return { isValid: true, errors: [] };
    }

    const field = currentQuestion.id as keyof TopicBuilderFormData;
    const value = formData[field];

    // Required field validation
    if (currentQuestion.required) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        const error = "This field is required";
        setErrors((prev) => ({ ...prev, [field]: error }));
        return { isValid: false, errors: [error] };
      }
    }

    // Specific field validations
    switch (field) {
      case "subject":
        if (typeof value === "string" && value.trim().length < 3) {
          const error = "Please enter at least 3 characters";
          setErrors((prev) => ({ ...prev, [field]: error }));
          return { isValid: false, errors: [error] };
        }
        break;

      case "purpose":
        if (Array.isArray(value) && value.length === 0) {
          const error = "Please select at least one purpose";
          setErrors((prev) => ({ ...prev, [field]: error }));
          return { isValid: false, errors: [error] };
        }
        break;

      case "tone":
        if (Array.isArray(value) && value.length === 0) {
          const error = "Please select at least one tone";
          setErrors((prev) => ({ ...prev, [field]: error }));
          return { isValid: false, errors: [error] };
        }
        break;

      case "num_topics":
        if (typeof value === "number" && (value < 1 || value > 20)) {
          const error = "Number of topics must be between 1 and 20";
          setErrors((prev) => ({ ...prev, [field]: error }));
          return { isValid: false, errors: [error] };
        }
        break;
    }

    // Clear any existing error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });

    return { isValid: true, errors: [] };
  }, [currentQuestion, formData]);

  // Get error for a specific question
  const getQuestionError = useCallback(
    (questionId: string): string | undefined => {
      return errors[questionId];
    },
    [errors],
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
