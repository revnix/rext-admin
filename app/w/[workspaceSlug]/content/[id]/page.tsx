"use client";

import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
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
import { log } from "@/lib/logger";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import { useContentDetail } from "@/hooks/use-content";
import type {
  CONTENT,
  SEORESULT,
  Outline,
} from "@/types/generate-content";
import { ContentEditor } from "@/components/generate-content/content";
import { safeJsonParse } from "@/lib/utils";

type WorkspaceContentDetailPageProps = {
  params: Promise<{
    workspaceSlug: string;
    id: string;
  }>;
}

export default function WorkspaceContentDetailPage({
  params,
}: WorkspaceContentDetailPageProps) {
  const { workspaceSlug, id } = use(params);
  const { workspace, workspaceId } = useWorkspace();
  const router = useRouter();

  // Fetch content details using hook
  const {
    data: contentResponse,
    isLoading: isContentLoading,
    error: fetchError,
    refetch: refetchContent,
  } = useContentDetail(workspaceId, id);

  const content = contentResponse?.content;
  const [isEditing, setIsEditing] = useState(false);
  const [contentMarkdown, setContentMarkdown] = useState("");

  useEffect(() => {
    if (content?.body_markdown && typeof content.body_markdown === "string") {
      // Basic validation: ensure it's a string and within reasonable bounds
      const MAX_CONTENT_LENGTH = 500_000; // 500KB max
      if (content.body_markdown.length <= MAX_CONTENT_LENGTH) {
        setContentMarkdown(content.body_markdown);
      } else {
        log.warn("Content body_markdown exceeds maximum length", {
          length: content.body_markdown.length,
          max: MAX_CONTENT_LENGTH,
        });
        setContentMarkdown(content.body_markdown.slice(0, MAX_CONTENT_LENGTH));
      }
    }
  }, [content?.body_markdown]);

  const handleEditToggle = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.name || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Content", href: workspaceRoutes.content(workspaceSlug) },
    { label: content?.title || "Detail" },
  ];

  const seoResult = useMemo<SEORESULT | null>(() => {
    if (!content?.seo_data?.seo_details) return null;
    try {
      return safeJsonParse(content?.seo_data?.seo_details);
    } catch {
      return null;
    }
  }, [content?.seo_data?.seo_details]);

  const outline = useMemo<Outline>(() => ({
    title: content?.title,
    brief: content?.introduction || "",
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
  }), [contentMarkdown, content?.title, content?.introduction]);

  // Construct CONTENT object for advanced editor
  const wordCount = useMemo(
    () => contentMarkdown?.split(/\s+/).length || 0,
    [contentMarkdown],
  );

  const advancedContent = useMemo<CONTENT>(() => ({
    topics: [],
    selected_topic: content?.title,
    outline,
    draft: {
      title: content?.title,
      body_markdown: contentMarkdown,
      word_count: wordCount,
      sections_completed: [],
      status: "approved",
    },
    status: "completed",
    outline_retries: 0,
    draft_retries: 0,
    review_retries: 0,
    max_retries: 3,
    final_content: {
      title: content?.title,
      introduction: content?.introduction || "",
      body_markdown: contentMarkdown,
      tags: content?.tags || [],
      meta_title: content?.seo_data?.meta_title || "",
      meta_description: content?.seo_data?.meta_description || "",
      focus_keyphrase: content?.seo_data?.focus_keyphrase || "",
      word_count: wordCount,
      status: "generated",
    },
    review: {
      seo_score: content?.seo_data?.content_seo_score || 0,
      trust_score: content?.seo_data?.trust_score
        ? {
          score: content?.seo_data.trust_score,
          trust_score: content?.seo_data.trust_score,
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
        flesch_reading_ease: content?.seo_data?.readability_score || 0,
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
  }), [
    content?.title,
    content?.introduction,
    content?.tags,
    content?.seo_data,
    content?.body_markdown,
    contentMarkdown,
    outline,
    wordCount,
  ]);

  const finalContent = advancedContent?.final_content;

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
            trustScore={advancedContent.review?.trust_score || null}
            generatedContent={contentMarkdown}
            seoScore={seoResult}
            isEditing={isEditing}
            userKeyword={content.seo_data?.focus_keyphrase || ""}
            outline={outline}
            onEditToggle={handleEditToggle}
            onContentChange={setContentMarkdown}
          />
        )}
      </PageLayout>
    </CanAccess>
  );
}
