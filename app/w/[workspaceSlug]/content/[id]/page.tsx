"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ContentEditor } from "@/components/content/content-editor";
import { ProgressTimeline } from "@/components/content-generation/progress-timeline";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import { apiClient } from "@/lib/api-client";
import { getAuthHeaders } from "@/lib/auth-utils";
import { log } from "@/lib/logger";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import type { GenerationStep } from "@/types/content-generation-progress";
import type { SSEEvent } from "@/types/sse";

const contentLogger = log.forComponent("ContentDetailPage");

type WorkspaceContentDetailPageProps = {
  params: Promise<{
    workspaceSlug: string;
    id: string;
  }>;
};

interface Content {
  id: string;
  title: string;
  status: string;
  body_markdown?: string;
  body_html?: string;
  created_at: string;
  updated_at: string;
  content_metadata?: Record<string, unknown>;
  seo_data?: Record<string, unknown>;
}

// Map backend step names to UI steps
const STEP_MAPPING: Record<
  string,
  { name: string; description: string; order: number }
> = {
  initializing: {
    name: "Initialization",
    description: "Initializing content generation...",
    order: 0,
  },
  fetching_user: {
    name: "User Data",
    description: "Fetching user information...",
    order: 1,
  },
  fetching_workspace: {
    name: "Workspace",
    description: "Loading workspace details...",
    order: 2,
  },
  fetching_topic: {
    name: "Topic",
    description: "Retrieving topic information...",
    order: 3,
  },
  gathering_web_context: {
    name: "Web Research",
    description: "Searching web for relevant context...",
    order: 4,
  },
  gathering_knowledge_context: {
    name: "Knowledge Base",
    description: "Retrieving workspace knowledge...",
    order: 5,
  },
  scraping_content: {
    name: "Content Scraping",
    description: "Scraping and processing sources...",
    order: 6,
  },
  reranking_documents: {
    name: "Relevance Ranking",
    description: "Ranking content by relevance...",
    order: 7,
  },
  generating_blog: {
    name: "AI Generation",
    description: "Generating content with AI...",
    order: 8,
  },
  saving_content: {
    name: "Saving",
    description: "Saving generated content...",
    order: 9,
  },
};

