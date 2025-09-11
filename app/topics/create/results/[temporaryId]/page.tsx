"use client";

import { Loader2, Plus, RotateCcw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { SessionNotifications } from "@/components/session-notifications";
import { TopicsList } from "@/components/topic-builder/results/TopicsList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorAlert } from "@/components/ui/error-alert";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import { useTopicStorage } from "@/hooks/use-topic-storage";
import { getSession } from "@/lib/session-storage";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import type { SessionData } from "@/types/session";
import type { GeneratedTopic } from "@/types/topic-builder";

interface ResultsPageState {
  session: SessionData | null;
  isLoading: boolean;
  error: string | null;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const temporaryId = params.temporaryId as string;
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  const [state, setState] = useState<ResultsPageState>({
    session: null,
    isLoading: true,
    error: null,
  });

  const { resetWizard } = useTopicBuilderStore();

  const {
    saveTopic,
    saveTopics,
    removeTopic,
    exportTopics,
    error: storageError,
    clearError: clearStorageError,
  } = useTopicStorage();

  // Load session data on mount
  useEffect(() => {
    const loadSession = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log(`Loading session data for temporaryId: ${temporaryId}`);

        const sessionData = getSession(temporaryId);

        if (!sessionData) {
          console.warn(`No session found for temporaryId: ${temporaryId}`);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              "Session not found or has expired. Generated topics are only stored temporarily for 24 hours.",
          }));
          return;
        }

        console.log(`Session loaded successfully:`, {
          topicCount: sessionData.topics.length,
          formData: sessionData.formData,
          expiresAt: new Date(sessionData.expiresAt).toISOString(),
        });

        setState((prev) => ({
          ...prev,
          session: sessionData,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        console.error("Failed to load session:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            "Failed to load session data. The session may be corrupted or unavailable.",
        }));
      }
    };

    if (temporaryId) {
      loadSession();
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Invalid session ID provided.",
      }));
    }
  }, [temporaryId]);

  // Event handlers for topic operations
  const handleTopicSave = async (topicId: string) => {
    if (!state.session) return;

    const topic = state.session.topics.find((t) => t.id === topicId);
    if (topic) {
      saveTopic(topic);
      console.log("Topic saved to localStorage:", topicId);
    }
  };

  const handleBulkSave = async (topicIds: string[]) => {
    if (!state.session) return;

    const topicsToSave = state.session.topics.filter((topic) =>
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

  const handleGenerateMore = () => {
    // Navigate back to create page to generate more topics
    // The form data will be preserved for generating additional topics
    console.log("🔄 Navigating to generate more topics with current settings");
    router.push("/topics/create");
  };

  const handleStartOver = () => {
    setShowStartOverDialog(true);
  };

  const handleConfirmStartOver = () => {
    try {
      // Reset wizard state and navigate to create page
      resetWizard();
      console.log(
        "🔄 Starting over: Wizard reset, navigating to topic builder",
      );
      setShowStartOverDialog(false);
      router.push("/topics/create");
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

  const handleRetryLoad = () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    // Trigger reload by updating a dependency
    window.location.reload();
  };

  const handleSessionRecover = (sessionId: string) => {
    console.log(`Attempting to recover session: ${sessionId}`);
    router.push(`/topics/create/results/${sessionId}`);
  };

  // Helper function to format industry name for display
  const formatIndustryName = (industry: string): string => {
    return industry
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to format content type for display
  const formatContentType = (contentType: string): string => {
    return contentType
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Dynamic breadcrumbs configuration based on session data
  const breadcrumbs = [
    { label: "Topics", href: "/topics" },
    { label: "Topic Builder", href: "/topics/create" },
    {
      label: state.session
        ? `Results - ${formatIndustryName(state.session.formData.industry)}`
        : "Results",
    },
  ];

  // Generate page title and description based on session data
  const pageTitle = state.session
    ? `${formatIndustryName(state.session.formData.industry)} Topics (${state.session.topics.length} results)`
    : "Topic Results";

  const pageDescription = state.session
    ? `${state.session.topics.length} AI-generated topics for ${formatIndustryName(state.session.formData.industry)} industry • ${formatContentType(state.session.formData.content_type)} content`
    : "View your generated topics";

  // Loading state
  if (state.isLoading) {
    return (
      <PageLayout
        title="Loading Results..."
        description="Retrieving your generated topics"
        breadcrumbs={breadcrumbs}
        className="p-0"
      >
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your topic results...</p>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (state.error) {
    return (
      <PageLayout
        title="Results Not Found"
        description="Unable to load your topic results"
        breadcrumbs={breadcrumbs}
        className="p-0"
      >
        <div className="flex flex-col min-h-[400px] space-y-6 p-6">
          {/* Session Notifications with Recovery */}
          <SessionNotifications
            session={state.session}
            isLoading={state.isLoading}
            error={state.error}
            onSessionRecover={handleSessionRecover}
            onRetryLoad={handleRetryLoad}
          />

          {/* Additional action buttons */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleGenerateMore}
              variant="default"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Generate More
            </Button>
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Success state - show results
  if (state.session && state.session.topics.length > 0) {
    return (
      <PageLayout
        title={pageTitle}
        description={pageDescription}
        breadcrumbs={breadcrumbs}
        className="p-0"
      >
        {/* Storage Error Display */}
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

        <APIErrorBoundary onRetry={handleRetryLoad}>
          <div className="flex-1 p-6 space-y-6">
            {/* Session Notifications */}
            <SessionNotifications
              session={state.session}
              isLoading={state.isLoading}
              error={state.error}
              onSessionRecover={handleSessionRecover}
              onRetryLoad={handleRetryLoad}
            />

            <TopicsList
              topics={state.session.topics}
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
      </PageLayout>
    );
  }

  // Fallback state (should not reach here normally)
  return (
    <PageLayout
      title="No Results"
      description="No topic results found"
      breadcrumbs={breadcrumbs}
      className="p-0"
    >
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">
          No topics found in this session.
        </p>
        <div className="flex gap-4">
          <Button onClick={handleGenerateMore} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Generate More
          </Button>
          <Button onClick={handleStartOver} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>

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
