/**
 * Topic Builder Wizard Integration Component
 *
 * Main component that integrates the new TypeForm-style wizard
 * with the existing Topic Builder functionality.
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

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
  const router = useRouter();

  // Default completion handler - redirect to results
  const handleComplete = useCallback(
    (formData: TopicBuilderFormData) => {
      if (onComplete) {
        onComplete(formData);
      } else {
        // Default behavior: navigate to results page with form data
        const params = new URLSearchParams();
        params.set("formData", JSON.stringify(formData));
        router.push(`/topic-builder/results?${params.toString()}`);
      }
    },
    [onComplete, router],
  );

  // Use the wizard navigation hook
  const wizardProps = useWizardNavigation({
    initialFormData: initialData,
    autoAdvance,
    allowBackNavigation,
    onComplete: handleComplete,
  });

  const handleWizardComplete = useCallback(() => {
    // This is called by QuestionWizard, but the actual completion
    // is already handled by the useWizardNavigation hook
    // So we don't need to do anything here
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
      isSubmitting={wizardProps.isSubmitting}
      isLoading={wizardProps.isLoading}
      onComplete={handleWizardComplete}
      className={className}
      showProgress={showProgress}
      allowBackNavigation={wizardProps.allowBackNavigation}
      autoAdvance={wizardProps.autoAdvance}
    />
  );
}
