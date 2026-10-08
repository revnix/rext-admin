import type { WordPressPostStatus } from "@/types/content";
import type {
  ContentChecklist,
  FinalContent,
  Outline,
  ReadabilityMetrics,
  SEORESULT,
  TrustScore,
} from "@/types/generate-content";
import type { ToolCall } from "@/types/generate-content";
import { ArticleChecklist } from "@/components/generate-content/article-checklist";
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
  List,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { SafeLexicalEditor } from "../ui/safe-lexical-editor";
import { deriveImagesData } from "@/lib/content/image-data";
import { memo, useCallback, useState, useRef, useEffect, useMemo } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { integrationQueries, profileQueries } from "@/lib/query-keys";
import type { ComponentType } from "react";
import {
  useCurrentWorkspaceId,
  useCurrentWorkspaceSlug,
} from "@/stores/workspace/use-workspace-context-store";
import { useSaveGeneratedContent } from "@/hooks/use-content";
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
import { ConnectWordPressDialog } from "@/components/integrations/connect-wordpress-dialog";
import { log } from "@/lib/logger";
import { analytics } from "@/lib/analytics";
import { articleHtml } from "@/lib/content/article-html";
import { cn } from "@/lib/utils";
import { workspaceRoutes } from "@/lib/routes";
import { excludeJsonLdFromSeoResult } from "@/lib/generate-content/seo-issues";
import {
  PUBLISH_RESULT_COPY,
  postLink,
  publishConfirmCopy,
} from "@/lib/content/publish-copy";
import {
  articleStructure,
  plannedSections,
  writingPosition,
} from "@/lib/generate-content/article-structure";
import { useConfirmation } from "../ui/confirmation-dialog";
import { StructureTree } from "./structure-tree";
import { Notice } from "../ui/notice";
import { Skeleton } from "../ui/skeleton";

const TAG_SKELETON_KEYS = Array.from(
  { length: 5 },
  (_, i) => `tag-skeleton-${i + 1}`,
);

const CONTENT_SKELETON_KEYS = Array.from(
  { length: 3 },
  (_, i) => `content-skeleton-${i + 1}`,
);

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
        "relative rounded-md border overflow-hidden transition-colors",
        isRunning ? "bg-card border-border" : "bg-card border-border",
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5",
          isRunning ? "bg-foreground" : "bg-border",
        )}
      />
      <div className="flex items-start gap-2 pl-3 pr-2.5 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <Icon size={8} className="text-muted-foreground/60 shrink-0" />
            <span className="text-caption font-medium text-muted-foreground">
              Web Search
            </span>
          </div>
          <div className="text-caption text-foreground/70 break-words">
            <span className="text-muted-foreground/40">"</span>
            {tc.query.length > 40 ? `${tc.query.slice(0, 40)}…` : tc.query}
            <span className="text-muted-foreground/40">"</span>
          </div>
          {tc.status === "done" && tc.resultCount !== undefined && (
            <div className="flex items-center justify-between mt-1">
              <div className="text-caption text-foreground font-medium flex items-center gap-0.5">
                {tc.resultCount}&nbsp;result{tc.resultCount !== 1 ? "s" : ""}
              </div>
              {hasOutput && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="cursor-pointer text-caption text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
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
        <div className="mx-2 mb-2 p-2 rounded-md bg-background/60 border border-border/40 text-caption text-muted-foreground font-mono whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          {tc.output}
        </div>
      )}
    </div>
  );
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

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
  /** The backend's checklist: content.checklist or content.review.checklist. */
  checklist?: ContentChecklist | null;
  trustScore: TrustScore | null;
  generatedContent: string;
  seoScore: SEORESULT | null;
  userKeyword: string;
  outline: Outline | null;
  // Agent activity (shown in right sidebar while generating)
  toolCalls?: ToolCall[];
  /** The run component while the article is written, at the top of the side panel. */
  runProgress?: React.ReactNode;
  /** The same run on one line, for the bar below 1280 px, where the side panel is a sheet. */
  runStrip?: React.ReactNode;
  /** The Generate flow's steps, atop the article's column: inside it, since each column scrolls on its own. */
  steps?: React.ReactNode;
  /** The body is the writer's first draft, whole, shown while the later stages rewrite and check
   *  it: marked as a draft until the final text takes its place (task 773). */
  draft?: boolean;
  /** The article is live on a connected site (its status is "published"): a draft or review save
   *  then takes the post down, so the Publish menu warns first (#676). */
  isLive?: boolean;
  /** When true, shows the content blurred with a humanizing overlay */
};

