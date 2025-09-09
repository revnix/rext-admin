/**
 * Main TypeForm-style Wizard Container
 *
 * Manages the single-question-per-screen flow with smooth transitions,
 * keyboard navigation, and accessibility features.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  getMotionVariants,
  questionTransition,
  questionTransitionVariants,
  useReducedMotion,
} from "@/lib/animations";
import { announceToScreenReader } from "@/lib/typeform-utils";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { NavigationDirection, QuestionConfig } from "@/types/wizard";
import { QuestionStep } from "./QuestionStep";
import { WizardNavigation } from "./WizardNavigation";
import { WizardProgress } from "./WizardProgress";

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

  /** Navigation handlers */
  onNext: () => boolean;
  onPrevious: () => boolean;
  onGoToQuestion: (index: number) => boolean;

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

export function QuestionWizard({
  questions,
  currentQuestionIndex,
  formData,
  updateFormData,
  onNext,
  onPrevious,
  onGoToQuestion,
  getQuestionError,
  isSubmitting = false,
  isLoading = false,
  onComplete: _onComplete,
  className,
  showProgress = true,
  allowBackNavigation = true,
  autoAdvance = false,
}: QuestionWizardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const motionVariants = getMotionVariants(
    questionTransitionVariants,
    prefersReducedMotion,
  );

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Memoize validation result to prevent infinite loops
  const currentQuestionValidation = useMemo(() => {
    // Don't call validateCurrentQuestion here as it can cause loops
    // Instead, do a simple check based on current question and form data
    if (!currentQuestion)
      return { isValid: false, errors: ["No question found"] };

    // Special case: review step is always valid since it's just displaying information
    if (currentQuestion.id === "review") {
      return { isValid: true, errors: [] };
    }

    const field = currentQuestion.id as keyof TopicBuilderFormData;
    const value = formData[field];

    if (currentQuestion.required) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return { isValid: false, errors: ["This field is required"] };
      }
    }

    return { isValid: true, errors: [] };
  }, [currentQuestion, formData]);

  // Determine navigation direction for animations
  const [direction, setDirection] = useState<NavigationDirection>("forward");

  // Focus management
  const focusQuestion = useCallback(() => {
    if (containerRef.current) {
      const questionElement = containerRef.current.querySelector("fieldset");
      if (questionElement instanceof HTMLElement) {
        questionElement.focus();
      }
    }
  }, []);

  // Announce question changes to screen readers
  useEffect(() => {
    if (currentQuestion) {
      const announcement = `Question ${currentQuestionIndex + 1} of ${questions.length}: ${currentQuestion.title}`;
      announceToScreenReader(announcement);
    }
  }, [currentQuestionIndex, currentQuestion, questions.length]);

  // Auto-focus on question change
  useEffect(() => {
    const timer = setTimeout(() => {
      focusQuestion();
    }, 200); // Wait for transition to start

    return () => clearTimeout(timer);
  }, [focusQuestion]);

  // Keyboard navigation
  useHotkeys(
    "enter",
    () => {
      if (!isSubmitting && !isLoading) {
        setDirection("forward");
        onNext();
      }
    },
    { preventDefault: true, enableOnFormTags: true },
  );

  useHotkeys(
    "escape",
    () => {
      if (!isFirstQuestion && allowBackNavigation && !isSubmitting) {
        setDirection("backward");
        onPrevious();
      }
    },
    { preventDefault: true, enableOnFormTags: true },
  );

  // Navigation handlers with direction tracking
  const handleNext = useCallback(() => {
    setDirection("forward");
    return onNext();
  }, [onNext]);

  const handlePrevious = useCallback(() => {
    setDirection("backward");
    return onPrevious();
  }, [onPrevious]);

  const handleGoToQuestion = useCallback(
    (index: number) => {
      setDirection(index > currentQuestionIndex ? "forward" : "backward");
      return onGoToQuestion(index);
    },
    [currentQuestionIndex, onGoToQuestion],
  );

  // Handle auto-advance for single-select questions
  const handleQuestionChange = useCallback(
    (
      field: keyof TopicBuilderFormData,
      value: TopicBuilderFormData[keyof TopicBuilderFormData],
    ) => {
      updateFormData(field, value);

      // Auto-advance if enabled and question supports it
      if (
        autoAdvance &&
        currentQuestion?.autoAdvance &&
        currentQuestion.type === "single-select"
      ) {
        setTimeout(() => {
          handleNext();
        }, 300); // Small delay for visual feedback
      }
    },
    [updateFormData, autoAdvance, currentQuestion, handleNext],
  );

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">
            No questions available
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
      </div>
    );
  }

  const progress = {
    current: currentQuestionIndex + 1,
    total: questions.length,
    percentage: ((currentQuestionIndex + 1) / questions.length) * 100,
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col min-h-screen bg-background",
        "focus:outline-none",
        className,
      )}
      role="application"
      aria-label="Topic Builder Wizard"
    >
      {/* Progress Indicator */}
      {showProgress && (
        <WizardProgress
          current={progress.current}
          total={progress.total}
          percentage={progress.percentage}
          onStepClick={handleGoToQuestion}
          questions={questions}
        />
      )}

      {/* Question Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestionIndex}
              custom={direction}
              variants={motionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={questionTransition}
              className="w-full"
            >
              <QuestionStep
                question={currentQuestion}
                formData={formData}
                updateFormData={handleQuestionChange}
                error={getQuestionError(currentQuestion.id)}
                progress={progress}
                isLoading={isLoading}
                onGoToQuestion={handleGoToQuestion}
                getQuestionError={getQuestionError}
                questions={questions}
                navigationControls={
                  <WizardNavigation
                    canGoBack={!isFirstQuestion && allowBackNavigation}
                    canGoForward={currentQuestionValidation.isValid}
                    isFirstQuestion={isFirstQuestion}
                    isLastQuestion={isLastQuestion}
                    isSubmitting={isSubmitting}
                    isLoading={isLoading}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    nextLabel={isLastQuestion ? "Generate Ideas" : "Next"}
                    className="mt-8 p-0 bg-transparent border-0"
                  />
                }
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Screen Reader Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="wizard-announcements"
      />
    </div>
  );
}
