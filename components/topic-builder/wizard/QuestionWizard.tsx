/**
 * Main TypeForm-style Wizard Container
 *
 * Manages the single-question-per-screen flow with smooth transitions,
 * keyboard navigation, and accessibility features.
 */

"use client";

import { memo } from "react";
import type { QuestionWizardProps } from "@/types/topic-builder-components";
import { QuestionRenderer } from "./QuestionRenderer";
import { WizardContainer } from "./WizardContainer";

export const QuestionWizard = memo(function QuestionWizard({
  questions,
  currentQuestionIndex,
  formData,
  updateFormData,
  form,
  onNext,
  onPrevious,
  onGoToQuestion,
  enterEditMode,
  isInEditMode = false,
  saveAndReturnToReview,
  getQuestionError,
  isSubmitting = false,
  isLoading = false,
  onComplete: _onComplete,
  className,
  showProgress = true,
  allowBackNavigation = true,
  autoAdvance = false,
}: QuestionWizardProps) {
  return (
    <WizardContainer
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      formData={formData}
      form={form}
      onNext={onNext}
      onPrevious={onPrevious}
      onGoToQuestion={onGoToQuestion}
      autoAdvance={autoAdvance}
      allowBackNavigation={allowBackNavigation}
      className={className}
    >
      {({
        currentQuestion,
        direction,
        isFirstQuestion,
        isLastQuestion,
        currentQuestionValidation,
        progress,
        handleNext,
        handlePrevious,
        handleGoToQuestion,
      }) => (
        <QuestionRenderer
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          currentQuestion={currentQuestion}
          direction={direction}
          formData={formData}
          updateFormData={updateFormData}
          form={form}
          getQuestionError={getQuestionError}
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          isLoading={isLoading}
          allowBackNavigation={allowBackNavigation}
          showProgress={showProgress}
          autoAdvance={autoAdvance}
          currentQuestionValidation={currentQuestionValidation}
          progress={progress}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          handleGoToQuestion={handleGoToQuestion}
          enterEditMode={enterEditMode}
          isInEditMode={isInEditMode}
          saveAndReturnToReview={saveAndReturnToReview}
        />
      )}
    </WizardContainer>
  );
});
