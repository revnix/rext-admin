/**
 * Topic Builder Wizard Integration Component
 *
 * Main component that integrates the new TypeForm-style wizard
 * with the existing Topic Builder functionality.
 */

"use client";

import { useCallback } from "react";
import { useTopicBuilder } from "@/hooks/use-topic-builder";
import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
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
}

export function TopicBuilderWizard({
  initialData,
  onComplete,
  autoAdvance = false,
  showProgress = true,
  allowBackNavigation = true,
  className,
}: TopicBuilderWizardProps) {
  // Use the main topic builder hook for generation logic
  const { generateTopics, isGenerating, updateFormData } = useTopicBuilder();

  // Sync wizard form data with main hook and trigger generation
  const handleGenerateTopics = useCallback(
    async (formData: TopicBuilderFormData): Promise<void> => {
      console.log("🚀 handleGenerateTopics called with formData:", formData);

      // Sync the wizard's form data with the main hook
      Object.entries(formData).forEach(([key, value]) => {
        updateFormData(key as keyof TopicBuilderFormData, value);
      });

      // Small delay to ensure state is updated
      setTimeout(async () => {
        await generateTopics();
      }, 100);
    },
    [generateTopics, updateFormData],
  );

  // Modified completion handler - generate topics instead of redirecting
  const handleComplete = useCallback(
    async (formData: TopicBuilderFormData) => {
      console.log("🎯 handleComplete called, onComplete prop:", !!onComplete);
      if (onComplete) {
        console.log("⚠️ Using external onComplete handler");
        onComplete(formData);
      } else {
        console.log("✅ Using internal generateTopics");
        // Generate topics using the main hook
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
    // This is called by QuestionWizard when the user clicks the final "Generate Ideas" button
    // The actual completion is handled by the useWizardNavigation hook's onComplete
    console.log(
      "🎯 handleWizardComplete called - delegating to wizard navigation",
    );
  }, []);

  return (
    <QuestionWizard
      questions={wizardProps.questions}
      currentQuestionIndex={wizardProps.currentQuestionIndex}
      formData={wizardProps.formData}
      updateFormData={wizardProps.updateFormData}
      onNext={wizardProps.onNext}
      onPrevious={wizardProps.onPrevious}
      onGoToQuestion={wizardProps.onGoToQuestion}
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
}
