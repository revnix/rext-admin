import type { ContentStatus } from "@/types/content";
import type {
  FinalContent,
  Outline,
  ReadabilityMeta,
  ReadabilityMetrics,
  SEORESULT,
  Issue,
  TrustScore,
} from "@/types/generate-content";
import { Button } from "../ui/button";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  Pencil,
  Save,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { SafeLexicalEditor } from "../ui/safe-lexical-editor";
import { memo, useCallback, useState, useRef, useEffect, useMemo } from "react";
import { useTypewriter } from "@/hooks/use-typewriter";
import type { ComponentType } from "react";
import { useCurrentWorkspaceId } from "@/stores/workspace/use-workspace-context-store";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { AddIntegrationModal } from "@/app/w/[workspaceSlug]/integrations/add-integration-modal";
import { integrationsApiService } from "@/services/integrations-api";
import { log } from "@/lib/logger";
import { marked } from "marked";

function getReadabilityMeta(score: number): ReadabilityMeta {
  if (score >= 90) {
    return {
      label: "Very Easy",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }

  if (score >= 80) {
    return {
      label: "Easy",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }

  if (score >= 70) {
    return {
      label: "Fairly Easy",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }

  if (score >= 60) {
    return {
      label: "Standard",
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    };
  }

  if (score >= 50) {
    return {
      label: "Fairly Difficult",
      color: "text-yellow-600",
      barColor: "bg-yellow-500",
    };
  }

  if (score >= 30) {
    return {
      label: "Difficult",
      color: "text-orange-600",
      barColor: "bg-orange-500",
    };
  }

  return {
    label: "Loading",
    color: "text-green-600",
    barColor: "bg-transparent",
  };
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const levelToStatus = (level: string) => {
  switch (level) {
    case "GOOD":
      return "success";
    case "WARNING":
      return "warning";
    default:
      return "info";
  }
};

const getStatusMessage = (score: number) => {
  if (score >= 80) return "Excellent EEAT signals detected";
  if (score >= 60) return "Good EEAT signals detected";
  if (score >= 40) return "Moderate EEAT signals detected";
  return "Weak EEAT signals detected";
};

const getSEOStatusText = (score: number) => {
  if (score >= 95) return "Perfect SEO!";
  if (score >= 85) return "Almost Perfect!";
  if (score >= 70) return "Great Work!";
  if (score >= 50) return "Good Progress";
  if (score >= 30) return "Needs Optimization";
  return "Poor SEO Score";
};

type ContentEditorProps = {
  contentId?: string;
  allContent: FinalContent | null;
  readabilityScore: ReadabilityMetrics | null;
  trustScore: TrustScore | null;
  generatedContent: string;
  isEditing: boolean;
  seoScore: SEORESULT | null;
  userKeyword: string;
  outline: Outline | null;
  onEditToggle: () => void;
  onContentChange: (val: string) => void;
};

function ContentEditorInner(props: ContentEditorProps) {
  const {
    contentId,
    allContent,
    readabilityScore,
    trustScore,
    generatedContent,
    seoScore,
    isEditing,
    userKeyword,
    outline,
    onEditToggle,
    onContentChange,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isFinal =
    !!allContent && !!readabilityScore && !!trustScore && !!seoScore;
  const tags = allContent?.tags || [];
  const displayTitle = allContent?.title || "";
  const body = generatedContent;
  const previewHtml = body ? marked.parse(body) : "";
  const { displayed: typedTitle } = useTypewriter(displayTitle, { speed: 55 });
  const { displayed: typedIntro } = useTypewriter(
    allContent?.introduction || "",
    {
      speed: 45,
    },
  );
  const score = readabilityScore?.flesch_reading_ease ?? 0;
  const { label, color, barColor } = getReadabilityMeta(score);
  const progressWidth = `${Math.round(Math.min(Math.max(score, 0), 100))}%`;
  const workspaceId = useCurrentWorkspaceId();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    action: "publish" | "save" | "copy";
    message: string;
  }>({
    isOpen: false,
    type: "success",
    action: "publish",
    message: "",
  });
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [contentSavedId, setContentSavedId] = useState<string | undefined>(
    contentId,
  );

  // Derive sidebar headings from the actual body content
  const sidebarSections = useMemo(() => {
    if (!body) return outline?.sections || [];

    // Extract ATX-style headings (# Heading)
    const matches = Array.from(body.matchAll(/^#{1,6}\s+(.*)$/gm));

    if (matches.length > 0) {
      return matches.map((m) => ({
        heading: m[1].trim(),
      }));
    }

    // Fallback to planned outline if no headings found in body yet
    return outline?.sections || [];
  }, [body, outline]);

  // Sync active section on scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const headings = Array.from(
        container.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      );
      let _currentSectionIdx = -1;

      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        // The container's top is roughly its position in viewport
        // We use a 160px buffer for the sticky-like offset
        if (rect.top <= 200) {
          _currentSectionIdx = i;
        } else {
          break;
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const getContentPayload = () => ({
    title: displayTitle,
    slug: allContent?.slug || slugify(displayTitle),
    content_language: "English",
    status: "draft" as ContentStatus,
    workspace_id: workspaceId ?? undefined,
    introduction:
      allContent?.introduction || allContent?.meta_description || "",
    body_markdown: body,
    body_html: allContent?.body_html || allContent?.html_content || "",
    tags: tags,
    seo_data: {
      meta_title: allContent?.meta_title || displayTitle,
      meta_description: allContent?.meta_description || "",
      focus_keyphrase: allContent?.focus_keyphrase || userKeyword,
      keyphrase_density: allContent?.keyphrase_density || 1,
      secondary_keywords: allContent?.secondary_keywords || [],
      search_intent: ["informational"],
      seo_score: seoScore?.seo_health_score || 0,
      readability_score: score,
      content_primary_keywords: [
        allContent?.focus_keyphrase || userKeyword,
      ].filter(Boolean),
      content_meta_description: allContent?.meta_description || "",
      seo_details: JSON.stringify(seoScore || {}),
      trust_score: trustScore?.score || 0,
    },
    // media_items: fc?.images?.map(img => ({
    //   media_id: img.media_id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-0000-0000-000000000000"),
    //   alt_text: img.alt_text,
    //   context: img.context,
    //   placement: img.placement
    // })) || [],
    // images_data: {
    //   images: fc?.images || []
    // },
    // links_data: {
    //   internal: fc?.internal_links || [],
    //   outbound: fc?.outbound_links || []
    // },
    // schema_markup: fc?.schema_markup || {},
    media_items: [],
    images_data: {},
    links_data: {},
    schema_markup: {},
  });

  const publishContent = async () => {
    if (!isFinal) return;
    if (!workspaceId) return;
    try {
      setIsPublishing(true);
      let response: { message?: string } | undefined;
      if (contentSavedId) {
        response = await apiClient.content.publish(
          workspaceId,
          getContentPayload(),
          contentSavedId,
        );
      } else {
        response = await apiClient.content.save_publish(
          workspaceId,
          getContentPayload(),
        );
      }
      setStatusModal({
        isOpen: true,
        type: "success",
        action: "publish",
        message:
          response?.message ||
          "Your content has been published as a draft and is ready for review.",
      });
    } catch (error) {
      const err = error as Error;
      const msg = err.message || "Failed to publish content. Please try again.";
      if (
        err.message ===
        "No active WordPress sites found in this workspace. Please connect a site before publishing."
      ) {
        setIntegrationModalOpen(true);
      }
      setStatusModal({
        isOpen: true,
        type: "error",
        action: "publish",
        message: msg,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const saveContent = async () => {
    if (!isFinal) return;
    if (!workspaceId) return;
    try {
      setIsSaving(true);
      let response: { message?: string; id?: string } | undefined;
      if (contentSavedId) {
        response = await apiClient.content.update(
          workspaceId,
          contentSavedId,
          getContentPayload(),
        );
      } else {
        response = await apiClient.content.save(
          workspaceId,
          getContentPayload(),
        );

        setContentSavedId(response.id);
      }
      setStatusModal({
        isOpen: true,
        type: "success",
        action: "save",
        message:
          response.message ||
          "Your changes have been saved successfully to the workspace.",
      });
    } catch (error) {
      const err = error as Error;
      setStatusModal({
        isOpen: true,
        type: "error",
        action: "save",
        message: err.message || "Failed to save content. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchIntegrations = useCallback(async () => {
    if (!workspaceId) return;
    try {
      await integrationsApiService.listIntegrations(workspaceId);
    } catch (error) {
      log.error("Failed to fetch integrations", error);
    } finally {
    }
  }, [workspaceId]);

  const handleIntegrationAdded = async () => {
    await fetchIntegrations();
    publishContent();
    setIntegrationModalOpen(false);
  };

  const handleCopy = async (format: "formatted" | "markdown" | "html") => {
    try {
      const htmlContent = `<h1>${displayTitle}</h1><p><em>${allContent?.introduction || ""}</em></p>${previewHtml}`;

      if (format === "html") {
        await navigator.clipboard.writeText(htmlContent);
      } else if (format === "markdown") {
        const mdIntro = allContent?.introduction ? `\n\n*${allContent.introduction}*\n` : "";
        const contentToCopy = `# ${displayTitle}${mdIntro}\n${body}`;
        await navigator.clipboard.writeText(contentToCopy);
      } else {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const textBody = tempDiv.textContent || tempDiv.innerText || "";
        
        const clipboardItem = new ClipboardItem({
          "text/plain": new Blob([textBody], { type: "text/plain" }),
          "text/html": new Blob([htmlContent], { type: "text/html" }),
        });
        await navigator.clipboard.write([clipboardItem]);
      }
      
      setStatusModal({
        isOpen: true,
        type: "success",
        action: "copy",
        message: `Content copied to clipboard as ${format.toUpperCase()}`,
      });
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        action: "copy",
        message: "Failed to copy content to clipboard",
      });
    }
  };

  !body && (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-4/6" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 bg-background flex flex-col -mt-9 border-t relative">
      <div className="flex flex-1 relative border-b border-border">
        {/* Left Sidebar: Outline (never render inside editor body) */}
        {sidebarSections.length > 0 && (
          <aside className="hidden lg:flex w-56 border-r border-border bg-sidebar/50 flex-col py-8 mt-1.5 shrink-0 overflow-y-auto sticky top-[74px] max-h-[calc(100vh-72px)] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <div className="px-6 space-y-8">
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
                  Structure
                </h3>
                <nav className="space-y-1">
                  {sidebarSections.map((sec, i) => (
                    <button
                      type="button"
                      key={`${sec.heading}-${i}`}
                      onClick={() => {
                        const id = slugify(sec.heading);
                        const element =
                          document.getElementById(id) ||
                          Array.from(
                            document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
                          ).find(
                            (h) =>
                              h.textContent
                                ?.trim()
                                .toLowerCase()
                                .includes(sec.heading.trim().toLowerCase()) ||
                              sec.heading
                                .trim()
                                .toLowerCase()
                                .includes(
                                  h.textContent?.trim().toLowerCase() || "",
                                ),
                          );

                        if (element) {
                          element.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm text-left cursor-pointer rounded-xl group transition-all duration-200 relative text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                    >
                      <span className="relative truncate leading-none">
                        {sec.heading}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main
          ref={scrollRef}
          className="flex-1 bg-background px-2 py-4 mt-2 scroll-smooth"
        >
          <article className="mx-5">
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
                    {displayTitle}
                  </h1>
                  <div className="min-h-[600px]">
                    <SafeLexicalEditor
                      key={`editor-${contentId ?? "new"}-${isEditing}`}
                      initialValue={body}
                      onChange={onContentChange}
                      toolbarClass="top-[80px] z-50"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {body ? (
                    <>
                      <div className="space-y-4 mb-8">
                        <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="bg-muted px-2 py-1 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
                          {typedTitle}
                        </h1>

                        {allContent?.introduction && (
                          <div className="text-xl text-muted-foreground leading-relaxed font-medium border-l-4 border-border pl-6 my-8 italic">
                            {typedIntro}
                          </div>
                        )}
                      </div>
                      <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
                        {isFinal ? (
                          <SafeLexicalEditor
                            key={`editor-preview-${contentId ?? "new"}`}
                            initialValue={body}
                            readOnly={true}
                          />
                        ) : (
                          <div
                            className="prose prose-slate dark:prose-invert prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {displayTitle ||
                      tags.length > 0 ||
                      allContent?.introduction ? (
                        <div className="space-y-4 mb-8">
                          <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {tags.slice(0, 6).map((t) => (
                              <span
                                key={t}
                                className="bg-muted px-2 py-1 rounded"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                          {displayTitle ? (
                            <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
                              {typedTitle}
                            </h1>
                          ) : (
                            <div className="h-8 bg-muted rounded w-3/4" />
                          )}
                          {allContent?.introduction ? (
                            <div className="text-xl text-muted-foreground leading-relaxed font-medium border-l-4 border-border pl-6 my-8 italic">
                              {typedIntro}
                            </div>
                          ) : (
                            <div className="h-4 bg-muted rounded w-5/6" />
                          )}
                        </div>
                      ) : (
                        <div className="h-8 bg-muted rounded w-3/4 mb-8" />
                      )}
                      <div className="space-y-3">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-5/6" />
                        <div className="h-4 bg-muted rounded w-4/6" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        </main>

        {/* Right Sidebar: Analysis */}
        <aside className="hidden xl:flex w-64 border-l border-border bg-sidebar/30 flex-col px-1.5 space-y-8 overflow-y-auto mt-2.5 sticky top-[78px] max-h-[calc(100vh-72px)] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          <div className="flex items-center justify-around px-2 gap-2 sticky top-0 bg-sidebar py-3 z-4">
            <Button
              variant="secondary"
              size="sm"
              className={`h-8 px-2! text-xs font-bold transition-all flex-1`}
              onClick={onEditToggle}
              disabled={!isFinal}
              title={isEditing ? "Exit Edit Mode" : "Edit Content"}
            >
              {isEditing ? <Eye size={14} /> : <Pencil size={14} />}{" "}
            </Button>
            <Button
              onClick={saveContent}
              disabled={!isFinal || isSaving || isPublishing}
              variant="secondary"
              size="sm"
              className={`h-8 px-2! text-xs font-bold transition-all flex-1`}
              title="Save Content"
            >
              <Save size={14} className={isSaving ? "animate-pulse" : ""} />{" "}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={!isFinal}
                  variant="secondary"
                  size="sm"
                  className={`h-8 px-2! text-xs font-bold transition-all flex-1`}
                  title="Copy Content"
                >
                  <Copy size={14} />{" "}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="center">
                <DropdownMenuLabel>Copy Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleCopy("html")}>
                  Copy as HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy("markdown")}>
                  Copy as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy("formatted")}>
                  Copy as Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={publishContent}
              disabled={!isFinal || isPublishing || isSaving}
              size="sm"
              className="h-8 px-2! text-xs font-bold flex-1"
              title="Publish Content"
            >
              <Send
                size={14}
                className={cn("", isPublishing ? "animate-pulse" : "")}
              />{" "}
            </Button>
          </div>
          {/* Status Modal (Unified Success/Error) */}
          <Dialog
            open={statusModal.isOpen}
            onOpenChange={(open) =>
              setStatusModal((prev) => ({ ...prev, isOpen: open }))
            }
          >
            <DialogContent className="sm:max-w-md bg-card border border-border shadow-2xl rounded-4xl p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    statusModal.type === "success"
                      ? "bg-emerald-500/10"
                      : "bg-red-500/10",
                  )}
                >
                  {statusModal.type === "success" ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                    {statusModal.type === "success"
                      ? `Content ${statusModal.action === "publish" ? "Published" : statusModal.action === "copy" ? "Copied" : "Saved"} Successfully!`
                      : `${statusModal.action === "publish" ? "Publish" : statusModal.action === "copy" ? "Copy" : "Save"} Failed`}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-base">
                    {statusModal.message}
                  </DialogDescription>
                </div>
                <Button
                  onClick={() =>
                    setStatusModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-2xl font-bold transition-all"
                >
                  {statusModal.type === "success"
                    ? "Great, thanks!"
                    : "Try Again"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <section className="space-y-4">
            {score ? (
              <>
                <div className="flex items-center gap-2 font-bold">
                  <Activity size={16} className="text-emerald-500" />
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground">
                    Performance & SEO
                  </h4>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border space-y-4">
                  <h4 className="text-lg font-bold text-foreground">
                    Readability
                  </h4>

                  <div className="space-y-2">
                    <div className={`text-xl font-bold ${color}`}>
                      {label} ({score.toFixed(1)})
                    </div>

                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all`}
                        style={{ width: progressWidth }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold">
                  <Activity size={16} className="text-muted-foreground/30" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border space-y-4">
                  <div className="h-5 bg-muted rounded w-28" />

                  <div className="space-y-2">
                    <div className="h-7 bg-muted rounded w-40" />

                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden" />
                  </div>
                </div>
              </div>
            )}
            {seoScore ? (
              <div className="bg-card p-6 rounded-3xl border border-border space-y-6">
                <h4 className="text-lg font-bold text-foreground">
                  On-Page SEO
                </h4>

                {/* Score */}
                <div className="flex items-center gap-6">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <title id="seo-health-score-title">
                        SEO health score: {seoScore.seo_health_score} percent
                      </title>
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-muted/30"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={226.2}
                        strokeDashoffset={
                          226.2 * (1 - seoScore.seo_health_score / 100)
                        }
                        strokeLinecap="round"
                        className="text-emerald-600 dark:text-emerald-500 transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-foreground">
                      {Math.round(seoScore.seo_health_score)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-lg font-bold text-foreground leading-tight">
                      {getSEOStatusText(seoScore.seo_health_score)}
                    </div>
                    {seoScore.issue_summary?.warnings ||
                      (seoScore.issue_summary?.errors && (
                        <div className="text-sm text-muted-foreground">
                          {seoScore.issue_summary?.warnings} warnings
                          <br />
                          {seoScore.issue_summary?.errors} errors
                        </div>
                      ))}
                  </div>
                </div>

                {/* Issues */}
                <div className="space-y-3 pt-2">
                  {seoScore.issues &&
                    seoScore.issues.length > 0 &&
                    seoScore.issues.map((issue: Issue) => {
                      const status = levelToStatus(issue.level);

                      return (
                        <div
                          key={issue.message}
                          className="flex items-center gap-3 text-sm"
                        >
                          {status === "success" ? (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-500 shrink-0"
                            />
                          ) : status === "warning" ? (
                            <AlertCircle
                              size={18}
                              className="text-orange-500 shrink-0"
                            />
                          ) : (
                            <AlertCircle
                              size={18}
                              className="text-muted-foreground shrink-0"
                            />
                          )}

                          <span className="leading-tight">{issue.message}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="bg-card p-6 rounded-3xl border border-border space-y-6">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-muted rounded-full" />
                      <div className="h-3 bg-muted rounded w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr />

            {trustScore ? (
              <>
                <div className="flex items-center gap-2 font-bold">
                  <Sparkles size={16} className="text-blue-500" />
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground">
                    EEAT Assistant
                  </h4>
                </div>

                <div className="bg-card p-6 rounded-3xl border border-border space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-foreground leading-tight">
                      Trust Score
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight">
                      {trustScore.score
                        ? trustScore.score
                        : trustScore.trust_score}
                      %
                    </span>
                    <TrendingUp
                      size={20}
                      className="text-emerald-500 shrink-0"
                    />
                  </div>

                  <div className="text-[13px] text-muted-foreground font-medium">
                    {trustScore.score
                      ? getStatusMessage(trustScore.score)
                      : getStatusMessage(trustScore.trust_score)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <hr />
                <div className="flex items-center gap-2 font-bold">
                  <Sparkles size={16} className="text-muted-foreground/50" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </>
            )}
          </section>
        </aside>
      </div>
      <AddIntegrationModal
        isOpen={integrationModalOpen}
        onClose={() => {
          setIntegrationModalOpen(false);
          setStatusModal((prev) => ({ ...prev, isOpen: false }));
        }}
        onAdd={handleIntegrationAdded}
      />
    </div>
  );
}

export const ContentEditor = memo(
  ContentEditorInner,
) as unknown as ComponentType<ContentEditorProps>;
ContentEditor.displayName = "ContentEditor";
