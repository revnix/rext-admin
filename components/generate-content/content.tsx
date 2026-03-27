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
  Copy,
  Eye,
  Pencil,
  Save,
  Send,
  Sparkles,
  List,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
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

// levelToStatus was unused and removed

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
  const workspaceId = useCurrentWorkspaceId();

  // State
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
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  // Derived Values
  const isFinal =
    !!allContent && !!readabilityScore && !!trustScore && !!seoScore;
  const tags = allContent?.tags || [];
  const displayTitle = allContent?.meta_title || "";
  const body = generatedContent;
  const previewHtml = body ? marked.parse(body) : "";
  const { displayed: typedTitle } = useTypewriter(displayTitle, { speed: 55 });
  const { displayed: typedIntro } = useTypewriter(
    allContent?.meta_description || "",
    {
      speed: 45,
    },
  );
  const score = readabilityScore?.flesch_reading_ease ?? 0;
  const { label, color, barColor } = getReadabilityMeta(score);
  const progressWidth = `${Math.round(Math.min(Math.max(score, 0), 100))}%`;

  const sidebarSections = useMemo(() => {
    if (!body) return outline?.sections || [];
    const matches = Array.from(body.matchAll(/^#{1,6}\s+(.*)$/gm));
    if (matches.length > 0) {
      return matches.map((m) => ({
        heading: m[1].trim(),
      }));
    }
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
      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top <= 200) {
          // You could set active section here if needed
        }
      }
    };
    container.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Actions
  const getContentPayload = () => ({
    title: displayTitle,
    slug: allContent?.slug || slugify(displayTitle),
    content_language: "English",
    status: "draft" as ContentStatus,
    workspace_id: workspaceId ?? undefined,
    introduction: allContent?.meta_description || "",
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
    media_items: [],
    images_data: {},
    links_data: {},
    schema_markup: {},
  });

  const publishContent = async () => {
    if (!isFinal || !workspaceId) return;
    try {
      setIsPublishing(true);
      const payload = getContentPayload();
      const response = contentSavedId
        ? await apiClient.content.publish(workspaceId, payload, contentSavedId)
        : await apiClient.content.save_publish(workspaceId, payload);

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
        message: err.message || "Failed to publish content. Please try again.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const saveContent = async () => {
    if (!isFinal || !workspaceId) return;
    try {
      setIsSaving(true);
      const payload = getContentPayload();
      const response = contentSavedId
        ? await apiClient.content.update(workspaceId, contentSavedId, payload)
        : await apiClient.content.save(workspaceId, payload);

      if (!contentSavedId && response.content?.id) {
        setContentSavedId(response.content.id);
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
    }
  }, [workspaceId]);

  const handleIntegrationAdded = async () => {
    await fetchIntegrations();
    publishContent();
    setIntegrationModalOpen(false);
  };

  const handleCopy = async (format: "formatted" | "markdown" | "html") => {
    try {
      const htmlContent = `<h1>${displayTitle}</h1><p><em>${allContent?.meta_description || ""}</em></p>${previewHtml}`;
      if (format === "html") {
        await navigator.clipboard.writeText(htmlContent);
      } else if (format === "markdown") {
        const mdIntro = allContent?.meta_description
          ? `\n\n*${allContent.meta_description}*\n`
          : "";
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
    } catch (_error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        action: "copy",
        message: "Failed to copy content to clipboard",
      });
    }
  };

  // Sidebar Layout Templates
  const structureSidebarContent = (
    <div className="px-6 py-6 space-y-8 h-full overflow-y-auto">
      <div>
        <h3 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
          Structure
        </h3>
        <nav className="space-y-1">
          {sidebarSections?.map((sec, i) => (
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
                        .includes(h.textContent?.trim().toLowerCase() || ""),
                  );

                if (element) {
                  element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  setIsStructureOpen(false);
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left cursor-pointer rounded-xl group transition-all duration-200 relative text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            >
              <span className="relative truncate leading-none">
                {sec.heading}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );

  const analysisSidebarContent = (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center justify-around px-2 gap-2 sticky top-0 bg-sidebar py-3 z-4 border-b border-border/50 lg:border-none">
        <Button
          variant="secondary"
          size="sm"
          className="h-8 px-2! text-xs font-bold transition-all flex-1"
          onClick={onEditToggle}
          disabled={!isFinal}
        >
          {isEditing ? <Eye size={14} /> : <Pencil size={14} />}
        </Button>
        <Button
          onClick={saveContent}
          disabled={!isFinal || isSaving || isPublishing}
          variant="secondary"
          size="sm"
          className="h-8 px-2! text-xs font-bold transition-all flex-1"
        >
          <Save size={14} className={isSaving ? "animate-pulse" : ""} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={!isFinal}
              variant="secondary"
              size="sm"
              className="h-8 px-2! text-xs font-bold transition-all flex-1"
            >
              <Copy size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="center">
            <DropdownMenuItem onClick={() => handleCopy("html")}>
              Copy HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy("markdown")}>
              Copy MD
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy("formatted")}>
              Copy Text
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          onClick={publishContent}
          disabled={!isFinal || isPublishing || isSaving}
          size="sm"
          className="h-8 px-2! text-xs font-bold flex-1"
        >
          <Send size={14} className={isPublishing ? "animate-pulse" : ""} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 py-6 space-y-8">
        {score ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold px-2">
              <Activity size={16} className="text-emerald-500" />
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground">
                Analysis
              </h4>
            </div>
            <div className="bg-card p-6 rounded-3xl border border-border">
              <h4 className="text-lg font-bold">Readability</h4>
              <div className={`text-xl font-bold ${color}`}>
                {label} ({score.toFixed(1)})
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${barColor}`}
                  style={{ width: progressWidth }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted animate-pulse rounded-2xl h-32" />
        )}

        {seoScore ? (
          <div className="bg-card p-6 rounded-3xl border border-border space-y-4 mx-0.5">
            <h4 className="text-lg font-bold">SEO Health</h4>
            <div className="text-3xl font-bold">
              {Math.round(seoScore.seo_health_score)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {getSEOStatusText(seoScore.seo_health_score)}
            </div>
            <div className="space-y-2 mt-4">
              {seoScore.issues?.map((issue: Issue) => (
                <div
                  key={issue.message}
                  className="flex gap-2 text-sm leading-tight"
                >
                  <AlertCircle
                    size={14}
                    className="shrink-0 mt-0.5 text-orange-500"
                  />
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted animate-pulse rounded-2xl h-32" />
        )}

        {trustScore && (
          <div className="bg-card p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-blue-500" />
              <h4 className="text-lg font-bold">EEAT Score</h4>
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {trustScore.score || trustScore.trust_score}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getStatusMessage(trustScore.score || trustScore.trust_score)}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 bg-background flex flex-col -mt-9 border-t relative">
      <div className="flex flex-1 relative border-b border-border">
        {/* Desktop Left Sidebar */}
        {sidebarSections && sidebarSections.length > 0 && (
          <aside className="hidden lg:flex w-56 border-r border-border bg-sidebar/50 flex-col mt-1.5 shrink-0 sticky top-[74px] max-h-[calc(100vh-72px)]">
            {structureSidebarContent}
          </aside>
        )}

        {/* Main Content Area */}
        <main
          ref={scrollRef}
          className="flex-1 bg-background px-2 py-4 mt-2 scroll-smooth"
        >
          <article className="mx-5">
            {!body ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            ) : (
              <div>
                {isEditing ? (
                  <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight mb-8">
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
                    <div className="space-y-4 mb-8">
                      <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {tags.map((t) => (
                          <span key={t} className="bg-muted px-2 py-1 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <h1 className="text-4xl font-bold tracking-tight leading-tight">
                        {typedTitle}
                      </h1>
                      {allContent?.meta_description && (
                        <div className="text-xl text-muted-foreground leading-relaxed font-medium border-l-4 border-border pl-6 my-8 italic">
                          {typedIntro}
                        </div>
                      )}
                    </div>
                    <div className="prose dark:prose-invert prose-lg max-w-none">
                      {isFinal ? (
                        <SafeLexicalEditor
                          key={`editor-preview-${contentId ?? "new"}`}
                          initialValue={body}
                          readOnly={true}
                        />
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        </main>

        {/* Desktop Right Sidebar */}
        <aside className="hidden xl:flex w-64 border-l border-border bg-sidebar/30 flex-col mt-2.5 sticky top-[78px] max-h-[calc(100vh-72px)]">
          {analysisSidebarContent}
        </aside>
      </div>

      {/* Mobile Responsive Drawers */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4 z-50 pointer-events-none px-4">
        {sidebarSections && sidebarSections.length > 0 && (
          <div className="lg:hidden pointer-events-auto">
            <Sheet open={isStructureOpen} onOpenChange={setIsStructureOpen}>
              <Button
                onClick={() => setIsStructureOpen(true)}
                className="rounded-full shadow-lg h-12 pr-6 pl-4 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/50"
              >
                <List size={18} />
                <span className="font-bold text-sm">Structure</span>
              </Button>
              <SheetContent side="left" className="p-0 w-80">
                <SheetHeader className="px-6 py-4 border-b">
                  <SheetTitle>Content Structure</SheetTitle>
                </SheetHeader>
                {structureSidebarContent}
              </SheetContent>
            </Sheet>
          </div>
        )}

        <div className="xl:hidden pointer-events-auto">
          <Sheet open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
            <Button
              onClick={() => setIsAnalysisOpen(true)}
              className="rounded-full shadow-lg h-12 pr-6 pl-4 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50"
            >
              <Activity size={18} />
              <span className="font-bold text-sm">Analysis</span>
            </Button>
            <SheetContent side="right" className="p-0 w-80">
              <SheetHeader className="px-6 py-4 border-b">
                <SheetTitle>SEO & Performance</SheetTitle>
              </SheetHeader>
              {analysisSidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AddIntegrationModal
        isOpen={integrationModalOpen}
        onClose={() => {
          setIntegrationModalOpen(false);
          setStatusModal((prev) => ({ ...prev, isOpen: false }));
        }}
        onAdd={handleIntegrationAdded}
      />

      <Dialog
        open={statusModal.isOpen}
        onOpenChange={(open) =>
          setStatusModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2">
            {statusModal.type === "success" ? (
              <span className="text-emerald-600">Success</span>
            ) : (
              <span className="text-destructive">Error</span>
            )}
          </DialogTitle>
          <DialogDescription>{statusModal.message}</DialogDescription>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() =>
                setStatusModal((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ContentEditor = memo(
  ContentEditorInner,
) as unknown as ComponentType<ContentEditorProps>;
ContentEditor.displayName = "ContentEditor";
