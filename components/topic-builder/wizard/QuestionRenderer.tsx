"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback } from "react";
import {
  getMotionVariants,
  questionTransition,
  questionTransitionVariants,
  useReducedMotion,
} from "@/lib/animations";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { QuestionRendererProps } from "@/types/topic-builder-components";
import { QuestionStep } from "./QuestionStep";
import { WizardNavigation } from "./WizardNavigation";
import { WizardProgress } from "./WizardProgress";

export const QuestionRenderer = memo(function QuestionRenderer({
  questions,
  currentQuestionIndex,
  currentQuestion,
  direction,
  formData,
  updateFormData,
  form,
  getQuestionError,
  isFirstQuestion,
  isLastQuestion,
  isSubmitting = false,
  isLoading = false,
  allowBackNavigation = true,
  showProgress = true,
  autoAdvance = false,
  currentQuestionValidation,
  progress,
  handleNext,
  handlePrevious,
  handleGoToQuestion,
  enterEditMode,
  isInEditMode = false,
  saveAndReturnToReview,
}: QuestionRendererProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionVariants = getMotionVariants(
    questionTransitionVariants,
    prefersReducedMotion,
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

  return (
    <>
      {/* Progress Indicator moved to top with enhanced visibility */}
      {showProgress && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="mb-2 text-sm font-medium text-foreground">
              Question {progress.current} of {progress.total}
            </div>
            <WizardProgress
              current={progress.current}
              total={progress.total}
              percentage={progress.percentage}
              onStepClick={handleGoToQuestion}
              questions={questions}
              compact={true}
            />
          </div>
        </div>
      )}

      {/* Question Container */}
      <div className="flex-1 flex items-start justify-center pt-24 px-4 pb-4">
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
                form={form}
                error={getQuestionError(currentQuestion.id)}
                progress={progress}
                isLoading={isLoading}
                onGoToQuestion={handleGoToQuestion}
                enterEditMode={enterEditMode}
                getQuestionError={getQuestionError}
                questions={questions}
                onStepAdvance={handleNext}
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
                    nextLabel={isLastQuestion ? "Generate Topics" : "Next"}
                    className="mt-8 p-0 bg-transparent border-0"
                    isInEditMode={isInEditMode}
                    onSaveAndReturn={saveAndReturnToReview}
                  />
                }
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
});
