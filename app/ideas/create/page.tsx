"use client";

import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { AILoadingScreen } from "@/components/topic-builder/AILoadingScreen";
import { TopicsList } from "@/components/topic-builder/results/TopicsList";
import { TopicBuilderWizard } from "@/components/topic-builder/TopicBuilderWizard";
import { ErrorAlert, NetworkStatus } from "@/components/ui/error-alert";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import { useTopicBuilder } from "@/hooks/use-topic-builder";
import { useTopicStorage } from "@/hooks/use-topic-storage";
import type { GeneratedTopic } from "@/types/topic-builder";

export default function TopicBuilderPage() {
  const router = useRouter();

  const {
    formData,
    generatedTopics,
    isGenerating,
    generationError,
    isOnline,
    generateTopics,
    clearTopics,
    retryGeneration,
  } = useTopicBuilder();

  const {
    saveTopic,
    saveTopics,
    removeTopic,
    exportTopics,
    error: storageError,
    clearError: clearStorageError,
  } = useTopicStorage();

  const breadcrumbs = [
    { label: "Ideas", href: "/ideas" },
    { label: "Topic Builder" },
  ];

  const handleWizardComplete = async (_completedFormData: typeof formData) => {
    // The new wizard will pass the completed form data
    // We need to trigger the topic generation with this data
    await generateTopics();
  };

  const handleTopicSave = async (topicId: string) => {
    const topic = generatedTopics.find((t) => t.id === topicId);
    if (topic) {
      saveTopic(topic);
      console.log("Topic saved to localStorage:", topicId);
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

  const handleBackToWizard = () => {
    clearTopics();
  };

  const handleRegenerateTopics = async () => {
    clearTopics();
    await generateTopics();
  };

  const handleNavigateToIdeas = () => {
    router.push("/ideas");
  };

  const handleGenerateNew = () => {
    clearTopics();
  };

  // Show results if we have generated topics
  const showResults = generatedTopics.length > 0 && !isGenerating;

  return (
    <PageLayout
      title="Topic Builder"
      description="Generate AI-powered content topic ideas for your industry"
      breadcrumbs={breadcrumbs}
      className="p-0"
    >
      {showResults ? (
        // Results View
        <APIErrorBoundary onRetry={retryGeneration}>
          <div className="flex-1 p-6">
            <TopicsList
              topics={generatedTopics}
              onTopicSave={handleTopicSave}
              onTopicEdit={handleTopicEdit}
              onTopicRegenerate={handleTopicRegenerate}
              onTopicExport={handleTopicExport}
              onTopicDelete={handleTopicDelete}
              onBulkSave={handleBulkSave}
              onBackToWizard={handleBackToWizard}
              onRegenerateTopics={handleRegenerateTopics}
              onNavigateToIdeas={handleNavigateToIdeas}
              onGenerateNew={handleGenerateNew}
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
              onComplete={handleWizardComplete}
              autoAdvance={false}
              showProgress={true}
              allowBackNavigation={true}
            />
          </APIErrorBoundary>
        </div>
      )}

      {/* AI Loading Modal */}
      {isGenerating && <AILoadingScreen numIdeas={formData.num_ideas} />}
    </PageLayout>
  );
}
