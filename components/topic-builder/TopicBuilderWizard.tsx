/**
 * Topic Builder Wizard Integration Component
 *
 * Main component that integrates the new TypeForm-style wizard
 * with the existing Topic Builder functionality.
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { classifyError, isOnline } from "@/lib/error-utils";
import { prepareFormDataForAPI } from "@/lib/topic-builder-utils";
import type { BackendError, BackendErrorType } from "@/types/backend";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";
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

  // Generation state
  const [_generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [_generationError, setGenerationError] = useState<BackendError | null>(
    null,
  );
  const [connectionStatus, _setConnectionStatus] = useState(isOnline());

  // Topic generation function (similar to useTopicBuilder)
  const generateTopics = useCallback(
    async (formData: TopicBuilderFormData): Promise<void> => {
      console.log("🚀 generateTopics called with formData:", formData);
      // Check online status first
      if (!connectionStatus) {
        const offlineError = classifyError(new Error("No internet connection"));
        setGenerationError(offlineError);
        toast.error("Generation failed", {
          description: offlineError.message,
        });
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        const apiData = prepareFormDataForAPI(formData);

        console.log("Form data being sent:", apiData);

        const response = await fetch("/api/generate-topics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
          body: JSON.stringify({ formData: apiData }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (errorData.error_code && errorData.details) {
            let actualErrorType = errorData.error_code;
            let context = {
              responseStatus: response.status,
              apiError: errorData,
            };

            try {
              const detailsObj = JSON.parse(errorData.details);
              if (
                detailsObj &&
                typeof detailsObj === "object" &&
                detailsObj.type
              ) {
                actualErrorType = detailsObj.type;
                if (detailsObj.context) {
                  context = { ...context, ...detailsObj.context };
                }
              }
            } catch {
              // Not JSON, use as-is
            }

            const backendError: BackendError = {
              type: actualErrorType as BackendErrorType,
              message: errorData.error,
              technicalMessage: errorData.details,
              statusCode: response.status,
              severity:
                response.status >= 500
                  ? "high"
                  : response.status >= 400
                    ? "medium"
                    : "low",
              recoveryActions: ["retry", "contact_support"],
              isRetryable: response.status >= 500,
              requestId: errorData.request_id,
              timestamp: new Date().toISOString(),
              context: context,
            };
            throw backendError;
          } else {
            const errorMessage =
              errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(
              `Backend API error: ${response.status} ${errorMessage}`,
            );
          }
        }

        const result = await response.json();

        if (result.topics && Array.isArray(result.topics)) {
          const topicsWithIds = result.topics.map(
            (topic: unknown, index: number) => ({
              ...(topic as GeneratedTopic),
              id:
                (topic as GeneratedTopic).id || `topic_${Date.now()}_${index}`,
            }),
          );

          setGeneratedTopics(topicsWithIds);
          setGenerationError(null);

          // Navigate to results page with the generated topics
          const params = new URLSearchParams();
          params.set("topics", JSON.stringify(topicsWithIds));
          router.push(`/topic-builder/results?${params.toString()}`);

          toast.success("Topics generated successfully!", {
            description: `Generated ${topicsWithIds.length} topic ideas for you.`,
          });
        } else {
          throw new Error("Invalid response format from topic generation API");
        }
      } catch (error) {
        const classifiedError =
          error &&
          typeof error === "object" &&
          "type" in error &&
          "message" in error
            ? (error as BackendError)
            : classifyError(error, requestId);

        console.error("Topic generation failed:", classifiedError);
        setGenerationError(classifiedError);

        toast.error("Generation failed", {
          description: classifiedError.message,
          action: classifiedError.recoveryActions.includes("retry")
            ? {
                label: "Retry",
                onClick: () => generateTopics(formData),
              }
            : undefined,
          duration: 6000,
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [connectionStatus, router],
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
        // Generate topics using the API
        await generateTopics(formData);
      }
    },
    [onComplete, generateTopics],
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
