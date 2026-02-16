"use client";

import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { log } from "@/lib/logger";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import { useContentDetail } from "@/hooks/use-content";
import type { GenerationStep } from "@/types/content-generation-progress";
import type { SSEEvent } from "@/types/sse";
import type {
  CONTENT,
  SEORESULT,
  Outline,
  EEATData,
} from "@/types/generate-content";
import { ContentEditor } from "@/components/generate-content/content";
import { safeJsonParse } from "@/lib/utils";

const contentLogger = log.forComponent("ContentDetailPage");

type WorkspaceContentDetailPageProps = {
  params: Promise<{
    workspaceSlug: string;
    id: string;
  }>;
};

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
  const { workspace, workspaceId } = useWorkspace();
  const router = useRouter();

  const [currentProgress, setCurrentProgress] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Fetch content details using hook
  const {
    data: contentResponse,
    isLoading: isContentLoading,
    error: fetchError,
    refetch: refetchContent,
  } = useContentDetail(workspaceId, id);

  const content = contentResponse?.content;

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
        refetchContent();
      },
      onError: (error) => {
        contentLogger.error("Generation failed", { error });
        toast.error(`Generation failed: ${error}`);
        // Refresh to update status
        refetchContent();
      },
    },
  );

  // Handle retry
  const handleRetry = async () => {
    if (!workspaceId) return;

    setIsRetrying(true);
    try {
      contentLogger.info("Retrying content generation", { contentId: id });

      await apiClient.content.retry(workspaceId, id);

      toast.success("Content generation restarted!");

      // Reset state and refetch
      setCurrentProgress(0);
      await refetchContent();
    } catch (error) {
      contentLogger.error("Failed to retry content generation", { error });
      toast.error("Failed to retry generation. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [contentMarkdown, setContentMarkdown] = useState("");

  // Update local content state when fetched
  useEffect(() => {
    if (content?.body_markdown) {
      setContentMarkdown(content.body_markdown);
    }
  }, [content?.body_markdown]);

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

  if (isContentLoading) {
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

  if (fetchError) {
    return (
      <PageLayout
        title="Error Loading Content"
        description="There was an error fetching the content"
        breadcrumbs={breadcrumbs}
      >
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold">Failed to load content</h3>
              <p className="text-muted-foreground">
                We encountered an error while trying to fetch the content
                details. Please try again or contact support.
              </p>
              <Button onClick={() => refetchContent()}>Retry Load</Button>
            </div>
          </CardContent>
        </Card>
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

  const seoResult = safeJsonParse<SEORESULT>(
    content.seo_data?.seo_details,
    null,
    "seo_details",
  );

  const eeatData = safeJsonParse<EEATData>(
    content.seo_data?.eeat_data,
    null,
    "eeat_data",
  );

  // Construct Outline object (mocked or extracted from content if possible)
  // For now, we can extract headings from markdown if outline is missing in API
  const outline: Outline = {
    title: content.title,
    brief: content.introduction || "",
    sections:
      contentMarkdown?.match(/^#+\s+.+$/gm)?.map((h) => ({
        heading: h.replace(/^#+\s+/, ""),
        description: "",
        key_points: [],
      })) || [],
    target_audience: [],
    tone: "",
    keywords_to_include: [],
    status: "approved",
    outline_retries: 0,
    draft_retries: 0,
    review_retries: 0,
    max_retries: 3,
  };

  // Construct CONTENT object for advanced editor
  const advancedContent: CONTENT = {
    topics: [],
    selected_topic: content.title,
    outline: outline,
    draft: {
      title: content.title,
      body_markdown: contentMarkdown,
      word_count: contentMarkdown?.split(/\s+/).length || 0,
      sections_completed: [],
      status: "approved",
    },
    status: "completed",
    outline_retries: 0,
    draft_retries: 0,
    review_retries: 0,
    max_retries: 3,
    final_content: {
      title: content.title,
      introduction: content.introduction || "",
      body_markdown: contentMarkdown,
      tags: content.tags || [],
      meta_title: content.seo_data?.meta_title || "",
      meta_description: content.seo_data?.meta_description || "",
      focus_keyphrase: content.seo_data?.focus_keyphrase || "",
      word_count: content.body_markdown?.split(/\s+/).length || 0,
      status: "generated",
    },
    review: {
      seo_score: content.seo_data?.content_seo_score || 0,
      trust_score: content.seo_data?.trust_score
        ? {
            score: content.seo_data.trust_score,
            trust_score: content.seo_data.trust_score,
            author_credibility: 0,
            expertise: 0,
            authority: 0,
            trustworthiness: 0,
            citations_references: 0,
            content_accuracy: 0,
            freshness: 0,
            transparency: 0,
            spam_signals: 0,
            technical_trust: 0,
            reasoning: "",
          }
        : undefined,
      readability_metrics: {
        flesch_reading_ease: content.seo_data?.readability_score || 0,
        flesch_kincaid_grade: 0,
        gunning_fog_index: 0,
        smog_index: 0,
        automated_readability_index: 0,
        coleman_liau_index: 0,
        dale_chall_score: 0,
      },
      passed: true,
      missing_points: [],
      improvement_suggestions: [],
    },
  };

  const finalContent = advancedContent?.final_content;

  return (
    <CanAccess
      permission={CONTENT_PERMISSIONS.READ}
      fallback={
        <PageLayout title="Access Denied" breadcrumbs={breadcrumbs}>
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
                </code>
              </p>
            </CardContent>
          </Card>
        </PageLayout>
      }
    >
      {/* Content Rendering based on status */}
      {content.status === "generating" ? (
        <PageLayout
          title={content.title}
          description="Content generation in progress"
          breadcrumbs={breadcrumbs}
        >
          <div className="space-y-6">
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
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Overall Progress
                    </span>
                    <span className="font-medium">{currentProgress}%</span>
                  </div>
                  <Progress value={currentProgress} className="h-3" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
                  />
                  <span className="text-muted-foreground">
                    {isConnected ? "Connected" : "Connecting..."}
                  </span>
                </div>
              </CardContent>
            </Card>
            <ProgressTimeline
              steps={timelineSteps}
              currentStep={latestEvent?.step}
            />
          </div>
        </PageLayout>
      ) : ["generated", "draft", "review", "published", "scheduled"].includes(
          content.status,
        ) ? (
        <PageLayout
          title={content.title}
          description="Review and edit generated content"
          breadcrumbs={breadcrumbs}
          fullWidth
          className="p-0"
          hideTitle
        >
          {finalContent && (
            <ContentEditor
              allContent={finalContent}
              contentId={content.id}
              readabilityScore={
                advancedContent.review?.readability_metrics || null
              }
              eeatData={eeatData}
              trustScore={advancedContent.review?.trust_score || null}
              generatedContent={contentMarkdown}
              seoScore={seoResult}
              isEditing={isEditing}
              userKeyword={content.seo_data?.focus_keyphrase || ""}
              outline={outline}
              onEditToggle={() => setIsEditing(!isEditing)}
              onContentChange={setContentMarkdown}
            />
          )}
        </PageLayout>
      ) : content.status === "failed" ? (
        <PageLayout
          title={content.title}
          description="Content generation failed"
          breadcrumbs={breadcrumbs}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="text-lg font-semibold">Generation Failed</h3>
                <p className="text-muted-foreground">
                  There was an issue generating your content.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleRetry} disabled={isRetrying}>
                    {isRetrying ? "Retrying..." : "Retry Generation"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(workspaceRoutes.content(workspaceSlug))
                    }
                  >
                    Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </PageLayout>
      ) : (
        <PageLayout
          title={content.title}
          description={`Status: ${content.status}`}
          breadcrumbs={breadcrumbs}
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mb-4">
                Content status:{" "}
                <span className="font-medium">{content.status}</span>
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(workspaceRoutes.content(workspaceSlug))
                }
              >
                Back
              </Button>
            </CardContent>
          </Card>
        </PageLayout>
      )}
    </CanAccess>
  );
}
