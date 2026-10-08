"use client";

import { ArrowLeft, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { use, useEffect, useMemo, useState } from "react";
import { WorkingSurface } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { log } from "@/lib/logger";
import { PUBLISH_INTENTS } from "@/lib/content/publish-copy";
import { MAX_ARTICLE_TEXT, savedArticleText } from "@/lib/content/saved-text";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  useAwaitingData,
  useWorkspaceFailure,
} from "@/hooks/use-awaiting-data";
import { useContentDetail } from "@/hooks/use-content";
import type { CONTENT, SEORESULT, Outline } from "@/types/generate-content";
import { ContentEditor } from "@/components/generate-content/content";
import { cn, safeJsonParse } from "@/lib/utils";
import { dateFormat } from "@/lib/formatters/date-formatters";
import type { Route } from "next";

type WorkspaceContentDetailPageProps = {
  params: Promise<{
    workspaceSlug: string;
    id: string;
  }>;
};

export default function WorkspaceContentDetailPage({
  params,
}: WorkspaceContentDetailPageProps) {
  const { id } = use(params);
  const { workspace } = useWorkspace();
  const workspaceError = useWorkspaceFailure();
  const router = useRouter();

  // Canonical workspace UUID — keeps the detail query key in the same cache
  // family as the list page and the editor's invalidation (finding #10).
  const workspaceId = workspace?.id || "";

  // Fetch content details using hook. Until the workspace is known the query waits, so the page
  // waits on `useAwaitingData`, not `isLoading`, or it would say "Content not found" (D16a).
  const contentQuery = useContentDetail(workspaceId, id);
  const isWaiting = useAwaitingData(contentQuery);
  const { data: contentResponse, refetch: refetchContent } = contentQuery;
  // A workspace that couldn't be read is this page's failure too: its query never runs.
  const fetchError = contentQuery.error ?? workspaceError;

  const content = contentResponse?.content;
  // A publish asked for from the full-screen editor arrives in the address (task 706).
  const [publishIntent, setPublishIntent] = useQueryState(
    "publish",
    parseAsStringLiteral(PUBLISH_INTENTS),
  );
  const [contentMarkdown, setContentMarkdown] = useState("");

  // The article's text as this page shows it: the saved text, cut at a sane length. An article
  // with no text (one edited down to nothing) has an empty one, which is shown as empty and not
  // as whatever text the page held before.
  const savedMarkdown = useMemo(
    () => (content ? savedArticleText(content.body_markdown) : null),
    [content],
  );

  useEffect(() => {
    if (savedMarkdown === null) return;
    const length = content?.body_markdown?.length ?? 0;
    if (length > MAX_ARTICLE_TEXT) {
      log.warn("Content body_markdown exceeds maximum length", {
        length,
        max: MAX_ARTICLE_TEXT,
      });
    }
    setContentMarkdown(savedMarkdown);
  }, [savedMarkdown, content?.body_markdown?.length]);

  const seoResult = useMemo<SEORESULT | null>(() => {
    if (!content?.seo_data?.seo_details) return null;
    try {
      return safeJsonParse(content?.seo_data?.seo_details);
    } catch {
      return null;
    }
  }, [content?.seo_data?.seo_details]);

  const outline = useMemo<Outline>(
    () => ({
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
    }),
    [contentMarkdown, content?.title, content?.introduction],
  );

  // Construct CONTENT object for advanced editor
  const wordCount = useMemo(
    () => contentMarkdown?.split(/\s+/).length || 0,
    [contentMarkdown],
  );

  const advancedContent = useMemo<CONTENT>(
    () => ({
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
        html_content: content?.body_html || "",
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
    }),
    [
      content?.title,
      content?.introduction,
      content?.body_html,
      content?.tags,
      content?.seo_data,
      contentMarkdown,
      outline,
      wordCount,
    ],
  );

  const finalContent = advancedContent?.final_content;

  if (isWaiting) {
    return (
      <WorkingSurface title="Loading..." description="Loading content details">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground" />
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        </div>
      </WorkingSurface>
    );
  }

  if (fetchError) {
    // Detect 404 / not-found errors from the backend
    const errorMessage = (fetchError as Error)?.message?.toLowerCase() ?? "";
    const isNotFound =
      errorMessage.includes("not found") ||
      errorMessage.includes("404") ||
      (fetchError as { status?: number })?.status === 404;

    if (isNotFound) {
      return (
        <WorkingSurface
          title="Content Not Found"
          description="The requested content could not be found"
        >
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <p className="text-muted-foreground">
              The content you are looking for does not exist or you do not have
              permission to view it.
            </p>
            <Button
              data-rec="show"
              variant="outline"
              className="h-10 px-4 rounded-md"
              onClick={() =>
                router.push(
                  workspaceRoutes.content(workspace?.slug || "") as Route,
                )
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Button>
          </div>
        </WorkingSurface>
      );
    }

    return (
      <WorkingSurface
        title="Error Loading Content"
        description="There was an error fetching the content"
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
              <Button
                data-rec="show"
                onClick={() =>
                  workspaceError ? window.location.reload() : refetchContent()
                }
              >
                Retry Load
              </Button>
            </div>
          </CardContent>
        </Card>
      </WorkingSurface>
    );
  }

  if (!content) {
    return (
      <WorkingSurface
        title="Content Not Found"
        description="The requested content could not be found"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Content not found</p>
              <p className="text-muted-foreground mb-4">
                The content with ID "{id}" could not be found.
              </p>
              <Button
                data-rec="show"
                onClick={() =>
                  router.push(
                    workspaceRoutes.content(workspace?.slug || "") as Route,
                  )
                }
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </WorkingSurface>
    );
  }

  return (
    <PermissionGuard
      permission={CONTENT_PERMISSIONS.READ}
      fallback={
        <WorkingSurface title="Access Denied">
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
                <code className="text-xs bg-muted px-1 rounded-md">
                  content.read
                </code>
              </p>
            </CardContent>
          </Card>
        </WorkingSurface>
      }
    >
      {/* The editor draws the article's title as the page's h1. */}
      <WorkingSurface title={content.title} flush ownHeading>
        {content.publishing_results &&
          content.publishing_results.length > 0 && (
            <div className="px-6 pt-4">
              <div className="rounded-md border border-border/50 bg-card p-4 mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  CMS Publishing Status
                </p>
                <div className="space-y-2">
                  {content.publishing_results.map((result) => {
                    const isSuccess =
                      result.status === "published" ||
                      result.status === "synced";
                    const isError =
                      result.status === "failed" || result.status === "error";
                    return (
                      <div
                        key={result.site_id}
                        className="flex items-center gap-3 p-2.5 rounded-md bg-muted/30"
                      >
                        <span className="text-sm font-semibold text-foreground flex-1 truncate">
                          {result.site_id}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-1 rounded-full",
                            isSuccess && "bg-success-50 text-success-700",
                            isError && "bg-danger-50 text-danger-700",
                            !isSuccess &&
                              !isError &&
                              "bg-muted text-muted-foreground",
                          )}
                        >
                          {result.status}
                        </span>
                        {result.last_synced_at && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {dateFormat.short(result.last_synced_at)}
                          </span>
                        )}
                        {result.external_url && (
                          <a
                            href={result.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        {finalContent && (
          <ContentEditor
            allContent={finalContent}
            contentId={content.id}
            readabilityScore={
              advancedContent.review?.readability_metrics || null
            }
            checklist={content.checklist ?? null}
            trustScore={advancedContent.review?.trust_score || null}
            generatedContent={contentMarkdown}
            seoScore={seoResult}
            userKeyword={content.seo_data?.focus_keyphrase || ""}
            outline={outline}
            isLive={content.status === "published"}
            // Only once this page holds the article as the editor saved it: the publish sends
            // the text shown here, and a copy from before the edit may still be on screen while
            // the fresh one is read.
            publishIntent={
              !contentQuery.isFetching && contentMarkdown === savedMarkdown
                ? publishIntent
                : null
            }
            onPublishIntentTaken={() => setPublishIntent(null)}
          />
        )}
      </WorkingSurface>
    </PermissionGuard>
  );
}
