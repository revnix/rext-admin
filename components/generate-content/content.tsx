import type { WordPressPostStatus } from "@/types/content";
import type {
  FinalContent,
  Outline,
  // ReadabilityMeta,
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
  ExternalLink,
  Clock,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp,
  Globe,
  Loader2,
  Pencil,
  Save,
  Search,
  Send,
  Sparkles,
  List,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { SafeLexicalEditor } from "../ui/safe-lexical-editor";
import { deriveImagesData } from "@/lib/content/image-data";
import { memo, useCallback, useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileQueries } from "@/lib/query-keys";
import { useTypewriter } from "@/hooks/use-typewriter";
import type { ComponentType } from "react";
import {
  useCurrentWorkspaceId,
  useCurrentWorkspaceSlug,
} from "@/stores/workspace/use-workspace-context-store";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { apiClient } from "@/lib/api-client";
import { AddIntegrationModal } from "@/app/w/[workspaceSlug]/integrations/add-integration-modal";
import { integrationsApiService } from "@/services/integrations-api";
import { log } from "@/lib/logger";
import { analytics } from "@/lib/analytics";
import { marked } from "marked";
import { cn } from "@/lib/utils";
import { excludeJsonLdFromSeoResult } from "@/lib/generate-content/seo-issues";
import { Skeleton } from "../ui/skeleton";

const TAG_SKELETON_KEYS = Array.from(
  { length: 5 },
  (_, i) => `tag-skeleton-${i + 1}`,
);

const CONTENT_SKELETON_KEYS = Array.from(
  { length: 3 },
  (_, i) => `content-skeleton-${i + 1}`,
);

const WORDPRESS_STATUS_DETAILS: Record<
  WordPressPostStatus,
  { label: string; successTitle: string; successMessage: string }
> = {
  publish: {
    label: "Publish",
    successTitle: "Content Published Successfully!",
    successMessage: "Your content is live on WordPress.",
  },
  draft: {
    label: "Draft",
    successTitle: "WordPress Draft Created!",
    successMessage: "Your content was saved as a draft in WordPress.",
  },
  pending: {
    label: "Review",
    successTitle: "Submitted for Review!",
    successMessage: "Your content is pending review in WordPress.",
  },
};

// Custom renderers: links open in new tab; images get fallback placeholder on error
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const languageClass = lang ? `language-${lang}` : "";
      const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      return `<div class="relative group my-6 rounded-xl overflow-hidden bg-[#0d1117] dark:bg-[#0d1117] border border-slate-800/80 shadow-sm">
        ${
          lang
            ? `<div class="flex items-center justify-between px-4 py-2 bg-slate-800/40 border-b border-slate-800/80">
                <span class="text-xs font-mono text-slate-400 font-medium">${lang}</span>
              </div>`
            : ""
        }
        <div class="px-4 py-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <pre class="!m-0 !p-0 !bg-transparent"><code class="${languageClass} text-[13px] leading-relaxed text-slate-200 font-mono tracking-wide">${escapedText}</code></pre>
        </div>
      </div>`;
    },
    link({
      href,
      title,
      text,
    }: {
      href: string;
      title?: string | null;
      text: string;
    }) {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    image({
      href,
      title,
      text,
    }: {
      href: string;
      title?: string | null;
      text: string;
    }) {
      const alt = text || title || "";
      const caption = title || text || "";
      const placeholder = `
        <div class="content-image-placeholder" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
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
          ? "bg-primary/5 border-primary/20"
          : "bg-primary/4 border-primary/15",
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5",
          isRunning ? "bg-primary" : "bg-primary/60",
        )}
      />
      <div className="flex items-start gap-2 pl-3 pr-2.5 py-2">
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
              <div className="text-[9px] px-1 text-primary dark:text-primary font-bold flex items-center gap-0.5">
                {tc.resultCount}&nbsp;result{tc.resultCount !== 1 ? "s" : ""}
              </div>
              {hasOutput && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="cursor-pointer text-[8px] text-muted-foreground/50 hover:text-foreground flex items-center gap-0.5 transition-colors"
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

// function getReadabilityMeta(score: number): ReadabilityMeta {
//   if (score >= 90) {
//     return {
//       label: "Very Easy",
//       color: "text-emerald-600",
//       barColor: "bg-emerald-500",
//     };
//   }

//   if (score >= 80) {
//     return {
//       label: "Easy",
//       color: "text-emerald-600",
//       barColor: "bg-emerald-500",
//     };
//   }

//   if (score >= 70) {
//     return {
//       label: "Fairly Easy",
//       color: "text-emerald-600",
//       barColor: "bg-emerald-500",
//     };
//   }

//   if (score >= 60) {
//     return {
//       label: "Standard",
//       color: "text-emerald-600",
//       barColor: "bg-emerald-500",
//     };
//   }

//   if (score >= 50) {
//     return {
//       label: "Fairly Difficult",
//       color: "text-yellow-600",
//       barColor: "bg-yellow-500",
//     };
//   }

//   if (score >= 30) {
//     return {
//       label: "Difficult",
//       color: "text-orange-600",
//       barColor: "bg-orange-500",
//     };
//   }

//   return {
//     label: "Very Confusing",
//     color: "text-red-600",
//     barColor: "bg-red-500",
//   };
// }

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
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

type PipelineStep = { label: string; status: "pending" | "active" | "done" };

type ContentEditorProps = {
  contentId?: string;
  /** LangGraph thread id — lets a manual Save reconcile to the row the
   *  generation graph already auto-saved (idempotent by thread on the backend). */
  threadId?: string;
  isEnhancing?: boolean;
  enhancingMsg?: string;
  enhancingDescription?: string;
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
};

function ContentEditorInner(props: ContentEditorProps) {
  const {
    contentId,
    threadId,
    isEnhancing,
    enhancingMsg,
    enhancingDescription,
    allContent,
    readabilityScore,
    trustScore,
    generatedContent,
    seoScore: rawSeoScore,
    isEditing,
    userKeyword,
    outline,
    onEditToggle,
    onContentChange,
    toolCalls = [],
    pipelineSteps = [],
  } = props;

  // JSON-LD is not part of content-level on-page SEO: hide those findings and
  // compensate the score. Idempotent — results the backend already filtered
  // pass through unchanged.
  const seoScore = useMemo(
    () => excludeJsonLdFromSeoResult(rawSeoScore),
    [rawSeoScore],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const isFinal =
    !!allContent && !!readabilityScore && !!trustScore && !!seoScore;
  const tags = allContent?.tags || [];
  // The article title is `title` -- the exact title the user selected, locked by
  // the backend. It used to read `meta_title`, a separately model-written SEO
  // field, so the editor showed (and Save/Publish/Schedule wrote back as the
  // article title) a different title from the one the user picked.
  const displayTitle = allContent?.title || allContent?.meta_title || "";
  const body = generatedContent;
  const previewHtml = useMemo(() => {
    if (!body) return "";
    const result = marked.parse(body);
    return typeof result === "string" ? result : "";
  }, [body]);
  const { displayed: typedTitle } = useTypewriter(displayTitle, { speed: 55 });
  const { displayed: typedIntro } = useTypewriter(
    allContent?.meta_description || "",
    {
      speed: 45,
    },
  );
  const score = readabilityScore?.flesch_reading_ease ?? 0;
  // const { label, color, barColor } = getReadabilityMeta(score);
  // const progressWidth = `${Math.min(Math.max(score, 0), 100).toFixed(1)}%`;
  const workspaceId = useCurrentWorkspaceId();
  const workspaceSlug = useCurrentWorkspaceSlug();
  const router = useRouter();
  const { hasPermission: canUpdate } = useWorkspacePermission(
    CONTENT_PERMISSIONS.UPDATE,
    workspaceId ?? undefined,
  );
  const { hasPermission: canPublish } = useWorkspacePermission(
    CONTENT_PERMISSIONS.PUBLISH,
    workspaceId ?? undefined,
  );
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // State
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    title: string;
    isOpen: boolean;
    type: "success" | "error";
    action: "publish" | "save" | "copy";
    message: string;
    showIntegrationLink?: boolean;
  }>({
    title: "",
    isOpen: false,
    type: "success",
    action: "publish",
    message: "",
    showIntegrationLink: false,
  });
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [contentSavedId, setContentSavedId] = useState<string | undefined>(
    contentId,
  );

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [selectedPublishStatus, setSelectedPublishStatus] =
    useState<WordPressPostStatus>("publish");
  const [pendingPublishStatus, setPendingPublishStatus] =
    useState<WordPressPostStatus>("publish");

  // Scheduling follows the account's timezone field (Profile settings) --
  // the backend converts wall-clock input using this same field, so
  // "today"/"now" here must be computed relative to it too, or the min-time
  // guard and the backend's idea of "in the past" would disagree. It's kept
  // in sync with the device's timezone automatically below.
  const queryClient = useQueryClient();
  const { data: accountProfile } = useQuery({ ...profileQueries.detail() });
  const accountTimezone = accountProfile?.timezone || "UTC";

  // The account timezone defaults to "UTC" for anyone who has never opened
  // Profile settings, which silently makes scheduled times land hours away
  // from what the user actually meant ("9:59 PM" typed on a laptop in
  // Karachi, but stored/interpreted as 9:59 PM UTC). The user's device
  // timezone is what they actually mean, so auto-sync the account field to
  // it the moment a mismatch is seen, rather than requiring a manual step.
  const browserTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const timezoneMismatch =
    !!accountProfile &&
    !!browserTimezone &&
    accountTimezone !== browserTimezone;

  const syncTimezoneMutation = useMutation({
    mutationFn: () => apiClient.profile.update({ timezone: browserTimezone }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueries.detail().queryKey,
      });
    },
  });

  // Auto-sync once per mismatch: fires when we first see accountTimezone !==
  // browserTimezone, and stops (via hasAttemptedAutoSyncRef) so a failed
  // update doesn't retry on every render — the banner below still offers a
  // manual retry in that case.
  const hasAttemptedAutoSyncRef = useRef(false);
  useEffect(() => {
    if (
      timezoneMismatch &&
      !hasAttemptedAutoSyncRef.current &&
      !syncTimezoneMutation.isPending
    ) {
      hasAttemptedAutoSyncRef.current = true;
      syncTimezoneMutation.mutate();
    }
    if (!timezoneMismatch) {
      hasAttemptedAutoSyncRef.current = false;
    }
  }, [
    timezoneMismatch,
    syncTimezoneMutation.isPending,
    syncTimezoneMutation.mutate,
  ]);

  const getPartsInTimezone = useCallback((date: Date, tz: string) => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = fmt.formatToParts(date);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";
    return {
      dateStr: `${get("year")}-${get("month")}-${get("day")}`,
      timeStr: `${get("hour")}:${get("minute")}`,
    };
  }, []);

  const { dateStr: accountTodayStr, timeStr: accountNowTimeStr } = useMemo(
    () => getPartsInTimezone(new Date(), accountTimezone),
    [getPartsInTimezone, accountTimezone],
  );

  const isDateDisabled = useCallback(
    (d: Date) => {
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return dStr < accountTodayStr;
    },
    [accountTodayStr],
  );

  const scheduleDateStr = scheduleDate
    ? `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, "0")}-${String(scheduleDate.getDate()).padStart(2, "0")}`
    : undefined;

  const isScheduleDateToday = scheduleDateStr === accountTodayStr;

  const minScheduleTime = isScheduleDateToday ? accountNowTimeStr : undefined;

  const isScheduleTimeInPast =
    isScheduleDateToday && scheduleTime < (minScheduleTime ?? "");

  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

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
      let currentSectionIdx = -1;
      void currentSectionIdx;

      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top <= 200) {
          currentSectionIdx = i;
        } else {
          break;
        }
      }
    };
    container.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // The editor writes through apiClient directly rather than the mutation
  // hooks in use-content.ts, so nothing invalidates the content cache — and
  // useContentDetail holds results for 5 minutes. Without this, navigating
  // back after a publish re-renders the pre-publish body and an image the user
  // removed reappears, ready to be published again.
  const invalidateContentCache = useCallback(() => {
    if (!workspaceId) return;
    queryClient.invalidateQueries({ queryKey: ["content", workspaceId] });
  }, [queryClient, workspaceId]);

  // Actions
  const getContentPayload = () => ({
    title: displayTitle,
    slug: allContent?.slug || slugify(displayTitle),
    content_language: "English",
    workspace_id: workspaceId ?? undefined,
    introduction: allContent?.meta_description || "",
    body_markdown: body,
    body_html:
      previewHtml || allContent?.body_html || allContent?.html_content || "",
    tags: tags,
    category: allContent?.category || undefined,
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
    // Derived from the body, so removing an image in the editor removes it
    // everywhere — including the WordPress featured image. Sending a hardcoded
    // {} here used to wipe the column instead of describing the current state.
    images_data: deriveImagesData(body),
    // media_items / links_data / schema_markup are deliberately not sent: the
    // editor is not their source of truth, and sending empty values deleted
    // every ContentMedia link and the AI-generated JSON-LD on each save.
    langgraph_thread_id: threadId,
  });

  const publishContent = async (
    selectedStatus: WordPressPostStatus = "publish",
  ) => {
    if (!isFinal || !workspaceId) return;
    setPendingPublishStatus(selectedStatus);
    const statusDetails = WORDPRESS_STATUS_DETAILS[selectedStatus];
    log.info("[WordPress Publish] Selected post status", {
      selected_status: selectedStatus,
      content_id: contentSavedId,
      workspace_id: workspaceId,
    });
    try {
      setIsPublishing(true);
      setStatusModal({
        title: "Checking for integrations...",
        isOpen: true,
        type: "success",
        action: "publish",
        message: "Looking for connected sites...",
      });
      await delay(1200);

      const integrationsData =
        await integrationsApiService.listIntegrations(workspaceId);

      if (integrationsData.length === 0) {
        setIntegrationModalOpen(true);
        return;
      } else {
        setStatusModal({
          title: `${statusDetails.label} Content...`,
          isOpen: true,
          type: "success",
          action: "publish",
          message: `Sending content to WordPress with status "${selectedStatus}"...`,
        });
        const cmsType = integrationsData[0]?.integration_type;
        analytics.track("cms_publish_attempted", {
          cms_type: cmsType,
          wordpress_status: selectedStatus,
          workspace_id: workspaceId ?? undefined,
          content_id: contentSavedId ?? undefined,
        });
        const payload = getContentPayload();
        if (contentSavedId) {
          // POST /content/{id}/publish accepts only site_id/status/scheduled_at;
          // the article in its request body is discarded and the backend
          // publishes the stored row. Persist the current editor state first, or
          // the publish ships whatever was saved last — including an image the
          // user has since removed.
          await apiClient.content.update(workspaceId, contentSavedId, payload);
        }
        const response = contentSavedId
          ? await apiClient.content.publish(
              workspaceId,
              payload,
              contentSavedId,
              selectedStatus,
            )
          : await apiClient.content.save_publish(
              workspaceId,
              payload,
              selectedStatus,
            );

        analytics.track("content_published", {
          title: displayTitle,
          keyword: userKeyword,
          workspace_id: workspaceId ?? undefined,
          content_id: contentSavedId ?? response?.id ?? undefined,
          seo_score: seoScore?.seo_health_score,
          wordpress_status: selectedStatus,
        });
        analytics.track("cms_publish_succeeded", {
          cms_type: cmsType,
          wordpress_status: selectedStatus,
          workspace_id: workspaceId ?? undefined,
          content_id: contentSavedId ?? response?.id ?? undefined,
        });
        invalidateContentCache();
        setStatusModal({
          title: statusDetails.successTitle,
          isOpen: true,
          type: "success",
          action: "publish",
          message: statusDetails.successMessage,
        });
      }
    } catch (error) {
      const err = error as Error;
      const errorMessage = err.message?.toLowerCase() ?? "";
      const isIntegrationIssue =
        errorMessage.includes("no active sites") ||
        errorMessage.includes("no active sites found") ||
        errorMessage.includes("please connect a site") ||
        errorMessage.includes("integration disabled") ||
        errorMessage.includes("disabled integration") ||
        errorMessage.includes("site is disabled") ||
        errorMessage.includes("inactive site");
      analytics.track("cms_publish_failed", {
        workspace_id: workspaceId ?? undefined,
        content_id: contentSavedId ?? undefined,
        wordpress_status: selectedStatus,
        error_message: err.message,
      });
      setStatusModal({
        title: isIntegrationIssue
          ? "Site Integration Not Connected"
          : "Failed to Publish Content",
        isOpen: true,
        type: "error",
        action: "publish",
        message: isIntegrationIssue
          ? "Your site integration is disabled or not connected. Please go to Integrations to enable it."
          : err.message || "Failed to publish content. Please try again.",
        showIntegrationLink: isIntegrationIssue,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const saveContent = async () => {
    if (!isFinal || !workspaceId) return;
    try {
      setIsSaving(true);
      setStatusModal({
        title: "Saving Content...",
        isOpen: true,
        type: "success",
        action: "save",
        message: "Saving content to your workspace...",
      });
      const payload = getContentPayload();
      const response = contentSavedId
        ? await apiClient.content.update(workspaceId, contentSavedId, payload)
        : await apiClient.content.save(workspaceId, payload);

      if (!contentSavedId && response.id) {
        setContentSavedId(response.id);
      }
      invalidateContentCache();
      setStatusModal({
        title: "Content Saved Successfully!",
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
        title: "Failed to Save Content",
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
    publishContent(pendingPublishStatus);
    setIntegrationModalOpen(false);
  };

  const scheduleContent = async () => {
    if (!isFinal || !workspaceId || !scheduleDate) return;
    try {
      setIsPublishing(true);
      setScheduleDialogOpen(false);
      // Naive local datetime (no offset) — the backend interprets this as
      // wall-clock time in the user's account timezone (accountTimezone),
      // not the browser's, so scheduling is consistent regardless of device.
      const scheduledAt = `${scheduleDateStr}T${scheduleTime}:00`;

      if (contentSavedId) {
        // Same as publish: the schedule endpoint publishes the stored row, so
        // the current editor state has to be saved before it is queued.
        await apiClient.content.update(
          workspaceId,
          contentSavedId,
          getContentPayload(),
        );
        await apiClient.content.schedule(
          workspaceId,
          contentSavedId,
          scheduledAt,
        );
      } else {
        const payload = getContentPayload();
        const response = await apiClient.content.saveAndSchedule(
          workspaceId,
          payload,
          scheduledAt,
        );
        if (response?.id) setContentSavedId(response.id);
      }
      analytics.track("content_scheduled", {
        title: displayTitle,
        keyword: userKeyword,
        workspace_id: workspaceId ?? undefined,
        content_id: contentSavedId ?? undefined,
        scheduled_at: scheduledAt,
      });
      invalidateContentCache();
      setStatusModal({
        title: "Content Scheduled!",
        isOpen: true,
        type: "success",
        action: "publish",
        message: `Content scheduled for ${scheduleTime} on ${scheduleDate.toLocaleDateString()} (${accountTimezone}).`,
      });
    } catch (error) {
      const err = error as Error;
      setStatusModal({
        title: "Failed to Schedule",
        isOpen: true,
        type: "error",
        action: "publish",
        message: err.message || "Failed to schedule content.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopy = async (format: "formatted" | "markdown" | "html") => {
    try {
      const htmlContent = `<h1>${displayTitle}</h1><p><em>${allContent?.meta_description || ""}</em></p>${previewHtml}`;
      if (format === "html") {
        await navigator.clipboard.writeText(htmlContent);
      } else if (format === "markdown") {
        const mdIntro = allContent?.meta_description
          ? `\n\n*${allContent?.meta_description}*\n`
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
        title: "Content Copied Successfully!",
        isOpen: true,
        type: "success",
        action: "copy",
        message: `Content copied to clipboard as ${format.toUpperCase()}`,
      });
    } catch (_error) {
      setStatusModal({
        title: "Failed to Copy Content",
        isOpen: true,
        type: "error",
        action: "copy",
        message: "Failed to copy content to clipboard",
      });
    }
  };

  const openPublishConfirmation = (status: WordPressPostStatus) => {
    setSelectedPublishStatus(status);
    setPublishConfirmOpen(true);
  };

  const analysisSidebarContent = (
    <div className="flex flex-col h-full bg-sidebar pb-20 sm:pb-0">
      <div className="flex items-center justify-around px-2 gap-2 sticky top-0 bg-sidebar py-3 z-4 border-b border-border/50 lg:border-none">
        <div className="flex-1">
          {canUpdate ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 px-2! text-xs font-bold transition-all flex-1 !w-full"
              onClick={onEditToggle}
              disabled={!isFinal}
            >
              {isEditing ? <Eye size={14} /> : <Pencil size={14} />}
            </Button>
          ) : (
            <LockedFeatureTooltip message="Editing requires Editor role or above">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 px-2! text-xs font-bold transition-all flex-1 !w-full"
                disabled
              >
                <Pencil size={14} />
              </Button>
            </LockedFeatureTooltip>
          )}
        </div>
        <div className="flex-1">
          {canUpdate ? (
            <Button
              onClick={saveContent}
              disabled={!isFinal || isSaving || isPublishing}
              variant="secondary"
              size="sm"
              className="h-8 px-2! text-xs font-bold transition-all !w-full"
            >
              <Save size={14} className={isSaving ? "animate-pulse" : ""} />
            </Button>
          ) : (
            <LockedFeatureTooltip message="Saving requires Editor role or above">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 px-2! text-xs font-bold transition-all !w-full"
                disabled
              >
                <Save size={14} />
              </Button>
            </LockedFeatureTooltip>
          )}
        </div>
        <div className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={!isFinal}
                variant="secondary"
                size="sm"
                className="h-8 px-2! text-xs font-bold transition-all !w-full"
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
        </div>
        <div className="flex-1">
          {canPublish ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 px-2! text-xs font-bold w-full! gap-1"
                >
                  <Send
                    size={14}
                    className={isPublishing ? "animate-pulse" : ""}
                  />
                  <ChevronDown size={11} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  disabled={!isFinal || isPublishing || isSaving}
                  onClick={() => openPublishConfirmation("publish")}
                >
                  <Send size={13} className="mr-2" />
                  Publish
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!isFinal || isPublishing || isSaving}
                  onClick={() => openPublishConfirmation("draft")}
                >
                  <Save size={13} className="mr-2" />
                  Save as Draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!isFinal || isPublishing || isSaving}
                  onClick={() => openPublishConfirmation("pending")}
                >
                  <Eye size={13} className="mr-2" />
                  Submit for Review
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!isFinal || isPublishing || isSaving}
                  onClick={() => setScheduleDialogOpen(true)}
                >
                  <Clock size={13} className="mr-2" />
                  Schedule for Later
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LockedFeatureTooltip message="Publishing requires Editor role or above">
              <Button
                size="sm"
                className="h-8 px-2! text-xs font-bold w-full!"
                disabled
              >
                <Send size={14} />
              </Button>
            </LockedFeatureTooltip>
          )}
        </div>
      </div>

      <section className="flex-1 overflow-y-auto px-1.5 pt-3 pb-6 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        {/* ── Agent Activity Feed (shown while generating) ───────────── */}
        {!isFinal && (pipelineSteps.length > 0 || toolCalls.length > 0) && (
          <div className="space-y-3 pb-2">
            {/* Header */}
            <div className="flex items-center gap-2 pt-0.5 pb-0.5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 flex-1">
                Agent Activity
              </h4>
            </div>

            {/* Pipeline steps with connecting lines */}
            {pipelineSteps.length > 0 && (
              <div className="bg-card p-5 rounded-xl border border-border/50 space-y-4">
                <h4 className="text-lg font-bold text-foreground">Pipeline</h4>
                <div className="space-y-0 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
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
                              ? "bg-primary border-primary"
                              : step.status === "active"
                                ? "bg-primary border-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                                : "bg-transparent border-border/60",
                          )}
                        ></div>
                        {idx < pipelineSteps.length - 1 && (
                          <div
                            className={cn(
                              "w-px flex-1 mt-0.5 mb-0.5 min-h-2 transition-colors duration-500",
                              step.status === "done"
                                ? "bg-primary/40"
                                : "bg-border/40",
                            )}
                          />
                        )}
                      </div>
                      {/* Label */}
                      <div
                        className={cn(
                          "flex-1 pb-2.5",
                          idx === pipelineSteps.length - 1 && "pb-0",
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {step.status === "active" && (
                            <Loader2
                              size={9}
                              className="text-primary animate-spin shrink-0"
                            />
                          )}
                          <span
                            className={cn(
                              "text-xs leading-tight transition-all duration-200",
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
              <div className="bg-card p-5 rounded-xl border border-border/50 space-y-4">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className="text-lg font-bold text-foreground">
                    Research
                  </h4>
                  <div className="flex gap-1">
                    <div className="text-[12px] font-bold text-primary dark:text-primary">
                      {toolCalls.filter((t) => t.status === "done").length}
                    </div>
                    <div className="text-[12px] text-muted-foreground/40">
                      /
                    </div>
                    <div className="text-[12px] text-muted-foreground/60">
                      {toolCalls.length}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
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
            {/* 
            <div className="bg-card p-5 rounded-xl border border-border/50 space-y-4">
              <h4 className="text-lg font-bold text-foreground">Readability</h4>

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
            </div> */}
          </>
        ) : null}

        {seoScore ? (
          <div className="bg-card p-5 rounded-xl border border-border/50 space-y-6">
            <h4 className="text-lg font-bold text-foreground">On-Page SEO</h4>

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
                  {trustScore.score ? trustScore.score : trustScore.trust_score}
                  %
                </span>
                <TrendingUp size={20} className="text-emerald-500 shrink-0" />
              </div>
              <div className="text-[13px] text-muted-foreground font-medium">
                {getStatusMessage(trustScore.score ?? trustScore.trust_score)}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );

  const structureSidebarContent = (
    <div className="px-6 py-6 space-y-8 h-full overflow-y-auto">
      <div>
        <h3 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
          Structure
        </h3>
        <nav className="space-y-1">
          {sidebarSections?.map((sec, _i) => (
            <button
              type="button"
              key={`${sec.heading}-${sec}`}
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

  return (
    <div className="animate-in fade-in duration-700 bg-background flex flex-col border-t relative h-[88.5vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
      <div className="flex flex-1 relative border-b border-border">
        {/* Left Sidebar: Outline (never render inside editor body) */}
        {sidebarSections.length > 0 && (
          <aside className="hidden xl:flex w-60 border-r border-border/50 bg-sidebar/20 flex-col shrink-0 overflow-y-auto sticky top-0 max-h-[calc(100vh-85px)] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <div className="px-3 py-4">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black text-muted-foreground/35 uppercase tracking-[0.2em]">
                  Structure
                </span>
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
                      key={`${sec.heading}-${sec}`}
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
          className="w-full flex-1 bg-background px-2 py-4 scroll-smooth"
        >
          <article className="overflow-hidden w-full sm:mx-auto sm:max-w-3xl sm:px-4 pb-16">
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
                    {displayTitle}
                  </h1>
                  <div className="min-h-[600px]">
                    <SafeLexicalEditor
                      readOnly={false}
                      key={`editor-${contentId ?? "new"}-${isEditing}`}
                      initialValue={body}
                      onChange={onContentChange}
                      toolbarClass="top-0 z-50"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full relative">
                  {!body?.trim() ? (
                    <>
                      <div className="space-y-4 mb-8">
                        {/* Tags Skeleton */}
                        <div className="flex flex-wrap gap-2">
                          {TAG_SKELETON_KEYS.map((key) => (
                            <Skeleton
                              key={key}
                              className="h-6 w-16 rounded-full"
                            />
                          ))}
                        </div>

                        {/* Title Skeleton */}
                        <div className="space-y-3">
                          <Skeleton className="h-10 w-4/5 rounded-lg" />
                          <Skeleton className="h-10 w-2/3 rounded-lg" />
                        </div>

                        {/* Intro Skeleton */}
                        {allContent?.meta_description && (
                          <div className="border-l-[3px] border-primary/20 pl-6 my-8 space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                          </div>
                        )}
                      </div>

                      {/* Content Skeleton */}
                      <div className="blog-content space-y-4">
                        {CONTENT_SKELETON_KEYS.map((key) => (
                          <Skeleton key={key} className="h-4 rounded" />
                        ))}
                      </div>
                    </>
                  ) : (
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

                        {allContent?.meta_description && (
                          <div className="text-base text-foreground/70 dark:text-foreground/60 leading-[1.85] font-normal border-l-[3px] border-primary/40 pl-6 my-8 italic py-1">
                            {typedIntro}
                          </div>
                        )}
                      </div>
                      <SafeLexicalEditor
                        readOnly={true}
                        key={`editor-${contentId ?? "new"}-${isEditing}`}
                        initialValue={body}
                        onChange={onContentChange}
                        toolbarClass="top-0 z-50"
                      />
                    </>
                  )}
                  {!isFinal && isEnhancing && (
                    <div className="fixed inset-0 grid place-items-center bg-background/40 backdrop-blur-[3px] ml-auto w-full">
                      <div className="rounded-2xl border border-border bg-card px-6 py-4 shadow-xl">
                        <div className="text-sm font-semibold text-foreground">
                          {enhancingMsg}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {enhancingDescription}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        </main>

        {/* Desktop Right Sidebar */}
        <aside className="hidden xl:flex w-64 border-l border-border bg-sidebar/30 flex-col sticky top-0 max-h-[calc(100vh-85px)]">
          {analysisSidebarContent}
        </aside>
      </div>

      {/* Mobile Responsive Drawers */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4 z-50 pointer-events-none px-4">
        {sidebarSections && sidebarSections.length > 0 && (
          <div className="xl:hidden pointer-events-auto">
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
            <SheetContent side="right" className="p-0 w-80 bg-card">
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
                {statusModal.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base">
                {statusModal.message}
              </DialogDescription>
            </div>
            {statusModal.showIntegrationLink && workspaceSlug && (
              <Button
                className="mt-2 gap-2"
                onClick={() => {
                  setStatusModal((prev) => ({ ...prev, isOpen: false }));
                  router.push(`/w/${workspaceSlug}/integrations`);
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Go to Integrations
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-sm max-h-[80vh] sm:h-auto overflow-auto">
          <DialogTitle>Schedule Publication</DialogTitle>
          <DialogDescription>
            Pick a date and time in your account timezone ({accountTimezone}).
            Content publishes automatically via WordPress.
          </DialogDescription>
          {timezoneMismatch && syncTimezoneMutation.isError && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                Couldn&apos;t update your account timezone to match your device
                (<strong>{browserTimezone}</strong>). Scheduled times will use{" "}
                <strong>{accountTimezone}</strong> until this succeeds.
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 ml-1 text-amber-900 underline dark:text-amber-200"
                  disabled={syncTimezoneMutation.isPending}
                  onClick={() => syncTimezoneMutation.mutate()}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
          {timezoneMismatch && syncTimezoneMutation.isPending && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2.5 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin shrink-0" />
              Updating your account timezone to match your device (
              {browserTimezone})...
            </div>
          )}
          <div className="flex flex-col items-center gap-4 py-2">
            <Calendar
              mode="single"
              selected={scheduleDate}
              onSelect={setScheduleDate}
              disabled={isDateDisabled}
            />
            <div className="w-full space-y-1.5">
              <Label htmlFor="schedule-time" className="text-xs">
                Time
              </Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                min={minScheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                !scheduleDate ||
                isPublishing ||
                isScheduleTimeInPast ||
                (timezoneMismatch && syncTimezoneMutation.isPending)
              }
              onClick={scheduleContent}
            >
              {isPublishing ? (
                <Loader2 size={13} className="animate-spin mr-1" />
              ) : (
                <Clock size={13} className="mr-1" />
              )}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>
            Confirm {WORDPRESS_STATUS_DETAILS[selectedPublishStatus].label}
          </DialogTitle>

          <DialogDescription>
            Are you sure you want to{" "}
            <strong>
              {WORDPRESS_STATUS_DETAILS[
                selectedPublishStatus
              ].label.toLowerCase()}
            </strong>{" "}
            this content?
          </DialogDescription>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishConfirmOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                setPublishConfirmOpen(false);
                publishContent(selectedPublishStatus);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ContentEditor = memo(
  ContentEditorInner,
) as unknown as ComponentType<ContentEditorProps>;
ContentEditor.displayName = "ContentEditor";
