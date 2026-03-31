import Image from "next/image";
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
import type { ToolCall } from "@/components/generate-content/agent-feed";
import { Button } from "../ui/button";
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  Zap,
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

// Custom renderers: links open in new tab; images get fallback placeholder on error
marked.use({
  renderer: {
    link({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer" class="prose-link">${text}</a>`;
    },
    image({ href, title, text }) {
      const alt = text || title || "";
      const caption = title || text || "";
      const placeholder = `
        <div class="content-image-placeholder" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          <span>Image could not be loaded</span>
        </div>`;
      return `
        <figure class="content-image-figure">
          <img
            src="${href}"
            alt="${alt}"
            loading="lazy"
            class="content-image"
            onerror="this.closest('figure').classList.add('content-image-broken'); this.style.display='none';"
          />
          ${placeholder}
          ${caption ? `<figcaption class="content-image-caption">${caption}</figcaption>` : ""}
        </figure>`;
    },
  },
});

function InlineToolCard({ tc }: { tc: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = tc.status === "running";
  const Icon =
    tc.name.toLowerCase().includes("duck") ||
    tc.name.toLowerCase().includes("search")
      ? Search
      : Globe;
  const hasOutput = tc.status === "done" && !!tc.output;
  return (
    <div
      className={cn(
        "relative rounded-lg border overflow-hidden transition-colors",
        isRunning
          ? "bg-amber-500/5 border-amber-500/20"
          : "bg-emerald-500/4 border-emerald-500/15",
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5",
          isRunning ? "bg-amber-400" : "bg-emerald-500/60",
        )}
      />
      <div className="flex items-start gap-2 pl-3 pr-2.5 py-2">
        <div
          className={cn(
            "shrink-0 mt-0.5",
            isRunning ? "text-amber-500" : "text-emerald-500",
          )}
        >
          {isRunning ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <CheckCircle2 size={10} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <Icon size={8} className="text-muted-foreground/60 shrink-0" />
            <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-wider">
              Web Search
            </span>
          </div>
          <div className="text-[10px] text-foreground/70 leading-snug break-words">
            <span className="text-muted-foreground/40">"</span>
            {tc.query.length > 40 ? `${tc.query.slice(0, 40)}…` : tc.query}
            <span className="text-muted-foreground/40">"</span>
          </div>
          {tc.status === "done" && tc.resultCount !== undefined && (
            <div className="flex items-center justify-between mt-1">
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <Zap size={8} />
                {tc.resultCount} result{tc.resultCount !== 1 ? "s" : ""}
              </div>
              {hasOutput && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-[8px] text-muted-foreground/50 hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                  {expanded ? "hide" : "view"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {expanded && tc.output && (
        <div className="mx-2 mb-2 p-2 rounded-md bg-background/60 border border-border/40 text-[9px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          {tc.output}
        </div>
      )}
    </div>
  );
}

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

type PipelineStep = { label: string; status: "pending" | "active" | "done" };

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
  // Agent activity (shown in right sidebar while generating)
  toolCalls?: ToolCall[];
  pipelineSteps?: PipelineStep[];
  /** When true, shows the content blurred with a humanizing overlay */
  isHumanizing?: boolean;
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
    toolCalls = [],
    pipelineSteps = [],
    isHumanizing = false,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isFinal =
    !!allContent && !!readabilityScore && !!trustScore && !!seoScore;
  const tags = allContent?.tags || [];
  const displayTitle = allContent?.title || "";
  const body = generatedContent;
  const previewHtml = useMemo(() => {
    if (!body) return "";
    const result = marked.parse(body);
    return typeof result === "string" ? result : "";
  }, [body]);
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

  // ── Image & Source editor ─────────────────────────────────────────────
  type ImageEntry = { alt: string; url: string; raw: string };
  type SourceEntry = { text: string; url: string; raw: string };

  const parsedImages = useMemo<ImageEntry[]>(() => {
    if (!body) return [];
    return [...body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map((m) => ({
      alt: m[1],
      url: m[2],
      raw: m[0],
    }));
  }, [body]);

  const parsedSources = useMemo<SourceEntry[]>(() => {
    if (!body) return [];
    return [...body.matchAll(/(?<!!)\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({
      text: m[1],
      url: m[2],
      raw: m[0],
    }));
  }, [body]);

  const [editingImage, setEditingImage] = useState<{
    index: number;
    alt: string;
    url: string;
  } | null>(null);
  const [editingSource, setEditingSource] = useState<{
    index: number;
    text: string;
    url: string;
  } | null>(null);
  const [newImage, setNewImage] = useState<{ alt: string; url: string } | null>(
    null,
  );
  const [newSource, setNewSource] = useState<{
    text: string;
    url: string;
  } | null>(null);

  const applyImageEdit = useCallback(
    (index: number, newAlt: string, newUrl: string) => {
      const old = parsedImages[index];
      if (!old || !body) return;
      onContentChange(body.replace(old.raw, `![${newAlt}](${newUrl})`));
      setEditingImage(null);
    },
    [parsedImages, body, onContentChange],
  );

  const removeImage = useCallback(
    (index: number) => {
      const old = parsedImages[index];
      if (!old || !body) return;
      onContentChange(body.replace(old.raw, ""));
    },
    [parsedImages, body, onContentChange],
  );

  const addImage = useCallback(
    (alt: string, url: string) => {
      if (!url.trim()) return;
      onContentChange(`${body ?? ""}\n\n![${alt}](${url})\n`);
      setNewImage(null);
    },
    [body, onContentChange],
  );

  const applySourceEdit = useCallback(
    (index: number, newText: string, newUrl: string) => {
      const old = parsedSources[index];
      if (!old || !body) return;
      onContentChange(body.replace(old.raw, `[${newText}](${newUrl})`));
      setEditingSource(null);
    },
    [parsedSources, body, onContentChange],
  );

  const removeSource = useCallback(
    (index: number) => {
      const old = parsedSources[index];
      if (!old || !body) return;
      // Replace the link with just its text (unlinks it)
      onContentChange(body.replace(old.raw, old.text));
    },
    [parsedSources, body, onContentChange],
  );

  const addSource = useCallback(
    (text: string, url: string) => {
      if (!url.trim() || !text.trim()) return;
      onContentChange(`${body ?? ""}\n\n[${text}](${url})\n`);
      setNewSource(null);
    },
    [body, onContentChange],
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
      let currentSectionIdx = -1;
      void currentSectionIdx;

      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        // The container's top is roughly its position in viewport
        // We use a 160px buffer for the sticky-like offset
        if (rect.top <= 200) {
          currentSectionIdx = i;
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
        const mdIntro = allContent?.introduction
          ? `\n\n*${allContent.introduction}*\n`
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
          <aside className="hidden lg:flex w-60 border-r border-border/50 bg-sidebar/20 flex-col mt-1.5 shrink-0 overflow-y-auto sticky top-[74px] max-h-[calc(100vh-72px)] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <div className="px-3 py-4">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black text-muted-foreground/35 uppercase tracking-[0.2em]">
                  Structure
                </span>
                {!isFinal && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="text-[9px] text-amber-500/80 font-bold leading-none">
                      Live
                    </span>
                  </div>
                )}
              </div>
              <nav className="space-y-0.5">
                {sidebarSections.map((sec, i) => {
                  const sectionWritten = body
                    ? body
                        .toLowerCase()
                        .includes(sec.heading.toLowerCase().slice(0, 12))
                    : false;
                  return (
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
                        "w-full flex items-center gap-2.5 px-2.5 py-2.5 text-left cursor-pointer rounded-lg group transition-all duration-200 relative",
                        sectionWritten
                          ? "text-foreground/75 hover:bg-muted/50 hover:text-foreground"
                          : "text-muted-foreground/30 hover:text-muted-foreground/50",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px] font-bold tabular-nums shrink-0 w-5 text-right leading-none transition-colors",
                          sectionWritten
                            ? "text-primary/50"
                            : "text-muted-foreground/20",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="relative truncate text-[12px] font-medium leading-snug flex-1">
                        {sec.heading}
                      </span>
                      {!isFinal && !sectionWritten && (
                        <span className="shrink-0 w-1 h-1 rounded-full bg-muted-foreground/20" />
                      )}
                      {sectionWritten && (
                        <CheckCircle2
                          size={10}
                          className="shrink-0 text-emerald-500/60"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main
          ref={scrollRef}
          className="flex-1 bg-background px-2 py-4 mt-2 scroll-smooth"
        >
          <article className="mx-auto max-w-3xl px-4 pb-16">
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
                <div className="w-full relative">
                  {/* ── Humanizing overlay ──────────────────────────────── */}
                  {isHumanizing && body && (
                    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-xl">
                      {/* blur mask */}
                      <div className="absolute inset-0 backdrop-blur-[3px] bg-background/30" />
                      {/* diagonal repeating label */}
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <div
                          className="select-none"
                          style={{
                            transform: "rotate(-35deg)",
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "2.5rem 3rem",
                            opacity: 0.12,
                          }}
                        >
                          {Array.from({ length: 15 }).map((_, i) => (
                            <span
                              // biome-ignore lint/suspicious/noArrayIndexKey: decorative
                              key={i}
                              className="text-[22px] font-black tracking-[0.18em] uppercase text-foreground whitespace-nowrap"
                            >
                              Humanizing
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* animated bottom bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/30 overflow-hidden">
                        <div className="h-full w-1/3 bg-primary animate-[shimmer_1.4s_ease-in-out_infinite]" />
                      </div>
                    </div>
                  )}
                  {body ? (
                    <>
                      <div className="space-y-4 mb-8">
                        <div className="flex flex-wrap gap-2">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800/70 px-3 py-1 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
                          {typedTitle}
                        </h1>

                        {allContent?.introduction && (
                          <div className="text-base text-foreground/70 dark:text-foreground/60 leading-[1.85] font-normal border-l-[3px] border-primary/40 pl-6 my-8 italic py-1">
                            {typedIntro}
                          </div>
                        )}
                      </div>
                      <div
                        className="blog-content prose prose-slate dark:prose-invert prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </>
                  ) : (
                    <div className="space-y-8 py-2">
                      {/* Generating status banner */}
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/50">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin shrink-0" />
                        <div>
                          <p className="text-[12px] font-semibold text-foreground/80">
                            Generating your article…
                          </p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                            AI is researching and writing. This may take a
                            minute.
                          </p>
                        </div>
                      </div>
                      {/* Tags skeleton or real tags */}
                      <div className="flex flex-wrap gap-2">
                        {tags.length > 0 ? (
                          tags.slice(0, 6).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800/70 px-3 py-1 rounded-full"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <>
                            <div className="skeleton-shimmer h-5 w-16 rounded-md" />
                            <div
                              className="skeleton-shimmer h-5 w-20 rounded-md"
                              style={{ animationDelay: "0.1s" }}
                            />
                            <div
                              className="skeleton-shimmer h-5 w-14 rounded-md"
                              style={{ animationDelay: "0.2s" }}
                            />
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <div className="space-y-3">
                        {displayTitle ? (
                          <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
                            {typedTitle}
                          </h1>
                        ) : (
                          <div className="space-y-2">
                            <div className="skeleton-shimmer h-9 rounded-xl w-4/5" />
                            <div
                              className="skeleton-shimmer h-9 rounded-xl w-3/5"
                              style={{ animationDelay: "0.15s" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Introduction */}
                      {allContent?.introduction ? (
                        <div className="text-base text-foreground/70 dark:text-foreground/60 leading-[1.85] font-normal border-l-[3px] border-primary/40 pl-6 py-1 italic">
                          {typedIntro}
                        </div>
                      ) : (
                        <div className="border-l-4 border-primary/15 pl-6 space-y-2.5">
                          <div className="skeleton-shimmer h-4 rounded-lg w-full" />
                          <div
                            className="skeleton-shimmer h-4 rounded-lg w-11/12"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="skeleton-shimmer h-4 rounded-lg w-4/5"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      )}

                      {/* Content section skeletons */}
                      {[
                        {
                          id: "sk0",
                          h: "w-2/5",
                          lines: [
                            { id: "a", w: "w-full", pos: 0 },
                            { id: "b", w: "w-11/12", pos: 1 },
                            { id: "c", w: "w-4/5", pos: 2 },
                            { id: "d", w: "w-3/4", pos: 3 },
                          ],
                          delay: 0,
                        },
                        {
                          id: "sk1",
                          h: "w-1/3",
                          lines: [
                            { id: "a", w: "w-full", pos: 0 },
                            { id: "b", w: "w-5/6", pos: 1 },
                            { id: "c", w: "w-full", pos: 2 },
                            { id: "d", w: "w-2/3", pos: 3 },
                          ],
                          delay: 0.05,
                        },
                        {
                          id: "sk2",
                          h: "w-2/5",
                          lines: [
                            { id: "a", w: "w-full", pos: 0 },
                            { id: "b", w: "w-11/12", pos: 1 },
                            { id: "c", w: "w-3/4", pos: 2 },
                          ],
                          delay: 0.1,
                        },
                      ].map((section) => (
                        <div key={section.id} className="space-y-3 pt-2">
                          <div
                            className={`skeleton-shimmer h-5 rounded-lg ${section.h}`}
                            style={{ animationDelay: `${section.delay}s` }}
                          />
                          <div className="space-y-2">
                            {section.lines.map((line) => (
                              <div
                                key={`${section.id}-${line.id}`}
                                className={`skeleton-shimmer h-3.5 rounded-md ${line.w}`}
                                style={{
                                  animationDelay: `${section.delay + line.pos * 0.06}s`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        </main>

        {/* Right Sidebar: Analysis */}
        <aside className="hidden xl:flex w-64 border-l border-border bg-sidebar/30 flex-col px-1.5 space-y-8 overflow-y-auto mt-2.5 sticky top-[78px] max-h-[calc(100vh-72px)] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm border-b border-border/40 px-3 pt-3 pb-2.5 z-10 space-y-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-black text-muted-foreground/35 uppercase tracking-[0.2em]">
                Actions
              </span>
              {isFinal && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-[9px] text-emerald-500/80 font-bold leading-none">
                    Ready
                  </span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-semibold gap-1.5 border-border/50 hover:bg-accent/30 transition-all"
                onClick={onEditToggle}
                disabled={!isFinal}
                title={isEditing ? "Exit Edit Mode" : "Edit Content"}
              >
                {isEditing ? <Eye size={12} /> : <Pencil size={12} />}
                {isEditing ? "Preview" : "Edit"}
              </Button>
              <Button
                onClick={saveContent}
                disabled={!isFinal || isSaving || isPublishing}
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-semibold gap-1.5 border-border/50 hover:bg-accent/30 transition-all"
                title="Save Content"
              >
                <Save size={12} className={isSaving ? "animate-pulse" : ""} />
                {isSaving ? "Saving…" : "Save"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={!isFinal}
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] font-semibold gap-1.5 border-border/50 hover:bg-accent/30 transition-all w-full"
                    title="Copy Content"
                  >
                    <Copy size={12} />
                    Copy
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
                className="h-8 text-[11px] font-semibold gap-1.5 transition-all"
                title="Publish Content"
              >
                <Send
                  size={12}
                  className={cn("", isPublishing ? "animate-pulse" : "")}
                />
                {isPublishing ? "Publishing…" : "Publish"}
              </Button>
            </div>
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
            {/* ── Agent Activity Feed (shown while generating) ───────────── */}
            {!isFinal && (pipelineSteps.length > 0 || toolCalls.length > 0) && (
              <div className="space-y-3 pb-2">
                {/* Header */}
                <div className="flex items-center gap-2 pt-0.5 pb-0.5">
                  <div className="relative shrink-0">
                    <Bot size={13} className="text-primary" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 flex-1">
                    Agent Activity
                  </h4>
                  <span className="text-[9px] bg-amber-400/10 text-amber-500 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold border border-amber-400/20">
                    Live
                  </span>
                </div>

                {/* Pipeline steps with connecting lines */}
                {pipelineSteps.length > 0 && (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                      <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
                        Pipeline
                      </span>
                    </div>
                    <div className="p-3 space-y-0 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                      {pipelineSteps.map((step, idx) => (
                        <div
                          key={step.label}
                          className="flex items-stretch gap-2.5"
                        >
                          {/* Left timeline */}
                          <div className="flex flex-col items-center w-3 shrink-0">
                            <div
                              className={cn(
                                "w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-0.5 z-10 transition-all duration-300",
                                step.status === "done"
                                  ? "bg-emerald-500 border-emerald-500"
                                  : step.status === "active"
                                    ? "bg-amber-400 border-amber-400 shadow-[0_0_6px_hsl(var(--amber-400)/0.5)]"
                                    : "bg-transparent border-border/60",
                              )}
                            >
                              {step.status === "active" && (
                                <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-60" />
                              )}
                            </div>
                            {idx < pipelineSteps.length - 1 && (
                              <div
                                className={cn(
                                  "w-px flex-1 mt-0.5 mb-0.5 min-h-[12px] transition-colors duration-500",
                                  step.status === "done"
                                    ? "bg-emerald-500/40"
                                    : "bg-border/40",
                                )}
                              />
                            )}
                          </div>
                          {/* Label */}
                          <div
                            className={cn(
                              "flex-1 pb-2.5 pt-0.5",
                              idx === pipelineSteps.length - 1 && "pb-0",
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              {step.status === "active" && (
                                <Loader2
                                  size={9}
                                  className="text-amber-500 animate-spin shrink-0"
                                />
                              )}
                              <span
                                className={cn(
                                  "text-[11px] leading-tight transition-all duration-200",
                                  step.status === "done"
                                    ? "text-muted-foreground/40 line-through"
                                    : step.status === "active"
                                      ? "text-foreground font-semibold"
                                      : "text-muted-foreground/30",
                                )}
                              >
                                {step.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tool call research feed */}
                {toolCalls.length > 0 && (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-3 py-2 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
                        Research
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          {toolCalls.filter((t) => t.status === "done").length}
                        </div>
                        <div className="text-[9px] text-muted-foreground/40">
                          /
                        </div>
                        <div className="text-[9px] text-muted-foreground/60">
                          {toolCalls.length}
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                      {toolCalls.map((tc) => (
                        <InlineToolCard key={tc.id} tc={tc} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Metrics (shown once generation is complete) ─────────────── */}
            {score ? (
              <>
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
                    Performance & SEO
                  </h4>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border/50 space-y-4">
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
            ) : null}

            {seoScore ? (
              <div className="bg-card p-5 rounded-xl border border-border/50 space-y-6">
                <h4 className="text-lg font-bold text-foreground">
                  On-Page SEO
                </h4>

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
                    seoScore.issue_summary?.errors ? (
                      <div className="text-sm text-muted-foreground">
                        {seoScore.issue_summary?.warnings} warnings
                        <br />
                        {seoScore.issue_summary?.errors} errors
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {seoScore.issues?.length > 0 &&
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
                          ) : (
                            <AlertCircle
                              size={18}
                              className={
                                status === "warning"
                                  ? "text-orange-500 shrink-0"
                                  : "text-muted-foreground shrink-0"
                              }
                            />
                          )}
                          <span className="leading-tight">{issue.message}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : null}

            {trustScore ? (
              <>
                <hr />
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
                    EEAT Assistant
                  </h4>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border/50 space-y-4">
                  <h4 className="text-lg font-bold text-foreground leading-tight">
                    Trust Score
                  </h4>
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
                    {getStatusMessage(
                      trustScore.score ?? trustScore.trust_score,
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {/* ── Images Manager ───────────────────────────────────────── */}
            {isFinal && (
              <>
                <hr />
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-violet-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
                    Images
                  </h4>
                </div>

                <div className="bg-card rounded-3xl border border-border overflow-hidden">
                  <div className="space-y-0">
                    {parsedImages.length === 0 && (
                      <p className="text-xs text-muted-foreground px-4 py-4">
                        No images in the article yet.
                      </p>
                    )}
                    {parsedImages.map((img, i) => (
                      <div
                        key={`${img.raw}-${i}`}
                        className="border-b border-border last:border-0"
                      >
                        {editingImage?.index === i ? (
                          <div className="p-3 space-y-2">
                            <input
                              className="w-full h-7 rounded-lg bg-muted border border-border text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Alt text"
                              value={editingImage.alt}
                              onChange={(e) =>
                                setEditingImage((prev) =>
                                  prev
                                    ? { ...prev, alt: e.target.value }
                                    : prev,
                                )
                              }
                            />
                            <input
                              className="w-full h-7 rounded-lg bg-muted border border-border text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Image URL"
                              value={editingImage.url}
                              onChange={(e) =>
                                setEditingImage((prev) =>
                                  prev
                                    ? { ...prev, url: e.target.value }
                                    : prev,
                                )
                              }
                            />
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="h-6 text-[11px] flex-1"
                                onClick={() =>
                                  applyImageEdit(
                                    i,
                                    editingImage.alt,
                                    editingImage.url,
                                  )
                                }
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[11px]"
                                onClick={() => setEditingImage(null)}
                              >
                                <X size={11} />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2">
                            <div className="w-8 h-8 rounded-lg bg-muted border border-border shrink-0 overflow-hidden flex items-center justify-center">
                              <Image
                                src={img.url}
                                alt={img.alt || "CMS image"}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                                unoptimized
                                onError={(e) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                }}
                              />
                            </div>
                            <span className="flex-1 text-xs text-foreground truncate min-w-0">
                              {img.alt || (
                                <span className="text-muted-foreground italic">
                                  No alt text
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                title="Open image"
                                className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(img.url, "_blank")}
                              >
                                <ExternalLink size={11} />
                              </button>
                              <button
                                type="button"
                                title="Edit image"
                                className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  setEditingImage({
                                    index: i,
                                    alt: img.alt,
                                    url: img.url,
                                  })
                                }
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                type="button"
                                title="Remove image"
                                className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                                onClick={() => removeImage(i)}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add new image */}
                    {newImage ? (
                      <div className="p-3 space-y-2 border-t border-border">
                        <input
                          className="w-full h-7 rounded-lg bg-muted border border-border text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Alt text"
                          value={newImage.alt}
                          onChange={(e) =>
                            setNewImage((prev) =>
                              prev ? { ...prev, alt: e.target.value } : prev,
                            )
                          }
                        />
                        <input
                          className="w-full h-7 rounded-lg bg-muted border border-border text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Image URL (https://...)"
                          value={newImage.url}
                          onChange={(e) =>
                            setNewImage((prev) =>
                              prev ? { ...prev, url: e.target.value } : prev,
                            )
                          }
                        />
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-6 text-[11px] flex-1"
                            onClick={() => addImage(newImage.alt, newImage.url)}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[11px]"
                            onClick={() => setNewImage(null)}
                          >
                            <X size={11} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-full flex items-center gap-1.5 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border"
                        onClick={() => setNewImage({ alt: "", url: "" })}
                      >
                        <Plus size={12} />
                        Add image
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Sources Manager ──────────────────────────────────────── */}
            {isFinal && (
              <>
                <hr />
                <div className="flex items-center gap-2">
                  <Link2 size={16} className="text-sky-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
                    Sources
                  </h4>
                </div>

                <div className="bg-card rounded-3xl border border-border overflow-hidden">
                  <div className="space-y-0">
                    {parsedSources.length === 0 && (
                      <p className="text-xs text-muted-foreground px-4 py-4">
                        No citations in the article yet.
                      </p>
                    )}
                    {parsedSources.map((src, i) => (
                      <div
                        key={`${src.raw}-${i}`}
                        className="border-b border-border last:border-0"
                      >
                        {editingSource?.index === i ? (
                          <div className="p-3 space-y-2">
                            <input
                              className="w-full h-7 rounded-lg bg-muted border border-border text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                              placeholder="Link text"
                              value={editingSource.text}
                              onChange={(e) =>
                                setEditingSource((prev) =>
                                  prev
                                    ? { ...prev, text: e.target.value }
                                    : prev,
                                )
                              }
                            />
                            <input
                              className="w-full h-7 rounded-lg bg-muted border border-border text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                              placeholder="URL (https://...)"
                              value={editingSource.url}
                              onChange={(e) =>
                                setEditingSource((prev) =>
                                  prev
                                    ? { ...prev, url: e.target.value }
                                    : prev,
                                )
                              }
                            />
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="h-6 text-[11px] flex-1"
                                onClick={() =>
                                  applySourceEdit(
                                    i,
                                    editingSource.text,
                                    editingSource.url,
                                  )
                                }
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[11px]"
                                onClick={() => setEditingSource(null)}
                              >
                                <X size={11} />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2">
                            <div className="w-5 h-5 rounded bg-sky-500/10 flex items-center justify-center shrink-0">
                              <Link2 size={10} className="text-sky-500" />
                            </div>
                            <span className="flex-1 text-xs text-foreground truncate min-w-0">
                              {src.text}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                title="Open source"
                                className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(src.url, "_blank")}
                              >
                                <ExternalLink size={11} />
                              </button>
                              <button
                                type="button"
                                title="Edit source"
                                className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  setEditingSource({
                                    index: i,
                                    text: src.text,
                                    url: src.url,
                                  })
                                }
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                type="button"
                                title="Remove source"
                                className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                                onClick={() => removeSource(i)}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add new source */}
                    {newSource ? (
                      <div className="p-3 space-y-2 border-t border-border">
                        <input
                          className="w-full h-7 rounded-lg bg-muted border border-border text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Link text"
                          value={newSource.text}
                          onChange={(e) =>
                            setNewSource((prev) =>
                              prev ? { ...prev, text: e.target.value } : prev,
                            )
                          }
                        />
                        <input
                          className="w-full h-7 rounded-lg bg-muted border border-border text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                          placeholder="URL (https://...)"
                          value={newSource.url}
                          onChange={(e) =>
                            setNewSource((prev) =>
                              prev ? { ...prev, url: e.target.value } : prev,
                            )
                          }
                        />
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-6 text-[11px] flex-1"
                            onClick={() =>
                              addSource(newSource.text, newSource.url)
                            }
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[11px]"
                            onClick={() => setNewSource(null)}
                          >
                            <X size={11} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-full flex items-center gap-1.5 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border"
                        onClick={() => setNewSource({ text: "", url: "" })}
                      >
                        <Plus size={12} />
                        Add source
                      </button>
                    )}
                  </div>
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