function ContentEditorInner(props: ContentEditorProps) {
  const {
    contentId,
    threadId,
    isEnhancing,
    enhancingMsg,
    allContent,
    readabilityScore,
    checklist = null,
    trustScore,
    generatedContent,
    seoScore: rawSeoScore,
    userKeyword,
    outline,
    toolCalls = [],
    runProgress,
    runStrip,
    steps,
    draft = false,
    isLive = false,
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
  const previewHtml = useMemo(() => articleHtml(body), [body]);
  const score = readabilityScore?.flesch_reading_ease ?? 0;
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
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    title: string;
    isOpen: boolean;
    type: "success" | "error";
    action: "publish" | "save" | "copy";
    message: string;
    showIntegrationLink?: boolean;
    /** The post on the site, after a publish that made it live. */
    postUrl?: string | null;
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
  // Scheduling publishes to a connected site later, so the dialog first reads whether one is
  // connected; coming back from the integrations tab reads it again (#705).
  const scheduleSites = useQuery({
    ...integrationQueries.list(workspaceId ?? ""),
    enabled: scheduleDialogOpen && !!workspaceId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const scheduleNeedsSite =
    scheduleSites.isSuccess &&
    !scheduleSites.data.some((site) => site.is_active !== false);
  const checkingScheduleSites =
    scheduleSites.isPending && scheduleSites.fetchStatus === "fetching";
  // A list that couldn't be read is no proof of a site, an earlier answer still in the cache
  // included: the dates wait for a check that worked (review rounds 1 and 2).
  const scheduleSitesFailed = scheduleSites.isError;
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const { confirm, ConfirmationComponent } = useConfirmation();
  // What this editor's own last publish did to the post, ahead of the page's refetch of the article
  // (the fresh-generation view has no article to read it from at all). It holds only while `isLive`
  // is still the value it was set against: once the page reads the article again, the page wins.
  const [liveHere, setLiveHere] = useState<{
    live: boolean;
    against: boolean;
  } | null>(null);
  const postIsLive =
    liveHere && liveHere.against === isLive ? liveHere.live : isLive;
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

  // The article is still being written (the generation page), not a saved one being read.
  const writing = !isFinal && (!!isEnhancing || !!runProgress);
  // The whole first draft is on the page while the run goes on (task 773): every section is there,
  // so none is "being written" or "still to come".
  const showsDraft = writing && draft && !!body?.trim();
  // Its structure as layers, with what is written, being written and still to come (task 703).
  const structure = useMemo(
    () =>
      articleStructure(
        body ?? "",
        plannedSections(outline),
        writing && !showsDraft,
      ),
    [body, outline, writing, showsDraft],
  );
  const position = writingPosition(structure);
  const scrollToHeading = (heading: string) => {
    const wanted = heading.trim().toLowerCase();
    const element =
      document.getElementById(slugify(heading)) ||
      Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).find(
        (h) => {
          const text = h.textContent?.trim().toLowerCase() || "";
          return (
            text.includes(wanted) || (text !== "" && wanted.includes(text))
          );
        },
      );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsStructureOpen(false);
    }
  };

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
    // links_data / schema_markup are deliberately not sent: the
    // editor is not their source of truth, and sending empty values deleted
    // every ContentMedia link and the AI-generated JSON-LD on each save.
    langgraph_thread_id: threadId,
  });

  const publishContent = async (
    selectedStatus: WordPressPostStatus = "publish",
  ) => {
    if (!isFinal || !workspaceId) return;
    setPendingPublishStatus(selectedStatus);
    const statusDetails = PUBLISH_RESULT_COPY[selectedStatus];
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

      // Fresh at every publish: a site may have been connected or switched
      // off in another tab since the list was last read.
      const integrationsData = await queryClient.fetchQuery({
        ...integrationQueries.list(workspaceId),
        staleTime: 0,
      });
      const activeIntegrations = integrationsData.filter(
        (integration) => integration.is_active !== false,
      );

      if (activeIntegrations.length === 0) {
        // A workspace with no connected sites is not a permission problem —
        // open the connect-a-site flow so the user can add an integration.
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
        setIntegrationModalOpen(true);
        return;
      }

      setStatusModal({
        title: `${statusDetails.working}...`,
        isOpen: true,
        type: "success",
        action: "publish",
        message: "Sending the article to your site...",
      });

      const cmsType = activeIntegrations[0]?.integration_type;
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
      // A publish makes the post live; a draft or review save takes it down, but only where it
      // reached the site: one that failed may still show the post, so the warning stays.
      // When no site took it, nothing changed on any site.
      const results = response?.publish_results;
      const someSiteMissed = (results?.failed ?? 0) > 0;
      const noSiteTookIt = results ? results.successful === 0 : false;
      setLiveHere({
        live: noSiteTookIt
          ? postIsLive
          : selectedStatus === "publish" || (someSiteMissed && postIsLive),
        against: isLive,
      });
      setStatusModal({
        title: statusDetails.successTitle,
        isOpen: true,
        type: "success",
        action: "publish",
        message: statusDetails.successMessage,
        postUrl:
          selectedStatus === "publish"
            ? postLink(response?.content?.wordpress_url)
            : null,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const errorMessage = err.message?.toLowerCase() ?? "";
      const statusCode = err.statusCode ?? 0;
      const isIntegrationIssue =
        statusCode === 403 ||
        statusCode === 401 ||
        errorMessage.includes("no active sites") ||
        errorMessage.includes("no active sites found") ||
        errorMessage.includes("please connect a site") ||
        errorMessage.includes("integration disabled") ||
        errorMessage.includes("disabled integration") ||
        errorMessage.includes("site is disabled") ||
        errorMessage.includes("inactive site") ||
        errorMessage.includes("not configured") ||
        errorMessage.includes("not available") ||
        errorMessage.includes("misconfigured") ||
        errorMessage.includes("permission");
      analytics.track("cms_publish_failed", {
        workspace_id: workspaceId ?? undefined,
        content_id: contentSavedId ?? undefined,
        wordpress_status: selectedStatus,
        error_message: err.message,
      });
      setStatusModal({
        title: isIntegrationIssue
          ? "Permission required"
          : "The article wasn't sent to your site",
        isOpen: true,
        type: "error",
        action: "publish",
        message: isIntegrationIssue
          ? "You do not have permission to perform this action."
          : err.message || "Failed to publish content. Please try again.",
        // Permission and integration failures get the existing escape hatch
        // to the integrations page instead of a dead-end error dialog.
        showIntegrationLink: isIntegrationIssue,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // "Edit article" (task 706) opens the full-screen editor, which works on the saved article. One
  // written just now is saved first: the backend keeps one row for a run, so this is that row.
  const { mutateAsync: saveForEditing } = useSaveGeneratedContent();
  const openEditor = async () => {
    if (!isFinal || !workspaceId || !workspaceSlug || isOpeningEditor) return;
    const open = (id: string) =>
      router.push(workspaceRoutes.contentEdit(workspaceSlug, id) as Route);
    if (contentSavedId) {
      open(contentSavedId);
      return;
    }
    try {
      setIsOpeningEditor(true);
      const response = await saveForEditing({
        workspaceId,
        data: getContentPayload(),
      });
      if (!response.id) throw new Error("The save returned no article");
      setContentSavedId(response.id);
      open(response.id);
    } catch (error) {
      log.error("Saving the article before editing failed", error);
      setStatusModal({
        title: "The editor couldn't be opened",
        isOpen: true,
        type: "error",
        action: "save",
        message:
          "The article has to be saved first, and that didn't work. Try again.",
      });
    } finally {
      setIsOpeningEditor(false);
    }
  };

  const handleIntegrationAdded = () => {
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

  // Every choice in the menu asks first, in words that name it; on a live article, a draft or review
  // save says the post leaves the site (#676).
  const openPublishConfirmation = async (status: WordPressPostStatus) => {
    if (await confirm(publishConfirmCopy(status, postIsLive))) {
      publishContent(status);
    }
  };

  // The article's actions, each named (D23), in one bar above the page (task 703). "Edit article"
  // leads (task 706); Copy and Publish are menus beside it. On a phone the lead takes a row of
  // its own and the two menus share the next; from 640 px they are one row.
  const actionButtons = (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
      <div className="col-span-2 sm:col-auto">
        {/* Named in words, so no tooltip: one opened on the sheet's first focus and covered Copy. */}
        {canUpdate ? (
          <Button
            size="sm"
            className="h-10 xl:h-8 px-2! text-xs font-bold transition-all !w-full"
            onClick={openEditor}
            disabled={!isFinal || isOpeningEditor || isPublishing}
          >
            <Pencil
              size={16}
              className={isOpeningEditor ? "animate-pulse" : ""}
            />
            {isOpeningEditor ? "Opening…" : "Edit article"}
          </Button>
        ) : (
          <LockedFeatureTooltip message="Editing requires Editor role or above">
            <Button
              size="sm"
              className="h-10 xl:h-8 px-2! text-xs font-bold transition-all !w-full"
              disabled
            >
              <Pencil size={16} />
              Edit article
            </Button>
          </LockedFeatureTooltip>
        )}
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={!isFinal}
              variant="secondary"
              size="sm"
              className="h-10 xl:h-8 px-2! text-xs font-bold transition-all !w-full"
            >
              <Copy size={16} />
              Copy
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="center">
            <DropdownMenuItem onClick={() => handleCopy("html")}>
              Copy HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy("markdown")}>
              Copy Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy("formatted")}>
              Copy Text
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        {canPublish ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-10 xl:h-8 px-2! text-xs font-bold w-full!"
              >
                <Send
                  size={16}
                  className={isPublishing ? "animate-pulse" : ""}
                />
                {isPublishing ? "Publishing…" : "Publish"}
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                disabled={!isFinal || isPublishing || isOpeningEditor}
                onClick={() => openPublishConfirmation("publish")}
              >
                <Send size={13} className="mr-2" />
                Publish
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isFinal || isPublishing || isOpeningEditor}
                onClick={() => openPublishConfirmation("draft")}
              >
                <Save size={13} className="mr-2" />
                Save as Draft
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isFinal || isPublishing || isOpeningEditor}
                onClick={() => openPublishConfirmation("pending")}
              >
                <Eye size={13} className="mr-2" />
                Submit for Review
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!isFinal || isPublishing || isOpeningEditor}
                onClick={() => setScheduleDialogOpen(true)}
              >
                <Clock size={13} className="mr-2" />
                Schedule for Later
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <LockedFeatureTooltip message="Publishing requires a role above Editor">
            <Button
              variant="secondary"
              size="sm"
              className="h-10 xl:h-8 px-2! text-xs font-bold w-full!"
              disabled
            >
              <Send size={16} />
              Publish
            </Button>
          </LockedFeatureTooltip>
        )}
      </div>
    </div>
  );

  const analysisSidebarContent = (
    <div className="flex flex-col h-full min-h-0 bg-card pb-20 sm:pb-0">
      <section className="flex-1 min-h-0 overflow-y-auto px-1.5 pt-3 pb-6 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        {/* ── The run's stages, while the article is written ── */}
        {/* Its own life: the page passes it while a stage runs, which can outlast the scores
            (the save after them). */}
        {runProgress}
        {/* ── The research, while the article is written: the searches it ran ── */}
        {!isFinal && toolCalls.length > 0 && (
          <div className="space-y-3 pb-2">
            {/* Tool call research feed */}
            {toolCalls.length > 0 && (
              <div className="bg-card p-5 rounded-md border border-border space-y-4">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className="text-base font-semibold text-foreground">
                    Research
                  </h4>
                  <div className="flex gap-1">
                    <div className="text-caption font-semibold text-foreground">
                      {toolCalls.filter((t) => t.status === "done").length}
                    </div>
                    <div className="text-caption text-muted-foreground/40">
                      /
                    </div>
                    <div className="text-caption text-muted-foreground/60">
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
        {/* The checklist (once the article's checks have come back) */}
        <ArticleChecklist
          seoScore={seoScore}
          checklist={checklist}
          trustScore={trustScore}
        />
      </section>
    </div>
  );

  const structureSidebarContent = (
    <div className="h-full overflow-y-auto px-4 py-4">
      <StructureTree
        entries={structure}
        showState={writing && !showsDraft}
        onPick={scrollToHeading}
      />
    </div>
  );

  return (
    // Full-bleed (cancels PageFrame's side gutters, 16, 24 and 32 px) and, on
    // xl, exactly the viewport between the app header (--header-height) and the
    // run dock (when it shows): each column scrolls on its own, so there is one
    // scrollbar per column and none on the page (D23).
    <div className="animate-in fade-in duration-700 bg-background flex flex-col relative -mx-4 md:-mx-6 xl:-mx-8 xl:h-[calc(100dvh-var(--header-height)-var(--dock-height,0px))] xl:overflow-hidden">
      {/* The top bar (task 703): while the article is written it says where the writing is, and
          the actions wait; then it holds the actions. It stays in view on narrower screens, where
          the page scrolls as one. */}
      <div className="sticky top-[var(--header-height,0px)] z-10 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-card px-3 py-2 xl:static">
        {writing ? (
          <>
            <p className="text-table text-muted-foreground" aria-live="polite">
              {/* Always in these words: the stage's name alone ("Draft") read as the article's status. */}
              <span className="font-medium text-foreground">
                Writing the article
              </span>
              {/* Where the strip below shows, it names the stage. */}
              {enhancingMsg ? (
                <span className={runStrip ? "hidden xl:inline" : undefined}>
                  {` · ${enhancingMsg}`}
                </span>
              ) : null}
              {/* A whole draft has no section being written: the bar says it is a draft instead. */}
              {!showsDraft && position.sections > 0 && position.section > 0
                ? ` · section ${position.section} of ${position.sections}`
                : null}
            </p>
            {showsDraft ? <Badge variant="neutral">First draft</Badge> : null}
            {/* The run's stages are in the side panel, a sheet below 1280 px: there the bar holds
                the running stage on one line, with its time and how far the run is (task 703). */}
            {runStrip ? (
              <div className="w-full xl:hidden">{runStrip}</div>
            ) : null}
          </>
        ) : (
          <div className="min-w-0 flex-1">{actionButtons}</div>
        )}
      </div>
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Sidebar: Outline (never render inside editor body) */}
        {structure.length > 0 && (
          <aside className="hidden xl:flex w-64 border-r border-border bg-card flex-col shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            <div className="px-3 py-4">
              <p className="mb-3 px-2 text-label font-medium text-muted-foreground">
                Structure
              </p>
              <StructureTree
                entries={structure}
                showState={writing && !showsDraft}
                onPick={scrollToHeading}
              />
            </div>
          </aside>
        )}

        {/* Main Content Area: a div, since the shell's main element is the page's landmark;
            the article on the raised surface, with the page gutter. */}
        <div
          ref={scrollRef}
          className="w-full min-w-0 flex-1 bg-card px-4 md:px-6 xl:px-8 scroll-smooth xl:overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40"
        >
          {steps && <div className="pt-4 md:pt-6">{steps}</div>}
          {/* The article is one prose container (design/app-language.md §7): the title,
              the intro and the body share its measure and its type. overflow-clip (not
              overflow-hidden) contains wide tables and images without making a scroll
              container of the article. */}
          <article className="prose lg:prose-lg prose-app mx-auto w-full overflow-clip pt-6 pb-16 md:pt-8">
            {/* Images span the article's column at their own aspect, the featured one
                included (the founder's feedback v2, #704). Each image's wrappers become
                blocks, the outer one over its inline `display: inline-block` (hence `!`), or
                a narrow image would stay at its own width (review round 1). */}
            <div className="relative [&_img]:h-auto [&_img]:w-full [&_span:has(img)]:block!">
              {!body?.trim() ? (
                writing && structure.length > 0 ? (
                  // Before the first words arrive: the title, and below it the outline's
                  // sections where they will be written. No grey bars to watch (task 703).
                  // The title is the one the person chose (the outline's): what streams in
                  // meanwhile is unfinished, and showed a section's heading as the title.
                  (outline?.title || displayTitle) && (
                    <header>
                      {/* layout-ok: the article's own title, as in the article below (WorkingSurface's ownHeading) */}
                      <h1>{outline?.title || displayTitle}</h1>
                    </header>
                  )
                ) : (
                  <div className="not-prose space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {TAG_SKELETON_KEYS.map((key) => (
                        <Skeleton key={key} className="h-6 w-16 rounded-full" />
                      ))}
                    </div>
                    <div className="space-y-3 pb-4">
                      <Skeleton className="h-10 w-4/5 rounded-md" />
                      <Skeleton className="h-10 w-2/3 rounded-md" />
                    </div>
                    {allContent?.meta_description && (
                      <div className="space-y-3 pb-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    )}
                    {CONTENT_SKELETON_KEYS.map((key) => (
                      <Skeleton key={key} className="h-4 rounded-md" />
                    ))}
                  </div>
                )
              ) : (
                <>
                  {/* Below 1280 px the side panel is a sheet: the checklist shows here, above
                        the article, instead of behind its button (#704). */}
                  <div className="not-prose mb-8 xl:hidden">
                    <ArticleChecklist
                      seoScore={seoScore}
                      checklist={checklist}
                      trustScore={trustScore}
                    />
                  </div>
                  {/* The first draft, said once where the reading starts; the bar keeps the word
                      in view (task 773). */}
                  {showsDraft && (
                    <Notice title="First draft" className="not-prose mb-8">
                      We're still rewriting and checking the article. The final
                      text replaces this one when it's ready.
                    </Notice>
                  )}
                  <header>
                    {tags.length > 0 && (
                      <div className="not-prose mb-4 flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <Badge key={t} variant="neutral">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <h1>{displayTitle}</h1>
                    {allContent?.meta_description && (
                      <p className="lead">{allContent.meta_description}</p>
                    )}
                  </header>
                  <SafeLexicalEditor
                    readOnly={true}
                    key={`editor-${contentId ?? "new"}`}
                    initialValue={body}
                    onRequestEdit={
                      canUpdate && isFinal ? openEditor : undefined
                    }
                  />
                </>
              )}
              {/* The sections still to come, where they will be written: no overlay, and
                    nothing moves but the text itself (task 703). */}
              {writing && structure.some((e) => e.state === "waiting") && (
                <ol className="not-prose mt-10 space-y-3">
                  {structure
                    .filter((entry) => entry.state === "waiting")
                    .map((entry, index) => (
                      <li
                        // biome-ignore lint/suspicious/noArrayIndexKey: two sections may share a heading
                        key={`${index}-${entry.heading}`}
                        className={cn(
                          "rounded-md border border-dashed border-border px-4 py-3 text-muted-foreground",
                          entry.level === 3 && "ml-6",
                        )}
                      >
                        <p
                          className={
                            entry.level === 2 ? "text-section" : "text-body"
                          }
                        >
                          {entry.heading}
                        </p>
                        <p className="text-caption">Still to come</p>
                      </li>
                    ))}
                </ol>
              )}
            </div>
          </article>
        </div>

        {/* Desktop Right Sidebar */}
        <aside className="hidden xl:flex w-72 border-l border-border bg-card flex-col shrink-0 min-h-0">
          {analysisSidebarContent}
        </aside>
      </div>

      {/* Mobile Responsive Drawers: above the phone's bottom bar (under 1024 px) and the run dock
          (when it shows), so neither one's buttons are covered. */}
      <div className="fixed bottom-[calc(var(--bottom-bar-height,0px)+var(--dock-height,0px)+--spacing(4))] lg:bottom-[calc(var(--dock-height,0px)+--spacing(6))] left-0 right-0 flex justify-center gap-4 z-50 pointer-events-none px-4">
        {structure.length > 0 && (
          <div className="xl:hidden pointer-events-auto">
            <Sheet open={isStructureOpen} onOpenChange={setIsStructureOpen}>
              <Button
                onClick={() => setIsStructureOpen(true)}
                className="rounded-md h-11 pr-5 pl-4 flex items-center gap-2 bg-background hover:bg-muted text-foreground border border-border"
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
              className="rounded-md h-11 pr-5 pl-4 flex items-center gap-2 bg-background hover:bg-muted text-foreground border border-border"
            >
              <Activity size={18} />
              <span className="font-bold text-sm">Checklist</span>
            </Button>
            <SheetContent side="right" className="p-0 w-80 bg-card">
              <SheetHeader className="px-6 py-4 border-b">
                <SheetTitle>Checklist</SheetTitle>
              </SheetHeader>
              {analysisSidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {workspaceId && (
        <ConnectWordPressDialog
          workspaceId={workspaceId}
          open={integrationModalOpen}
          onOpenChange={(open) => {
            if (open) return;
            setIntegrationModalOpen(false);
            setStatusModal((prev) => ({ ...prev, isOpen: false }));
          }}
          onConnected={handleIntegrationAdded}
        />
      )}

      {/* Status Modal (Unified Success/Error) */}
      <Dialog
        open={statusModal.isOpen}
        onOpenChange={(open) =>
          setStatusModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-md p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                statusModal.type === "success" ? "bg-muted" : "bg-danger-50",
              )}
            >
              {statusModal.type === "success" ? (
                <CheckCircle2 className="w-8 h-8 text-foreground" />
              ) : (
                <AlertCircle className="w-8 h-8 text-danger-600" />
              )}
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                {statusModal.title}
              </DialogTitle>
              {/* A server's reason can be long and unbroken: it wraps, and scrolls past the cap. */}
              <DialogDescription className="max-h-(--dialog-message-max) overflow-y-auto wrap-anywhere text-muted-foreground text-base">
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
            {statusModal.postUrl && (
              <Button asChild variant="outline" className="mt-2 gap-2">
                <a
                  href={statusModal.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open the post
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-sm max-h-[80vh] sm:h-auto overflow-auto">
          <DialogTitle>Schedule publication</DialogTitle>
          <DialogDescription>
            {scheduleNeedsSite
              ? "A scheduled article is published to your site at the time you pick."
              : `Pick a date and time in your account timezone (${accountTimezone}). Content publishes automatically via WordPress.`}
          </DialogDescription>
          {checkingScheduleSites ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin shrink-0" />
              Checking your connected sites…
            </div>
          ) : scheduleSitesFailed ? (
            <Notice
              tone="danger"
              title="Your sites couldn't be checked"
              className="self-start"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  disabled={scheduleSites.isFetching}
                  onClick={() => scheduleSites.refetch()}
                >
                  Try again
                </Button>
              }
            >
              Scheduling needs a connected site, so the dates show once the
              check works.
            </Notice>
          ) : scheduleNeedsSite ? (
            <Notice
              tone="info"
              title="Connect a site first"
              className="self-start"
              action={
                workspaceSlug ? (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`/w/${workspaceSlug}/integrations`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={16} aria-hidden />
                      Set up an integration
                    </a>
                  </Button>
                ) : undefined
              }
            >
              Set one up in a new tab, then come back: this dialog shows the
              dates once a site is connected.
            </Notice>
          ) : (
            <>
              {timezoneMismatch && syncTimezoneMutation.isError && (
                <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-xs text-foreground">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <div className="flex-1">
                    Couldn&apos;t update your account timezone to match your
                    device (<strong>{browserTimezone}</strong>). Scheduled times
                    will use <strong>{accountTimezone}</strong> until this
                    succeeds.
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 ml-1 text-foreground underline"
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
            </>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleDialogOpen(false)}
            >
              {scheduleNeedsSite || scheduleSitesFailed ? "Close" : "Cancel"}
            </Button>
            {!scheduleNeedsSite &&
              !checkingScheduleSites &&
              !scheduleSitesFailed && (
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
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {ConfirmationComponent}
    </div>
  );
}

export const ContentEditor = memo(
  ContentEditorInner,
) as unknown as ComponentType<ContentEditorProps>;
ContentEditor.displayName = "ContentEditor";