export default function WorkspaceContentDetailPage({
  params,
}: WorkspaceContentDetailPageProps) {
  const { workspaceSlug, id } = use(params);
  const { workspace } = useWorkspace();
  const router = useRouter();

  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Fetch content details
  const fetchContent = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/content/${id}?workspace_id=${workspace?.id}`,
        { headers },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }

      const result = await response.json();

      // Handle new consistent format: { success: true, data: { content: {...} } }
      const contentData = result?.data?.content || result?.content || result;
      setContent(contentData);

      contentLogger.info("Content fetched", {
        contentId: id,
        status: contentData.status,
      });
    } catch (error) {
      contentLogger.error("Failed to fetch content", { error });
      toast.error("Failed to load content details");
    } finally {
      setIsLoading(false);
    }
  }, [id, workspace?.id]);

  // Subscribe to SSE only if status is "generating"
  const shouldSubscribe = content?.status === "generating";

  const { events, latestEvent, isConnected } = useSSEChannel(
    shouldSubscribe ? id : null,
    {
      autoConnect: true,
      onEvent: (event: SSEEvent) => {
        contentLogger.debug("SSE event received", {
          step: event.step,
          progress: event.progress,
          status: event.status,
        });

        // Update current progress
        if (event.progress !== undefined) {
          setCurrentProgress(event.progress);
        }
      },
      onComplete: (payload) => {
        contentLogger.info("Generation completed", { payload });
        toast.success("Content generation completed!");
        // Refresh content to get generated body
        fetchContent();
      },
      onError: (error) => {
        contentLogger.error("Generation failed", { error });
        toast.error(`Generation failed: ${error}`);
        // Refresh to update status
        fetchContent();
      },
    },
  );

  // Initial fetch
  useEffect(() => {
    if (workspace?.id) {
      fetchContent();
    }
  }, [workspace?.id, fetchContent]);

  // Handle retry
  const handleRetry = async () => {
    if (!workspace?.id) return;

    setIsRetrying(true);
    try {
      contentLogger.info("Retrying content generation", { contentId: id });

      await apiClient.content.retry(workspace.id, id);

      toast.success("Content generation restarted!");

      // Reset state and refetch
      setCurrentProgress(0);
      await fetchContent();
    } catch (error) {
      contentLogger.error("Failed to retry content generation", { error });
      toast.error("Failed to retry generation. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  // Map SSE events to timeline steps
  const timelineSteps: GenerationStep[] = Object.entries(STEP_MAPPING)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([stepKey, stepInfo]) => {
      const event = events.find((e) => e.step === stepKey);

      let status: "pending" | "in-progress" | "completed" | "failed" =
        "pending";

      if (event) {
        if (event.status === "failed") {
          status = "failed";
        } else if (event.progress === 100 || event.status === "completed") {
          status = "completed";
        } else if (event.progress !== undefined && event.progress > 0) {
          status = "in-progress";
        }
      }

      return {
        id: stepKey,
        title: stepInfo.name,
        description: event?.message || stepInfo.description,
        status,
        progress: event?.progress,
        startedAt: event?.timestamp,
        error: event?.status === "failed" ? event.message : undefined,
      };
    });

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Content", href: workspaceRoutes.content(workspaceSlug) },
    { label: content?.title || "Detail" },
  ];

  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading content details"
        breadcrumbs={breadcrumbs}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!content) {
    return (
      <PageLayout
        title="Content Not Found"
        description="The requested content could not be found"
        breadcrumbs={breadcrumbs}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Content not found</p>
              <p className="text-muted-foreground mb-4">
                The content with ID "{id}" could not be found.
              </p>
              <Button
                onClick={() =>
                  router.push(workspaceRoutes.content(workspaceSlug))
                }
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Show progress view if generating
  if (content.status === "generating") {
    return (
      <PageLayout
        title={content.title}
        description="Content generation in progress"
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          {/* Progress Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">
                    Generating Content...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {latestEvent?.message || "Initializing..."}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overall Progress
                  </span>
                  <span className="font-medium">{currentProgress}%</span>
                </div>
                <Progress value={currentProgress} className="h-3" />
              </div>

              {/* Connection Status */}
              <div className="mt-4 flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
                />
                <span className="text-muted-foreground">
                  {isConnected ? "Connected" : "Connecting..."}
                </span>
              </div>

              {/* Connection Warning */}
              {!isConnected && currentProgress > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Connection lost.</strong> Progress is still being
                    tracked. The page will automatically update when
                    reconnected.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Timeline */}
          <ProgressTimeline
            steps={timelineSteps}
            currentStep={latestEvent?.step}
          />
        </div>
      </PageLayout>
    );
  }

  // Show editor view if ready
  if (content.status === "ready") {
    return (
      <PageLayout
        title={content.title}
        description="Review and edit generated content"
        breadcrumbs={breadcrumbs}
      >
        <ContentEditor
          contentId={id}
          workspaceId={workspace?.id || ""}
          initialMarkdown={content.body_markdown || ""}
          title={content.title}
          onSaveSuccess={fetchContent}
        />
      </PageLayout>
    );
  }

  // Show error view if failed
  if (content.status === "failed") {
    return (
      <PageLayout
        title={content.title}
        description="Content generation failed"
        breadcrumbs={breadcrumbs}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-500">
                <svg
                  className="h-12 w-12 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-label="Error icon"
                >
                  <title>Error</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Generation Failed</h3>
              <p className="text-muted-foreground">
                There was an issue generating your content. You can retry the
                generation or contact support if the problem persists.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRetry} disabled={isRetrying}>
                  {isRetrying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    "Retry Generation"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(workspaceRoutes.content(workspaceSlug))
                  }
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Content
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Default view for other statuses
  return (
    <PageLayout
      title={content.title}
      description={`Content status: ${content.status}`}
      breadcrumbs={breadcrumbs}
    >
      <CanAccess
        anyPermission={[CONTENT_PERMISSIONS.READ, CONTENT_PERMISSIONS.UPDATE]}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view this content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  content.read
                </code>{" "}
                or{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  content.update
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Content status:{" "}
                <span className="font-medium">{content.status}</span>
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(workspaceRoutes.content(workspaceSlug))
                }
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </CanAccess>
    </PageLayout>
  );
}
