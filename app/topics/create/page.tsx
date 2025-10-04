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
import { logger } from "@/lib/logger";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import { useCurrentWorkspace } from "@/stores/workspace-store";
import type { GeneratedTopic } from "@/types/topic-builder";

const topicsCreateLogger = logger.forComponent("TopicsCreatePage");

export default function TopicBuilderPage() {
  const router = useRouter();
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);
  const currentWorkspace = useCurrentWorkspace();

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

  // Get workspace ID from current workspace
  const workspaceId = currentWorkspace?.id || "";
  const isWorkspaceLoading = !currentWorkspace;

  // Only initialize mutation if we have a workspace (use dummy ID during loading to avoid hook errors)
  const topicSaveMutation = useTopicSaveMutation(
    workspaceId || "00000000-0000-0000-0000-000000000000",
  );

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
      topicsCreateLogger.error("Topic not found", { topic_id: topicId });
      return;
    }

    // Check if workspace is still loading
    if (isWorkspaceLoading) {
      topicsCreateLogger.warn("Workspace still loading");
      toast.warning("Workspace is loading", {
        description: "Please wait for workspace to load before saving topics",
      });
      return;
    }

    // Check if workspace is selected
    if (!workspaceId) {
      topicsCreateLogger.error("No workspace selected");
      toast.error("Please select a workspace first", {
        description: "Topics must be saved to a workspace",
      });
      return;
    }

    // Check if topic is already saved to prevent duplicates
    if (topic.is_saved || topic._optimisticSaved) {
      topicsCreateLogger.debug("Topic already saved, skipping", {
        topic_id: topicId,
      });
      toast.info("This topic is already saved to your library");
      return;
    }

    try {
      topicsCreateLogger.info("Saving topic to API", {
        topic_id: topicId,
        title: topic.title,
        workspace_id: workspaceId,
      });

      // Use the proper API mutation
      await topicSaveMutation.mutateAsync(topic);

      // Also save to localStorage as backup
      saveTopic(topic);

      topicsCreateLogger.info("Topic saved successfully", {
        topic_id: topicId,
      });
    } catch (error) {
      topicsCreateLogger.error("Error saving topic", {
        topic_id: topicId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback to localStorage save if API fails
      try {
        saveTopic(topic);
        topicsCreateLogger.warn("Fallback local save", { topic_id: topicId });
      } catch (fallbackError) {
        topicsCreateLogger.error("Fallback save also failed", {
          topic_id: topicId,
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });
      }
    }
  };

  const handleBulkSave = async (topicIds: string[]) => {
    const topicsToSave = generatedTopics.filter((topic) =>
      topicIds.includes(topic.id),
    );
    saveTopics(topicsToSave);
    topicsCreateLogger.debug("Bulk saved topics to localStorage", {
      topic_ids: topicIds,
    });
  };

  const handleTopicEdit = async (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => {
    // TODO: Implement topic editing functionality
    topicsCreateLogger.debug("Editing topic", {
      topic_id: topicId,
      updates,
    });
    // In a real implementation, this would update the topic in state/API
  };

  const handleTopicRegenerate = async (topicId: string) => {
    // TODO: Implement single topic regeneration
    topicsCreateLogger.info("Regenerating topic", { topic_id: topicId });
    // In a real implementation, this would call the API to regenerate just this topic
  };

  const handleTopicExport = async (
    _topics: GeneratedTopic[],
    format: "json" | "csv",
  ) => {
    exportTopics(format);
    topicsCreateLogger.info("Exporting saved topics", { format });
  };

  const handleTopicDelete = async (topicId: string) => {
    removeTopic(topicId);
    topicsCreateLogger.debug("Topic deleted from localStorage", {
      topic_id: topicId,
    });
  };

  const handleGenerateMore = async (additionalCount: number) => {
    try {
      setIsGeneratingMore(true);
      clearNewlyAddedHighlights(); // Clear any existing highlights

      // Generate more topics without clearing existing ones
      topicsCreateLogger.info("Generating additional topics", {
        additional_count: additionalCount,
      });

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
        topicsCreateLogger.info("Generated additional topics", {
          additional_count: result.topics.length,
        });

        // Clear highlights after 3 seconds
        setTimeout(() => {
          clearNewlyAddedHighlights();
        }, 3000);
      } else {
        throw new Error("Invalid response format from topic generation API");
      }
    } catch (error) {
      topicsCreateLogger.error("Error generating more topics", {
        error: error instanceof Error ? error.message : String(error),
        additional_count: additionalCount,
      });
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
      topicsCreateLogger.info("Resetting topic builder", {
        cleared_topics: true,
      });
      setShowStartOverDialog(false);
    } catch (error) {
      topicsCreateLogger.error("Error resetting wizard", {
        error: error instanceof Error ? error.message : String(error),
      });
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
                  topicsCreateLogger.info("Contact support clicked", {
                    source: "generation-error-dialog",
                  });
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
                  topicsCreateLogger.info("Contact support clicked", {
                    source: "storage-error-dialog",
                  });
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
