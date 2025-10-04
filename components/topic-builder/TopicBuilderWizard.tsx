/**
 * Topic Builder Wizard Integration Component
 *
 * Main component that integrates the new TypeForm-style wizard
 * with the existing Topic Builder functionality.
 */

"use client";

import { memo, useCallback } from "react";
import { useTopicBuilder } from "@/hooks/use-topic-builder";
import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { log } from "@/lib/logger";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import { QuestionWizard } from "./wizard/QuestionWizard";

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

export const TopicBuilderWizard = memo(function TopicBuilderWizard({
  initialData,
  onComplete,
  autoAdvance = false,
  showProgress = true,
  allowBackNavigation = true,
  className,
  topicBuilderHook,
}: TopicBuilderWizardProps) {
  // Use either the passed hook or create a new instance
  const internalHook = useTopicBuilder();
  const { generateTopics, isGenerating } = topicBuilderHook || internalHook;

  // Generate topics with form data directly
  const handleGenerateTopics = useCallback(
    async (formData: TopicBuilderFormData): Promise<void> => {
      try {
        log.info("🚀 Starting topic generation with form data:", formData);

        // Pass form data directly to generateTopics to avoid state sync issues
        await generateTopics(formData);
      } catch (error) {
        log.error("Error in handleGenerateTopics:", error);
      }
    },
    [generateTopics],
  );

  // Handle wizard completion
  const handleComplete = useCallback(
    async (formData: TopicBuilderFormData) => {
      if (onComplete) {
        onComplete(formData);
      } else {
        await handleGenerateTopics(formData);
      }
    },
    [onComplete, handleGenerateTopics],
  );

  // Use the wizard navigation hook
  const wizardProps = useWizardNavigation({
    initialFormData: initialData,
    autoAdvance,
    allowBackNavigation,
    onComplete: handleComplete,
  });

  const handleWizardComplete = useCallback(() => {
    // Delegated to wizard navigation hook's onComplete
  }, []);

  return (
    <QuestionWizard
      questions={wizardProps.questions}
      currentQuestionIndex={wizardProps.currentQuestionIndex}
      formData={wizardProps.formData}
      updateFormData={wizardProps.updateFormData}
      form={wizardProps.form}
      onNext={wizardProps.onNext}
      onPrevious={wizardProps.onPrevious}
      onGoToQuestion={wizardProps.onGoToQuestion}
      enterEditMode={wizardProps.enterEditMode}
      isInEditMode={wizardProps.isInEditMode}
      saveAndReturnToReview={wizardProps.saveAndReturnToReview}
      getQuestionError={wizardProps.getQuestionError}
      isSubmitting={isGenerating || wizardProps.isSubmitting}
      isLoading={wizardProps.isLoading}
      onComplete={handleWizardComplete}
      className={className}
      showProgress={showProgress}
      allowBackNavigation={wizardProps.allowBackNavigation}
      autoAdvance={wizardProps.autoAdvance}
    />
  );
});
