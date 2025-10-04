"use client";

import { ChevronDown, Loader2, Plus, RotateCcw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorAlert } from "@/components/ui/error-alert";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import { useTopicStorage } from "@/hooks/use-topic-storage";
import { useTopicGenerationMutation } from "@/hooks/useTopicGenerationMutation";
import {
  useTopicBulkSaveMutation,
  useTopicSaveMutation,
} from "@/hooks/useTopicMutations";
import { getSession, updateSession } from "@/lib/session-storage";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import { useCurrentWorkspace } from "@/stores/workspace-store";
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
  const urlWorkspaceId = params.workspaceId as string; // Extract from URL
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);
  const currentWorkspace = useCurrentWorkspace();

  const [state, setState] = useState<ResultsPageState>({
    session: null,
    isLoading: true,
    error: null,
  });

  const {
    resetWizard,
    appendGeneratedTopics,
    isGeneratingMore,
    setIsGeneratingMore,
    newlyAddedTopicIds,
    clearNewlyAddedHighlights,
  } = useTopicBuilderStore();
  const generateMoreMutation = useTopicGenerationMutation();

  // Prefer workspace ID from URL params (most reliable), fallback to currentWorkspace
  const workspaceId = urlWorkspaceId || currentWorkspace?.id || "";
  const _isWorkspaceLoading = !urlWorkspaceId && !currentWorkspace;

  console.log("[WorkspaceResults] Workspace ID:", {
    urlWorkspaceId,
    currentWorkspaceId: currentWorkspace?.id,
    finalWorkspaceId: workspaceId,
  });

  // Use workspace ID from URL or current workspace
  const bulkSaveMutation = useTopicBulkSaveMutation(
    workspaceId || "00000000-0000-0000-0000-000000000000",
  );
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
    if (!state.session) {
      console.error("No session available for topic save");
      return;
    }

    const topic = state.session.topics.find((t) => t.id === topicId);
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
    if (!state.session) {
      console.error("No session available for bulk save");
      return;
    }

    try {
      const allTopicsToConsider = state.session.topics.filter((topic) =>
        topicIds.includes(topic.id),
      );

      // Filter out already saved topics to prevent duplicates
      const unsavedTopics = allTopicsToConsider.filter(
        (topic) => !topic.is_saved && !topic._optimisticSaved,
      );

      if (allTopicsToConsider.length === 0) {
        console.warn("No topics found to save");
        return;
      }

      if (unsavedTopics.length === 0) {
        console.log("All selected topics are already saved");
        toast.info("All selected topics are already saved to your library");
        return;
      }

      const alreadySavedCount =
        allTopicsToConsider.length - unsavedTopics.length;
      if (alreadySavedCount > 0) {
        console.log(`Skipping ${alreadySavedCount} already saved topics`);
        toast.info(
          `Skipping ${alreadySavedCount} topic${alreadySavedCount !== 1 ? "s" : ""} already saved. Saving ${unsavedTopics.length} new topic${unsavedTopics.length !== 1 ? "s" : ""}.`,
        );
      }

      console.log("Starting bulk save to API:", {
        requestedIds: topicIds,
        totalRequested: allTopicsToConsider.length,
        alreadySaved: alreadySavedCount,
        willSave: unsavedTopics.length,
        topics: unsavedTopics.map((t) => ({
          id: t.id,
          title: t.title,
          is_saved: t.is_saved,
          _optimisticSaved: t._optimisticSaved,
        })),
      });

      // Use the proper API mutation instead of localStorage only
      await bulkSaveMutation.mutateAsync(unsavedTopics);

      // Also save to localStorage as backup
      saveTopics(unsavedTopics);

      console.log("Bulk save completed successfully");
    } catch (error) {
      console.error("Error during bulk save:", error);
      // Fallback to localStorage save if API fails
      try {
        const allTopicsToConsider = state.session.topics.filter((topic) =>
          topicIds.includes(topic.id),
        );
        const unsavedTopics = allTopicsToConsider.filter(
          (topic) => !topic.is_saved && !topic._optimisticSaved,
        );
        if (unsavedTopics.length > 0) {
          saveTopics(unsavedTopics);
          console.log("Fallback: Saved unsaved topics to localStorage only");
        }
      } catch (fallbackError) {
        console.error("Fallback save also failed:", fallbackError);
      }
    }
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
    if (!state.session?.formData) {
      console.error("❌ No form data available for generating more topics");
      return;
    }

    try {
      setIsGeneratingMore(true);
      clearNewlyAddedHighlights(); // Clear any existing highlights

      // Generate more topics using the stored form data
      console.log(
        `🔄 Generating ${additionalCount} more topics with session settings`,
      );

      // Create modified form data with the requested number of additional topics
      const modifiedFormData = {
        ...state.session.formData,
        num_topics: additionalCount,
      };

      // Use the mutation directly to generate topics
      const result = await generateMoreMutation.mutateAsync({
        formData: modifiedFormData,
      });

      if (result.topics && Array.isArray(result.topics)) {
        // Append the new topics to existing ones (in store and session)
        appendGeneratedTopics(result.topics);

        // Update session storage to persist the new topics
        const updatedSession = updateSession(temporaryId, result.topics, true);

        if (updatedSession) {
          // Update the local state with the persisted session data
          setState((prev) => ({
            ...prev,
            session: updatedSession,
          }));

          console.log(
            `✅ Successfully generated and persisted ${result.topics.length} more topics`,
            {
              totalTopicsNow: updatedSession.topics.length,
              newTopicsAdded: result.topics.length,
            },
          );
        } else {
          // Fallback: update local state only (session might have expired)
          setState((prev) => ({
            ...prev,
            session: prev.session
              ? {
                  ...prev.session,
                  topics: [...prev.session.topics, ...result.topics],
                }
              : null,
          }));

          console.warn(
            `⚠️ Could not persist to session storage, updated local state only`,
          );
        }

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
    console.log("🔄 Start Over button clicked - opening dialog");
    console.log("Current dialog state:", showStartOverDialog);
    // Temporarily skip dialog for testing
    if (
      confirm(
        "Start Over? This will clear all your current progress and return to the beginning of the topic builder.",
      )
    ) {
      handleConfirmStartOver();
    }
    // setShowStartOverDialog(true);
  };

  const handleConfirmStartOver = () => {
    console.log("✅ Confirm Start Over clicked - executing reset");
    try {
      // Reset wizard state and navigate to create page
      resetWizard();
      console.log(
        "🔄 Starting over: Wizard reset, navigating to topic builder",
      );
      setShowStartOverDialog(false);
      // Navigate to create page without full refresh
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
    // Retry session loading without full page reload
    if (temporaryId) {
      const loadSession = async () => {
        try {
          const sessionData = getSession(temporaryId);
          if (sessionData) {
            setState((prev) => ({
              ...prev,
              session: sessionData,
              isLoading: false,
              error: null,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: "Session not found or has expired.",
            }));
          }
        } catch (_error) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Failed to load session data.",
          }));
        }
      };
      loadSession();
    }
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
    ? `${state.session.topics.length} AI-generated topics for ${formatIndustryName(state.session.formData.industry)} industry`
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Generate More
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => handleGenerateMore(5)}>
                  Generate 5 more topics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGenerateMore(10)}>
                  Generate 10 more topics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGenerateMore(15)}>
                  Generate 15 more topics
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              isBulkSaving={bulkSaveMutation.isPending}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Generate More
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => handleGenerateMore(5)}>
                Generate 5 more topics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateMore(10)}>
                Generate 10 more topics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateMore(15)}>
                Generate 15 more topics
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleStartOver} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>

      {/* Start Over Confirmation Dialog */}
      <Dialog
        open={showStartOverDialog}
        onOpenChange={(open) => {
          console.log("🔄 Dialog state changed:", open);
          setShowStartOverDialog(open);
        }}
      >
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
