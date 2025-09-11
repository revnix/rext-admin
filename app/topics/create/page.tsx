"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
import { TopicsList } from "@/components/topic-builder/results/TopicsList";
import { TopicBuilderWizard } from "@/components/topic-builder/TopicBuilderWizard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorAlert, NetworkStatus } from "@/components/ui/error-alert";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import { useTopicBuilder } from "@/hooks/use-topic-builder";
import { useTopicStorage } from "@/hooks/use-topic-storage";
import { useTopicGenerationMutation } from "@/hooks/useTopicGenerationMutation";
import { useTopicSaveMutation } from "@/hooks/useTopicMutations";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import type { GeneratedTopic } from "@/types/topic-builder";

export default function TopicBuilderPage() {
  const router = useRouter();
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  const {
    formData,
    generatedTopics,
    isGenerating,
    generationError,
    isOnline,
    generateTopics,
    clearTopics,
    retryGeneration,
    updateFormData,
  } = useTopicBuilder();

  const {
    resetWizard,
    appendGeneratedTopics,
    isGeneratingMore,
    setIsGeneratingMore,
    newlyAddedTopicIds,
    clearNewlyAddedHighlights,
  } = useTopicBuilderStore();
  const generateMoreMutation = useTopicGenerationMutation();
  const topicSaveMutation = useTopicSaveMutation();

  const {
    saveTopic,
    saveTopics,
    removeTopic,
    exportTopics,
    error: storageError,
    clearError: clearStorageError,
  } = useTopicStorage();

  const breadcrumbs = [
    { label: "Topics", href: "/topics" },
    { label: "Topic Builder" },
  ];

  const handleTopicSave = async (topicId: string) => {
    const topic = generatedTopics.find((t) => t.id === topicId);
    if (!topic) {
      console.error("Topic not found:", topicId);
      return;
    }

    // Check if topic is already saved to prevent duplicates
    if (topic.is_saved || topic._optimisticSaved) {
      console.log("Topic already saved, skipping:", topicId);
      toast.info("This topic is already saved to your library");
      return;
    }

    try {
      console.log("Saving topic to API:", { id: topicId, title: topic.title });

      // Use the proper API mutation
      await topicSaveMutation.mutateAsync(topic);

      // Also save to localStorage as backup
      saveTopic(topic);

      console.log("Topic saved successfully:", topicId);
    } catch (error) {
      console.error("Error saving topic:", error);
      // Fallback to localStorage save if API fails
      try {
        saveTopic(topic);
        console.log("Fallback: Topic saved to localStorage only:", topicId);
      } catch (fallbackError) {
        console.error("Fallback save also failed:", fallbackError);
      }
    }
  };

  const handleBulkSave = async (topicIds: string[]) => {
    const topicsToSave = generatedTopics.filter((topic) =>
      topicIds.includes(topic.id),
    );
    saveTopics(topicsToSave);
    console.log("Bulk saved topics to localStorage:", topicIds);
  };

  const handleTopicEdit = async (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => {
    // TODO: Implement topic editing functionality
    console.log("Editing topic:", topicId, updates);
    // In a real implementation, this would update the topic in state/API
  };

  const handleTopicRegenerate = async (topicId: string) => {
    // TODO: Implement single topic regeneration
    console.log("Regenerating topic:", topicId);
    // In a real implementation, this would call the API to regenerate just this topic
  };

  const handleTopicExport = async (
    _topics: GeneratedTopic[],
    format: "json" | "csv",
  ) => {
    exportTopics(format);
    console.log("Exporting saved topics:", format);
  };

  const handleTopicDelete = async (topicId: string) => {
    removeTopic(topicId);
    console.log("Topic deleted from localStorage:", topicId);
  };

  const handleGenerateMore = async (additionalCount: number) => {
    try {
      setIsGeneratingMore(true);
      clearNewlyAddedHighlights(); // Clear any existing highlights

      // Generate more topics without clearing existing ones
      console.log(
        `🔄 Generating ${additionalCount} more topics with current settings`,
      );

      // Create modified form data with the requested number of additional topics
      const modifiedFormData = {
        ...formData,
        num_topics: additionalCount,
      };

      // Use the mutation directly to generate topics without navigation
      const result = await generateMoreMutation.mutateAsync({
        formData: modifiedFormData,
      });

      if (result.topics && Array.isArray(result.topics)) {
        // Append the new topics to existing ones (this will set newlyAddedTopicIds)
        appendGeneratedTopics(result.topics);
        console.log(
          `✅ Successfully generated and added ${result.topics.length} more topics`,
        );

        // Clear highlights after 3 seconds
        setTimeout(() => {
          clearNewlyAddedHighlights();
        }, 3000);
      } else {
        throw new Error("Invalid response format from topic generation API");
      }
    } catch (error) {
      console.error("❌ Error generating more topics:", error);
      // The mutation already handles error toasts
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleStartOver = () => {
    setShowStartOverDialog(true);
  };

  const handleConfirmStartOver = () => {
    try {
      // Clear all topic data and reset wizard state
      clearTopics();
      resetWizard();
      console.log("🔄 Starting over: All data cleared and wizard reset");
      setShowStartOverDialog(false);
    } catch (error) {
      console.error("❌ Error resetting wizard:", error);
      setShowStartOverDialog(false);
    }
  };

  const handleCancelStartOver = () => {
    setShowStartOverDialog(false);
  };

  const handleNavigateToTopics = () => {
    router.push("/topics");
  };

  // Show results if we have generated topics
  const showResults = generatedTopics.length > 0 && !isGenerating;

  return (
    <PageLayout
      title="Topic Builder"
      description="Generate AI-powered content topics for your industry"
      breadcrumbs={breadcrumbs}
      className="p-0"
    >
      {showResults ? (
        // Results View
        <APIErrorBoundary onRetry={retryGeneration}>
          <div className="flex-1 p-6">
            <TopicsList
              topics={generatedTopics}
              isGeneratingMore={isGeneratingMore}
              newlyAddedTopicIds={newlyAddedTopicIds}
              onTopicSave={handleTopicSave}
              onTopicEdit={handleTopicEdit}
              onTopicRegenerate={handleTopicRegenerate}
              onTopicExport={handleTopicExport}
              onTopicDelete={handleTopicDelete}
              onBulkSave={handleBulkSave}
              onBackToWizard={handleStartOver}
              onRegenerateTopics={handleGenerateMore}
              onNavigateToTopics={handleNavigateToTopics}
              onGenerateNew={handleGenerateMore}
            />
          </div>
        </APIErrorBoundary>
      ) : (
        // New TypeForm-Style Wizard
        <div className="h-full">
          {/* Network Status - show when offline */}
          {!isOnline && (
            <div className="fixed top-4 right-4 z-50">
              <NetworkStatus />
            </div>
          )}

          {/* Error Display */}
          {generationError && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
              <ErrorAlert
                error={generationError}
                operation="topic_generation"
                onRetry={retryGeneration}
                onGoBack={() => {}}
                onContactSupport={() => {
                  console.log("Contact support clicked");
                }}
              />
            </div>
          )}

          {storageError && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
              <ErrorAlert
                error={{
                  type: "unknown_error",
                  message: storageError,
                  severity: "medium",
                  recoveryActions: ["retry"],
                  isRetryable: true,
                  timestamp: new Date().toISOString(),
                }}
                operation="data_save"
                onRetry={clearStorageError}
                onGoBack={() => clearStorageError()}
                onContactSupport={() => {
                  console.log("Storage error - contact support clicked");
                }}
              />
            </div>
          )}

          <APIErrorBoundary onRetry={retryGeneration}>
            <TopicBuilderWizard
              initialData={undefined} // Don't pass existing formData, let wizard initialize its own
              autoAdvance={false}
              showProgress={true}
              allowBackNavigation={true}
              topicBuilderHook={{
                generateTopics,
                isGenerating,
                updateFormData, // Pass the actual updateFormData function
                formData, // Pass for reference
              }}
            />
          </APIErrorBoundary>
        </div>
      )}

      {/* Start Over Confirmation Dialog */}
      <Dialog open={showStartOverDialog} onOpenChange={setShowStartOverDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start Over?</DialogTitle>
            <DialogDescription>
              This will clear all your current progress, including your
              generated topics and wizard answers. You'll return to the
              beginning of the topic builder. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelStartOver}>
              Cancel
            </Button>
            <Button onClick={handleConfirmStartOver}>Start Over</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
