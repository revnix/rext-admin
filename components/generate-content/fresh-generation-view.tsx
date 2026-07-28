// components/generate-content/fresh-generation-view.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { AlertCircle, ArrowRight, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingIndicatorVariants } from "@/components/ui/content/loading-indicator-variants";
import { useTypewriter } from "@/hooks/use-typewriter";
import { useStreamingText } from "@/hooks/use-streaming-text";
import type {
  CommonOutput,
  ContentOutline,
  BrandVoicePromotion,
  ContentSection,
  FinalContent,
  InternalLinkSuggestion,
  NodeOutput,
  ResumeOptions,
  RunStreamEvent,
  SEORESULT,
  StreamUpdates,
  WREXT,
  WorkflowStep,
} from "@/types/generate-content";
import {
  INITIAL_ANALYSIS_STEPS,
  KEYWORD_SELECTION_STEPS,
  TOPIC_GENERATION_STEPS,
  TOPIC_REGENERATION_STEPS,
  CONTENT_TYPE_STEPS,
  FINAL_GENERATION_STEPS,
} from "@/constants/loading-steps";
import { HeroSection } from "@/components/generate-content/hero";
import { KeywordForm } from "@/components/generate-content/keyword";
import { SuggestionsSection } from "@/components/generate-content/suggestions";
import { TopicsSection } from "@/components/generate-content/topics";
import {
  OutlineDisplay,
  OutlineRejectSection,
} from "@/components/generate-content/outline";
import { ContentEditor } from "@/components/generate-content/content";
import ContentType from "./content-type";
import { WorkflowStepIndicator } from "@/components/generate-content/workflow-step-indicator";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCreditGate } from "@/hooks/use-credit-gate";
import { useCurrentWorkspaceId } from "@/stores/workspace/use-workspace-context-store";
import {
  generationReducer,
  initialState,
} from "@/lib/generate-content/generation-reducer";
import {
  createThread,
  streamFromSSE,
  formatNodeName,
} from "@/lib/generate-content/stream-utils";
import type { ToolCall } from "@/components/generate-content/agent-feed";
import { analytics } from "@/lib/analytics";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useBackgroundGenerationStore } from "@/stores/background-generation-store";
import { useWorkspace } from "@/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { workspaceRoutes } from "@/lib/routes";
import { toast } from "sonner";
import type { Route } from "next";

interface FreshGenerationViewProps {
  onBack: () => void;
  initialKeyword?: string;
  initialIntent?: string;
  isLibrary?: boolean;
  backgroundThreadId?: string;
}

const extractJsonStringFieldPartial = (raw: string, field: string) => {
  // Streaming-friendly extraction for `"field":"..."` values.
  // Returns the latest seen value, even if the closing quote hasn't arrived yet.
  const needle = `"${field}":"`;
  const idx = raw.lastIndexOf(needle);
  if (idx === -1) return "";

  const start = idx + needle.length;
  let out = "";
  let escape1 = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escape1) {
      out += `\\${ch}`;
      escape1 = false;
      continue;
    }
    if (ch === "\\") {
      escape1 = true;
      continue;
    }
    if (ch === '"') break;
    out += ch;
  }

  return out
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
};

const normalizeEscapedJsonish = (raw: string) => {
  // Sometimes `messages/partial` streams a JSON string with quotes escaped:
  // {\"title\":\"...\",\"body_markdown\":\"...\"}
  // Normalize it so field extraction works.
  return raw.includes('\\"') ? raw.replace(/\\"/g, '"') : raw;
};

const htmlToMarkdownLite = (html: string) => {
  // Minimal HTML -> Markdown-ish conversion for streaming preview.
  // Keeps it dependency-free and good enough for typewriter display.
  return (
    html
      // Headings
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "#### $1\n\n")
      // Paragraphs / line breaks
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      // Lists
      .replace(/<ul[^>]*>/gi, "\n")
      .replace(/<\/ul>/gi, "\n")
      .replace(/<ol[^>]*>/gi, "\n")
      .replace(/<\/ol>/gi, "\n")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
      // Links
      .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
      .replace(/<a[^>]*href='([^']+)'[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
      // Inline formatting
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
      // Strip remaining tags
      .replace(/<\/?[^>]+>/g, "")
      // Decode a few entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim()
  );
};

const extractJsonStringArrayField = (raw: string, field: string) => {
  const re = new RegExp(`"${field}"\\s*:\\s*\\[([^\\]]*)`, "g");
  let match: RegExpExecArray | null = null;
  let last: string | null = null;

  while (true) {
    match = re.exec(raw);
    if (!match) break;
    last = match[1] ?? null;
  }

  if (!last) return [] as string[];

  const items = last.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g) ?? [];
  return items
    .map((s) => s.slice(1, -1))
    .map((s) => {
      try {
        return JSON.parse(`"${s}"`);
      } catch {
        return s.replace(/\\"/g, '"');
      }
    })
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0);
};

export function FreshGenerationView({
  onBack: _onBack,
  initialKeyword: _initialKeyword = "",
  initialIntent: _initialIntent = "",
  isLibrary = false,
  backgroundThreadId,
}: FreshGenerationViewProps) {
  const [state, dispatch] = useReducer(generationReducer, initialState);
  const router = useRouter();
  const { user } = useAuthSession();
  const workspaceId = useCurrentWorkspaceId();
  const { workspaceSlug } = useWorkspace();
  const upsertBackgroundJob = useBackgroundGenerationStore(
    (store) => store.upsertJob,
  );
  const updateBackgroundJob = useBackgroundGenerationStore(
    (store) => store.updateJob,
  );
  const { patchCredits } = useSubscriptionStore();
  const {
    ensureCredits,
    ensureCreditsToContinue,
    openCreditsModal,
    creditsModal,
  } = useCreditGate();

  // ── Streaming text buffers — one per "phase" ──────────────────────────────
  // outlineStream  → accumulates tokens while LLM writes the outline JSON
  // contentStream  → accumulates tokens while LLM writes the final article
  const outline = useStreamingText(); // { streamedText, appendToken, resetStream }
  const content = useStreamingText();

  // Which buffer should receive `messages/partial` tokens right now?
  const tokenTargetRef = useRef<"none" | "outline" | "content">("none");
  const [tokenTarget, setTokenTarget] = useState<
    "none" | "outline" | "content"
  >("none");
  const {
    userKeyword,
    country,
    primaryKeyword,
    suggestedKeywords,
    generatedContent,
    threadId,
    rejectedReason,
    outline: parsedOutline, // ← the fully-parsed outline object from reducer
    topics,
    instruction,
    instructionType,
    isEditing,
    seoResult,
    contentTypes,
    loadingStatus,
    isManualLoading,
    completedNodes,
    isLoading,
    readabilityScore,
    seoScore,
    trustScore,
    allContent,
    currentLoadingSteps,
    keywordClusters,
    recommendedContentType,
  } = state;

  const interruptInternalLinks = useMemo(
    () =>
      state.interrupt?.[0]?.value?.internal_links as
        | InternalLinkSuggestion[]
        | undefined,
    [state.interrupt],
  );

  const interruptBrandVoicePromotion = useMemo(
    () =>
      state.interrupt?.[0]?.value?.brand_voice_promotion as
        | BrandVoicePromotion
        | undefined,
    [state.interrupt],
  );

  const isEditingRef = useRef(isEditing);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // Abort controller — cancelled on unmount or when a new stream starts
  const abortControllerRef = useRef<AbortController | null>(null);

  // True while a stream is in flight — blocks repeated clicks from spawning duplicate runs
  const streamBusyRef = useRef(false);

  // Track generation completion once per thread to avoid duplicate events
  const trackedThreadRef = useRef<string | null>(null);
  const trackedKeywordSearchRef = useRef<string | null>(null);
  const trackedTitleSuggestionsRef = useRef<string | null>(null);
  const trackedOutlineGeneratedRef = useRef<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  // Cancel on unmount (e.g. user navigates away)
  // biome-ignore lint/correctness/useExhaustiveDependencies: cancelStream is stable (uses refs internally), dep array intentionally empty
  useEffect(() => {
    return () => cancelStream();
  }, []);

  const hydrateFromBackgroundState = useCallback(
    (values: Partial<WREXT>) => {
      const restoredContent = values.content;
      const finalContent = restoredContent?.final_content;
      if (!finalContent) return false;

      const review = restoredContent.review as
        | (typeof restoredContent.review & {
            on_page_metrics?: SEORESULT;
          })
        | undefined;

      dispatch({ type: "SET_THREAD_ID", payload: backgroundThreadId ?? null });
      dispatch({
        type: "SET_USER_KEYWORD",
        payload:
          values.serp_payload?.query ??
          finalContent.focus_keyphrase ??
          finalContent.primary_keyword ??
          "",
      });
      dispatch({
        type: "SET_PRIMARY_KEYWORD",
        payload:
          finalContent.focus_keyphrase ??
          finalContent.primary_keyword ??
          values.serp_payload?.query ??
          "",
      });
      dispatch({
        type: "SET_OUTLINE",
        payload: restoredContent.outline ?? null,
      });
      dispatch({ type: "SET_ALL_CONTENT", payload: finalContent });
      dispatch({
        type: "SET_GENERATED_CONTENT",
        payload:
          finalContent.body_markdown ||
          htmlToMarkdownLite(finalContent.html_content ?? ""),
      });
      if (review?.readability_metrics) {
        dispatch({
          type: "SET_READABILITY_SCORE",
          payload: review.readability_metrics,
        });
      }
      if (review?.trust_score) {
        dispatch({
          type: "SET_TRUST_SCORE",
          payload: review.trust_score,
        });
      }
      if (review?.on_page_metrics) {
        dispatch({
          type: "SET_SEO_SCORE",
          payload: review.on_page_metrics,
        });
      }
      dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
      dispatch({ type: "SET_MANUAL_LOADING", payload: false });
      dispatch({ type: "SET_LOADING_STATUS", payload: "" });
      dispatch({ type: "SET_LOADING_STEPS", payload: [] });
      return true;
    },
    [backgroundThreadId],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: processStream/cancelStream are declared later and are intentionally not deps (accessed via ref / at call time)
  useEffect(() => {
    if (!backgroundThreadId) return;

    let disposed = false;
    let retryId: number | undefined;
    let consecutiveFailures = 0;

    dispatch({ type: "SET_THREAD_ID", payload: backgroundThreadId });
    dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
    dispatch({ type: "SET_MANUAL_LOADING", payload: true });
    dispatch({ type: "SET_LOADING_STEPS", payload: FINAL_GENERATION_STEPS });
    dispatch({
      type: "SET_LOADING_STATUS",
      payload: "Restoring background generation...",
    });
    setRestoreError(null);

    const restore = async () => {
      let terminalFailure = false;
      try {
        const response = await fetch(
          `/api/generate/${encodeURIComponent(backgroundThreadId)}/status?includeState=true`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          run?: { id?: string; status?: string };
          state?: { values?: Partial<WREXT> };
          progress?: number;
          stage?: string;
          error?: string;
        };

        if (!response.ok && response.status !== 202) {
          throw new Error(payload.error || "Unable to restore this article");
        }
        if (disposed) return;

        if (
          payload.run?.status === "error" ||
          payload.run?.status === "timeout" ||
          payload.run?.status === "interrupted" ||
          payload.error
        ) {
          terminalFailure = true;
          throw new Error(
            payload.error || "This article could not be generated.",
          );
        }
        consecutiveFailures = 0;

        updateBackgroundJob(backgroundThreadId, {
          status: "running",
          stage: payload.stage ?? "Generating your article",
          progress: payload.progress ?? 24,
        });

        if (payload.run?.status === "success") {
          if (
            payload.state?.values &&
            hydrateFromBackgroundState(payload.state.values)
          ) {
            updateBackgroundJob(backgroundThreadId, {
              status: "completed",
              stage: "Article ready",
              progress: 100,
            });
            return;
          }
          terminalFailure = true;
          throw new Error(
            "Generation finished, but the article result was unavailable.",
          );
        }

        // Run still in progress: reconnect to its live token stream so the
        // article renders as it's written (same as staying on the page),
        // instead of showing a poll-only skeleton until completion.
        const runId = payload.run?.id;
        if (runId) {
          setTokenTarget("content");
          tokenTargetRef.current = "content";
          dispatch({
            type: "SET_LOADING_STATUS",
            payload: payload.stage ?? "Generating your article...",
          });
          cancelStream();
          abortControllerRef.current = new AbortController();
          const { signal } = abortControllerRef.current;
          try {
            const stream = streamFromSSE(
              `/api/generate/${encodeURIComponent(backgroundThreadId)}/join`,
              { runId },
              signal,
            );
            await processStreamRef.current(stream);
          } catch {
            // Join dropped or the run just ended — the re-check below reconciles.
          }
          if (disposed) return;
          // Re-check status to hydrate the final article (or catch a terminal
          // state) once the joined stream ends.
          retryId = window.setTimeout(restore, 800);
          return;
        }

        dispatch({
          type: "SET_LOADING_STATUS",
          payload:
            payload.stage ?? "Generating your article in the background...",
        });
        retryId = window.setTimeout(restore, 3000);
      } catch (error) {
        if (disposed) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to restore this article";
        consecutiveFailures += 1;
        if (!terminalFailure && consecutiveFailures < 3) {
          dispatch({
            type: "SET_LOADING_STATUS",
            payload: "Reconnecting to background generation...",
          });
          retryId = window.setTimeout(restore, 3000);
          return;
        }
        setRestoreError(message);
        dispatch({ type: "SET_MANUAL_LOADING", payload: false });
        updateBackgroundJob(backgroundThreadId, {
          status: "failed",
          stage: "Generation failed",
          error: message,
        });
      }
    };

    void restore();

    return () => {
      disposed = true;
      if (retryId) window.clearTimeout(retryId);
      // Abort any in-flight join stream; the server run continues
      // (cancelOnDisconnect is false on the join route).
      cancelStream();
    };
  }, [backgroundThreadId, hydrateFromBackgroundState, updateBackgroundJob]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleKeywordSubmit is declared after this effect and is not stable
  useEffect(() => {
    if (_initialKeyword) {
      handleKeywordSubmit();
    }
  }, [_initialKeyword]);

  // Auto-skip keyword selection step when coming from library
  // biome-ignore lint/correctness/useExhaustiveDependencies: handleWorkflow is declared after this effect and is not stable
  useEffect(() => {
    if (
      isLibrary &&
      instructionType === "keyword Selection" &&
      primaryKeyword
    ) {
      handleWorkflow("KEYWORD_SELECT", primaryKeyword);
    }
  }, [isLibrary, instructionType, primaryKeyword]);

  // ── Typewriter for instruction hint text ─────────────────────────────────
  const { displayed: displayedInstruction } = useTypewriter(instruction, {
    speed: 60,
    retypeOnChange: true,
  });

  const showOutlineReview =
    instructionType === "outline_review" && tokenTarget !== "content";

  const showContentStream =
    instructionType === "content" ||
    tokenTarget === "content" ||
    content.streamedText.length > 0 ||
    !!allContent;

  const isStreamingOutline = tokenTarget === "outline" && !parsedOutline;

  const isContentFinal =
    !!allContent && !!readabilityScore && !!seoScore && !!trustScore;

  // Track content_generation_completed once per thread when all scores are ready
  useEffect(() => {
    if (!isContentFinal || !threadId) return;
    if (trackedThreadRef.current === threadId) return;
    trackedThreadRef.current = threadId;

    analytics.track("content_generation_completed", {
      keyword: userKeyword,
      workspace_id: workspaceId ?? undefined,
      thread_id: threadId,
      word_count: allContent?.word_count,
    });
    updateBackgroundJob(threadId, {
      status: "completed",
      stage: "Article ready",
      progress: 100,
      error: undefined,
    });
  }, [
    isContentFinal,
    threadId,
    userKeyword,
    workspaceId,
    allContent?.word_count,
    updateBackgroundJob,
  ]);

  // Track keyword_search_completed once per thread when SEO/keyword data arrives
  useEffect(() => {
    if (!threadId || !suggestedKeywords.length) return;
    if (trackedKeywordSearchRef.current === threadId) return;
    trackedKeywordSearchRef.current = threadId;

    analytics.track("keyword_search_completed", {
      keyword: userKeyword,
      workspace_id: workspaceId ?? undefined,
      thread_id: threadId,
      suggested_keyword_count: suggestedKeywords.length,
    });
  }, [threadId, suggestedKeywords.length, userKeyword, workspaceId]);

  // Track title_suggestions_generated once per thread when topics arrive
  useEffect(() => {
    if (!threadId || !topics.length) return;
    if (trackedTitleSuggestionsRef.current === threadId) return;
    trackedTitleSuggestionsRef.current = threadId;

    analytics.track("title_suggestions_generated", {
      keyword: primaryKeyword,
      workspace_id: workspaceId ?? undefined,
      thread_id: threadId,
      title_count: topics.length,
    });
  }, [threadId, topics.length, primaryKeyword, workspaceId]);

  // Track outline_generated once per thread when the parsed outline arrives
  useEffect(() => {
    if (!threadId || !parsedOutline) return;
    if (trackedOutlineGeneratedRef.current === threadId) return;
    trackedOutlineGeneratedRef.current = threadId;

    analytics.track("outline_generated", {
      keyword: primaryKeyword,
      workspace_id: workspaceId ?? undefined,
      thread_id: threadId,
      section_count: parsedOutline.sections?.length ?? 0,
    });
  }, [threadId, parsedOutline, primaryKeyword, workspaceId]);

  const liveBodyMarkdown = (() => {
    const buf = normalizeEscapedJsonish(content.streamedText);

    // Extract markdown if available
    const md = extractJsonStringFieldPartial(buf, "body_markdown");
    if (md) return md;

    // Extract html if available
    const html = extractJsonStringFieldPartial(buf, "html_content");
    if (html) return htmlToMarkdownLite(html);

    // If still JSON → don't render anything
    if (buf.trim().startsWith("{")) {
      return "";
    }

    return buf;
  })();

  const { displayed: displayedBodyMarkdown } = useTypewriter(liveBodyMarkdown, {
    speed: 15,
    retypeOnChange: false,
  });

  const streamedAllContent = (() => {
    const buf = normalizeEscapedJsonish(content.streamedText);
    return {
      title: extractJsonStringFieldPartial(buf, "title") || undefined,
      meta_title: extractJsonStringFieldPartial(buf, "meta_title"),
      meta_description: extractJsonStringFieldPartial(buf, "meta_description"),
      tags: extractJsonStringArrayField(buf, "tags"),
      focus_keyphrase: extractJsonStringFieldPartial(buf, "focus_keyphrase"),
      introduction: extractJsonStringFieldPartial(buf, "introduction"),
      body_markdown: liveBodyMarkdown,
      html_content: extractJsonStringFieldPartial(buf, "html_content"),
      word_count: 0,
      status: "generated",
    } as unknown as FinalContent;
  })();

  // ── Selected intent from dropdown ────────────────────────────────────────
  const [selectedIntent, setSelectedIntent] = useState<
    "informational" | "commercial" | "transactional" | "navigational" | ""
  >("");

  // Auto-select first intent when seoResult arrives
  useEffect(() => {
    if (!seoResult?.intent || selectedIntent) return;
    const raw = Array.isArray(seoResult.intent)
      ? seoResult.intent[0]
      : String(seoResult.intent);
    const norm = raw?.trim().toLowerCase();
    if (
      ["informational", "commercial", "transactional", "navigational"].includes(
        norm,
      )
    ) {
      setSelectedIntent(
        norm as
          | "informational"
          | "commercial"
          | "transactional"
          | "navigational",
      );
    }
  }, [seoResult?.intent, selectedIntent]);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancingMsg, setEnhancingMsg] = useState("Enhancing content...");
  const [enhancingDescription, setEnhancingDescription] = useState("");

  // ── Tool call tracking for agent activity feed ────────────────────────────
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [pipelineSteps, setPipelineSteps] = useState<
    Array<{ label: string; status: "pending" | "active" | "done" }>
  >([]);

  const CONTENT_PIPELINE = [
    "Generating Content",
    "Humanizing",
    "Reviewing Content",
  ];

  // Advance pipeline: mark previous step done, set new step active
  const advancePipeline = (activeLabel: string) => {
    setPipelineSteps((prev) => {
      // Initialize on first call
      const base =
        prev.length === 0
          ? CONTENT_PIPELINE.map((label) => ({
              label,
              status: "pending" as const,
            }))
          : prev;
      return base.map((step) => {
        if (step.label === activeLabel) return { ...step, status: "active" };
        if (step.status === "active") return { ...step, status: "done" };
        return step;
      });
    });
  };

  // If content tokens are JSON for FinalContent, parse as soon as valid so we can
  // show real markdown (and title/tags/etc) without waiting for an updates event.
  const contentParseTimerRef = useRef<number | null>(null);
  const outlineParseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showContentStream) return;
    if (allContent) return;
    if (tokenTargetRef.current !== "content") return;
    if (!content.streamedText) return;

    if (contentParseTimerRef.current)
      window.clearTimeout(contentParseTimerRef.current);

    contentParseTimerRef.current = window.setTimeout(() => {
      const raw = normalizeEscapedJsonish(content.streamedText);
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) return;

      const candidate = raw.slice(start, end + 1);
      try {
        const parsed = JSON.parse(candidate) as FinalContent;
        const body = parsed.body_markdown || "";

        if (!body) return;
        const finalContent = parsed?.final_content || parsed;
        dispatch({ type: "SET_ALL_CONTENT", payload: finalContent });
        dispatch({ type: "SET_GENERATED_CONTENT", payload: body });
        setTokenTarget("outline");
        tokenTargetRef.current = "none";
      } catch {
        // Not valid JSON yet
      }
    }, 250);

    return () => {
      if (contentParseTimerRef.current)
        window.clearTimeout(contentParseTimerRef.current);
    };
  }, [allContent, content.streamedText, showContentStream]);

  useEffect(() => {
    if (!outline.streamedText) return;
    if (tokenTargetRef.current !== "outline") return;
    if (parsedOutline) return;

    if (outlineParseTimerRef.current)
      window.clearTimeout(outlineParseTimerRef.current);
    outlineParseTimerRef.current = window.setTimeout(() => {
      const raw = outline.streamedText;
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) return;

      const candidate = raw.slice(start, end + 1);
      try {
        const parsed = JSON.parse(candidate) as Partial<ContentOutline>;
        if (!parsed || typeof parsed !== "object") return;

        const normalizedSections = Array.isArray(parsed.sections)
          ? (parsed.sections as Array<Partial<ContentSection> | null>).map(
              (s) => {
                const section = s ?? {};
                const keyPoints = Array.isArray(section.key_points)
                  ? section.key_points.filter(
                      (p: unknown) => typeof p === "string",
                    )
                  : [];
                const suggested =
                  typeof section.suggested_word_count === "number"
                    ? section.suggested_word_count
                    : undefined;
                return {
                  heading:
                    typeof section.heading === "string" ? section.heading : "",
                  description:
                    typeof section.description === "string"
                      ? section.description
                      : "",
                  key_points: keyPoints,
                  ...(suggested !== undefined
                    ? { suggested_word_count: suggested }
                    : {}),
                };
              },
            )
          : [];

        const normalized = {
          title: parsed.title,
          brief: parsed.brief,
          sections: normalizedSections,
          target_audience: Array.isArray(parsed.target_audience)
            ? parsed.target_audience.filter((a) => typeof a === "string")
            : [],
          tone: typeof parsed.tone === "string" ? parsed.tone : "",
          keywords_to_include: Array.isArray(parsed.keywords_to_include)
            ? parsed.keywords_to_include.filter((k) => typeof k === "string")
            : [],
          status: parsed.status === "rejected" ? "rejected" : "approved",
          rejected_reason:
            typeof parsed.rejected_reason === "string"
              ? parsed.rejected_reason
              : undefined,
          outline_retries:
            typeof parsed.outline_retries === "number"
              ? parsed.outline_retries
              : 0,
          draft_retries:
            typeof parsed.draft_retries === "number" ? parsed.draft_retries : 0,
          review_retries:
            typeof parsed.review_retries === "number"
              ? parsed.review_retries
              : 0,
          max_retries:
            typeof parsed.max_retries === "number" ? parsed.max_retries : 0,
          cluster_heading_map: Array.isArray(parsed.cluster_heading_map)
            ? parsed.cluster_heading_map
            : undefined,
        } satisfies ContentOutline;

        dispatch({ type: "SET_OUTLINE", payload: normalized });
      } catch {
        // Not valid JSON yet — keep streaming.
      }
    }, 200);

    return () => {
      if (outlineParseTimerRef.current)
        window.clearTimeout(outlineParseTimerRef.current);
    };
  }, [outline.streamedText, parsedOutline]);

  // ─────────────────────────────────────────────────────────────────────────
  // processStream — UPDATED to handle both event types
  // ─────────────────────────────────────────────────────────────────────────
  const processStream = async (
    stream: AsyncGenerator<RunStreamEvent>,
  ): Promise<void> => {
    try {
      dispatch({ type: "SET_KEYWORD_DIFFICULTY", payload: 0 });

      for await (const chunk of stream) {
        if (chunk.event === "run/created") {
          const runData = chunk.data as {
            run_id?: string;
            thread_id?: string;
          };
          const activeThreadId = runData.thread_id ?? threadId;
          if (activeThreadId) {
            updateBackgroundJob(activeThreadId, {
              runId: runData.run_id,
              status: "running",
              stage: "Drafting your article",
              progress: 12,
            });
          }
          continue;
        }

        // ── messages/partial — raw LLM tokens ─────────────────────────────────
        // Your SSE sends these token-by-token as the LLM writes text/JSON.
        if (
          chunk.event === "messages/partial" ||
          chunk.event?.startsWith("messages/partial|")
        ) {
          // biome-ignore lint/suspicious/noExplicitAny: SSE chunk structure is dynamic
          const msgData = (chunk.data as any)?.[0];
          const raw = msgData?.content;
          const token =
            typeof raw === "string"
              ? raw
              : Array.isArray(raw)
                ? raw.filter((p: unknown) => typeof p === "string").join("")
                : "";

          if (token) {
            if (tokenTargetRef.current === "outline")
              outline.appendToken(token);
            else if (tokenTargetRef.current === "content") {
              content.appendToken(token);
            }
          }

          continue;
        }

        // ── custom — agent streaming events (token, tool_start, tool_end) ──
        if (chunk.event === "custom" || chunk.event?.startsWith("custom|")) {
          // biome-ignore lint/suspicious/noExplicitAny: custom event payload
          const d = chunk.data as any;
          if (d?.type === "token" && tokenTargetRef.current === "content") {
            content.appendToken(d.content as string);
          } else if (d?.type === "tool_start") {
            const id = String(d.id ?? "");
            const name = String(d.name ?? "");
            const query = String(d.query ?? "");
            if (name === "humanize_content") {
              advancePipeline("Humanizing");
            }
            if (id) {
              setToolCalls((prev) => {
                if (prev.some((c) => c.id === id)) return prev;
                return [
                  ...prev,
                  { id, name, query, status: "running" as const },
                ];
              });
            }
          } else if (d?.type === "tool_end") {
            const id = String(d.id ?? "");
            const count = Number(d.count ?? 0);
            const output = d.output ? String(d.output) : undefined;
            if (id) {
              setToolCalls((prev) =>
                prev.map((tc) =>
                  tc.id === id
                    ? {
                        ...tc,
                        status: "done" as const,
                        resultCount: count,
                        output,
                      }
                    : tc,
                ),
              );
            }
          } else if (d?.type === "credits") {
            const credits = Number(d.current_credits ?? 0);
            const step = String(d.step ?? "credits.updated");
            if (step === "credits.updated") {
              patchCredits(credits);
            } else if (step === "credits.low") {
              patchCredits(credits);
              toast.warning(
                `Low credits: ${credits} remaining. Generation may not complete.`,
                {
                  duration: 10000,
                },
              );
            } else if (step === "credits.exhausted") {
              patchCredits(credits);
              // Stop the run immediately; `finally` below resets the loading state
              cancelStream();
              openCreditsModal();
              return;
            }
          }
          continue;
        }

        // Ignore non-update events like "metadata"
        if (!chunk.event?.startsWith("updates")) continue;

        // ── updates|* — fully parsed objects ──────────────────────────────────
        const updates = chunk.data as StreamUpdates;
        // console.log("Received updates:", updates);

        // generate_outline uses structured output (ainvoke) — no streaming tokens.
        // Extract the outline from the node update so it can be shown before the interrupt fires.
        const generateOutlineResult = (
          updates as {
            generate_outline?: { content?: { outline?: ContentOutline } };
          }
        )?.generate_outline?.content?.outline;
        if (generateOutlineResult) {
          dispatch({ type: "SET_OUTLINE", payload: generateOutlineResult });
          dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "outline_review" });
        }

        // Some graphs also emit the outline in a "review_outline" envelope (not in __interrupt__)
        const reviewOutline = (
          updates as {
            review_outline?: { content?: { outline?: ContentOutline } };
          }
        )?.review_outline?.content?.outline;
        if (reviewOutline) {
          dispatch({ type: "SET_OUTLINE", payload: reviewOutline });
          dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "outline_review" });
        }

        if (updates?.review_outline) {
          setIsEnhancing(true);
          setEnhancingMsg("Generating Content...");
          setEnhancingDescription(
            "Creating the first draft based on the approved outline...",
          );
          advancePipeline("Generating Content");
          if (threadId) {
            updateBackgroundJob(threadId, {
              status: "running",
              stage: "Drafting your article",
              progress: 28,
            });
          }
        }

        if (updates?.generate_content) {
          advancePipeline("Humanizing");
          if (threadId) {
            updateBackgroundJob(threadId, {
              status: "running",
              stage: "Refining tone and structure",
              progress: 58,
            });
          }
        }

        if (updates?.humanize_content) {
          advancePipeline("Reviewing Content");
          if (threadId) {
            updateBackgroundJob(threadId, {
              status: "running",
              stage: "Running quality checks",
              progress: 78,
            });
          }
        }

        if (updates?.review_content) {
          setPipelineSteps((prev) =>
            prev.map((s) => ({ ...s, status: "done" as const })),
          );
          if (threadId) {
            updateBackgroundJob(threadId, {
              status: "running",
              stage: "Finalizing SEO and readability",
              progress: 90,
            });
          }
        }

        if (updates?.content_engine) {
          setIsEnhancing(false);
          // Mark all pipeline steps done
          setPipelineSteps((prev) =>
            prev.map((s) => ({ ...s, status: "done" as const })),
          );
          if (threadId) {
            updateBackgroundJob(threadId, {
              status: "running",
              stage: "Preparing your article",
              progress: 96,
            });
          }
        }

        // Centralized handling for nodes that emit content updates

        const u = updates as unknown as NodeOutput;
        const nodeOutputs = [
          u.content,
          u.content_engine?.content,
          u.generate_content?.content,
          u.humanize_content?.content,
          u.inject_eeat?.content,
          u.review_content?.content,
          u.calculate_readability?.content,
          u.calculate_on_page_seo?.content,
          u.calculate_eeat_trust?.content,
        ].filter((o): o is CommonOutput => !!o);

        for (const out of nodeOutputs) {
          if (out.final_content && !isEditingRef.current) {
            dispatch({ type: "SET_ALL_CONTENT", payload: out.final_content });
            if (out.final_content.body_markdown) {
              dispatch({
                type: "SET_GENERATED_CONTENT",
                payload: out.final_content.body_markdown,
              });
            } else if (out.final_content.html_content) {
              dispatch({
                type: "SET_GENERATED_CONTENT",
                payload: htmlToMarkdownLite(out.final_content.html_content),
              });
            }
            setTokenTarget("none");
            tokenTargetRef.current = "none";

            dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
          }

          if (out.outline) {
            dispatch({ type: "SET_OUTLINE", payload: out.outline });
          }

          const review = out.review;
          if (review) {
            if (review.on_page_metrics)
              dispatch({
                type: "SET_SEO_SCORE",
                payload: review.on_page_metrics,
              });
            if (review.trust_score)
              dispatch({
                type: "SET_TRUST_SCORE",
                payload: review.trust_score,
              });
            if (review.readability_metrics)
              dispatch({
                type: "SET_READABILITY_SCORE",
                payload: review.readability_metrics,
              });
          }
        }

        if (updates.__interrupt__) {
          dispatch({ type: "SET_INTERRUPT", payload: updates.__interrupt__ });
          const recommendedContentType =
            updates.__interrupt__?.[0]?.value?.recommended_content_type;

          if (typeof recommendedContentType === "string") {
            dispatch({
              type: "SET_RECOMMENDED_CONTENT_TYPE",
              payload: recommendedContentType,
            });
          }
        }

        dispatch({ type: "UPDATE_FROM_STREAM", payload: updates });
        Object.keys(updates)
          .filter((k) => !k.startsWith("__"))
          .forEach((node) => {
            dispatch({
              type: "SET_LOADING_STATUS",
              payload: `${formatNodeName(node)}...`,
            });
          });
      }
    } catch (_e) {
      const isAbort = _e instanceof DOMException && _e.name === "AbortError";
      if (!isAbort) {
        analytics.track("content_generation_failed", {
          keyword: userKeyword,
          workspace_id: workspaceId ?? undefined,
          thread_id: threadId ?? undefined,
          error_message:
            _e instanceof Error ? _e.message : "Unknown stream error",
        });
        if (threadId) {
          updateBackgroundJob(threadId, {
            status: "failed",
            stage: "Generation failed",
            error:
              _e instanceof Error
                ? _e.message
                : "We could not finish this article.",
          });
        }
      }
    } finally {
      if (loadingStatus?.endsWith("..."))
        dispatch({
          type: "ADD_COMPLETED_NODE",
          payload: loadingStatus.slice(0, -3),
        });
      await new Promise((r) => setTimeout(r, 1500));
      dispatch({ type: "SET_MANUAL_LOADING", payload: false });
      dispatch({ type: "SET_LOADING_STATUS", payload: "" });
      dispatch({ type: "SET_LOADING_STEPS", payload: [] });
    }
  };

  // Keep a live handle so the background-restore effect (declared earlier) always
  // invokes the latest processStream closure instead of a stale one.
  const processStreamRef = useRef(processStream);
  processStreamRef.current = processStream;

  // ─────────────────────────────────────────────────────────────────────────
  // Workflow handlers — UNCHANGED
  // ─────────────────────────────────────────────────────────────────────────
  const handleKeywordSubmit = async () => {
    // Not enough for a whole article → stop before a thread or stream is ever created
    if (!ensureCredits()) return;
    if (streamBusyRef.current) return;
    streamBusyRef.current = true;

    try {
      cancelStream();
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      dispatch({ type: "CLEAR_COMPLETED_NODES" });
      dispatch({ type: "SET_LOADING_STEPS", payload: INITIAL_ANALYSIS_STEPS });
      dispatch({ type: "SET_MANUAL_LOADING", payload: true });
      dispatch({ type: "SET_LOADING_STATUS", payload: "Creating session..." });
      setTokenTarget("none");
      tokenTargetRef.current = "none";
      outline.resetStream();
      content.resetStream();

      const newThreadId = await createThread();
      if (!newThreadId) {
        dispatch({ type: "SET_MANUAL_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_THREAD_ID", payload: newThreadId });
      dispatch({ type: "SET_LOADING_STATUS", payload: "Starting analysis..." });

      const keyword = _initialKeyword || userKeyword;

      analytics.track("content_generation_started", {
        keyword,
        country,
        workspace_id: workspaceId ?? undefined,
        thread_id: newThreadId,
        from_library: isLibrary,
      });

      const stream = streamFromSSE(
        `/api/generate/${newThreadId}/stream`,
        {
          input: {
            serp_payload: {
              query: keyword,
              country,
              user_id: user?.id,
              workspace_id: workspaceId ?? undefined,
              is_library: isLibrary,
            },
            ...(selectedIntent || _initialIntent
              ? { final_intent_type: selectedIntent || _initialIntent }
              : {}),
          },
          streamMode: ["updates", "messages", "custom"],
          streamSubgraphs: true,
          onDisconnect: "continue",
        },
        signal,
      );

      await processStream(stream);
    } finally {
      streamBusyRef.current = false;
    }
  };

  const resumeWorkflow = async ({
    payload,
    status: statusMsg,
  }: ResumeOptions) => {
    if (!threadId) return;
    // Mid-article: the earlier stages are already paid for, so only a fully
    // exhausted balance stops the workflow advancing to the next step
    if (!ensureCreditsToContinue()) return;
    if (streamBusyRef.current) return;
    streamBusyRef.current = true;

    try {
      cancelStream();
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      dispatch({ type: "CLEAR_COMPLETED_NODES" });
      dispatch({ type: "SET_MANUAL_LOADING", payload: true });
      if (statusMsg)
        dispatch({ type: "SET_LOADING_STATUS", payload: statusMsg });

      const stream = streamFromSSE(
        `/api/generate/${threadId}/resume`,
        {
          payload,
          streamMode: ["updates", "messages", "custom"],
          streamSubgraphs: true,
          onDisconnect: "continue",
        },
        signal,
      );
      await processStream(stream);
    } finally {
      streamBusyRef.current = false;
    }
  };

  const startBackgroundWorkflow = async ({
    payload,
    status: statusMsg,
  }: ResumeOptions) => {
    if (!threadId || !ensureCreditsToContinue()) return;

    const now = new Date().toISOString();
    const resultUrl = `${workspaceRoutes.generate_content(
      workspaceSlug,
    )}?thread=${encodeURIComponent(threadId)}`;

    // Register the job so the background dock keeps tracking it (and can notify
    // on completion) if the user navigates away. We do NOT fire a detached
    // run or navigate: the stream below renders the draft on-page as before.
    // The run is server-owned (onDisconnect: "continue"), so it survives
    // navigation and the dock polls /status to completion from anywhere.
    upsertBackgroundJob({
      threadId,
      workspaceId: workspaceId ?? undefined,
      workspaceSlug,
      title: parsedOutline?.title || primaryKeyword || "Untitled article",
      keyword: primaryKeyword,
      status: "running",
      stage: "Drafting your article",
      progress: 12,
      createdAt: now,
      updatedAt: now,
      resultUrl,
      completionNotified: false,
    });

    toast.info("Generating your article", {
      description:
        "You can leave this page — we'll keep working and notify you when it's ready.",
    });

    // Live-stream on the current page so the article appears as it is written
    // (run/created + progress events keep the background job updated).
    await resumeWorkflow({ payload, status: statusMsg });
  };

  const handleWorkflow = (step: WorkflowStep, value: string) => {
    switch (step) {
      case "KEYWORD_SELECT":
        setTokenTarget("none");
        tokenTargetRef.current = "none";
        dispatch({
          type: "SET_LOADING_STEPS",
          payload: KEYWORD_SELECTION_STEPS,
        });
        dispatch({ type: "SET_USER_KEYWORD", payload: value });
        dispatch({ type: "SET_PRIMARY_KEYWORD", payload: value });
        analytics.track("keyword_selected", {
          keyword: value,
          workspace_id: workspaceId ?? undefined,
          thread_id: threadId ?? undefined,
        });
        return resumeWorkflow({
          payload: {
            "Primary Keyword": value,
            ...(selectedIntent ? { intent: selectedIntent } : {}),
          },
          status: "Content Type Selection...",
        });
      case "CONTENT_TYPE_SELECT":
        setTokenTarget("outline");
        tokenTargetRef.current = "outline";
        outline.resetStream();
        dispatch({ type: "SUBMIT_REJECT_REASON" });
        dispatch({
          type: "SET_LOADING_STEPS",
          payload: TOPIC_GENERATION_STEPS,
        });
        return resumeWorkflow({
          payload: { "Selected Content Type": value },
          status: "Topic Suggestions...",
        });
      case "TOPIC_SELECT":
        setTokenTarget("none");
        tokenTargetRef.current = "none";
        dispatch({
          type: "SET_LOADING_STEPS",
          payload: CONTENT_TYPE_STEPS,
        });
        analytics.track("title_selected", {
          title: value,
          keyword: primaryKeyword,
          workspace_id: workspaceId ?? undefined,
          thread_id: threadId ?? undefined,
        });
        return resumeWorkflow({
          payload: { selected_topic: value },
          status: "Content Outline Generation...",
        });
      case "TOPIC_REGENERATE":
        setTokenTarget("none");
        tokenTargetRef.current = "none";
        // Clear topics and stale outline to provide visual indicator of regeneration
        dispatch({ type: "SET_TOPICS", payload: [] });
        dispatch({ type: "SET_OUTLINE", payload: null });
        dispatch({
          type: "SET_LOADING_STEPS",
          payload: TOPIC_REGENERATION_STEPS,
        });
        return resumeWorkflow({
          payload: { action: "regenerate", feedback: value || "" },
          status: "Regenerating topics...",
        });

      case "OUTLINE_APPROVE":
        setTokenTarget("content");
        tokenTargetRef.current = "content";
        content.resetStream();
        setToolCalls([]);
        setPipelineSteps([]);
        dispatch({ type: "SET_GENERATED_CONTENT", payload: "" });
        dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
        dispatch({
          type: "SET_LOADING_STEPS",
          payload: FINAL_GENERATION_STEPS,
        });
        analytics.track("outline_approved", {
          keyword: primaryKeyword,
          workspace_id: workspaceId ?? undefined,
          thread_id: threadId ?? undefined,
        });
        return startBackgroundWorkflow({
          payload: {
            action: "approve",
            ...(parsedOutline?.tone ? { tone: parsedOutline.tone } : {}),
            ...(parsedOutline?.target_audience?.length
              ? { target_audience: parsedOutline.target_audience }
              : {}),
            ...(parsedOutline?.target_word_count && {
              target_word_count: parsedOutline.target_word_count,
            }),
          },
          status: "Approving and generating content...",
        });
      case "OUTLINE_REJECT":
        setTokenTarget("outline");
        tokenTargetRef.current = "outline";
        outline.resetStream();
        dispatch({ type: "SET_OUTLINE", payload: null });
        dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "outline_review" });
        return resumeWorkflow({ payload: { action: "reject" } });
      case "OUTLINE_REJECT_REASON":
        setTokenTarget("outline");
        tokenTargetRef.current = "outline";
        outline.resetStream();
        dispatch({ type: "SET_OUTLINE", payload: null });
        dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "outline_review" });
        dispatch({ type: "SUBMIT_REJECT_REASON" });

        return resumeWorkflow({ payload: { reason: value } });
      default: {
        const _never: never = step;
        return _never;
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading screen
  // ─────────────────────────────────────────────────────────────────────────
  const isTopicLoading =
    instructionType === "topic" ||
    instructionType === "topic_selection" ||
    instructionType === "keyword Selection";

  const isRegeneratingTopics =
    isManualLoading &&
    (instructionType === "topic" || instructionType === "topic_selection") &&
    topics.length === 0;

  // Suppress the loader in the library flow only when passively waiting for topics
  // (no steps dispatched). Once a topic is selected and steps are set, show the loader.
  const suppressLibraryTopicLoader =
    isLibrary && isTopicLoading && currentLoadingSteps.length === 0;

  const handleEditToggle = useCallback(
    () => dispatch({ type: "SET_IS_EDITING", payload: !isEditing }),
    [isEditing],
  );

  const handleContentChange = useCallback(
    (val: string) => {
      dispatch({ type: "SET_GENERATED_CONTENT", payload: val });
      if (allContent) {
        dispatch({
          type: "SET_ALL_CONTENT",
          payload: { ...allContent, body_markdown: val },
        });
      }
    },
    [allContent],
  );

  if (
    (isLoading || isManualLoading) &&
    !showOutlineReview &&
    !showContentStream &&
    (isRegeneratingTopics || !suppressLibraryTopicLoader)
  ) {
    return (
      <div
        className={cn(
          "max-w-3xl mx-auto w-full flex flex-col items-center relative lg:px-6 transition-all duration-700 mt-4",
          instructionType === "keyword"
            ? "min-h-[70vh] justify-center"
            : "min-h-0 pt-2",
        )}
      >
        <LoadingIndicatorVariants
          step={instructionType}
          isLoading={isLoading || isManualLoading}
          loadingStatus={loadingStatus}
          completedSteps={completedNodes}
          steps={currentLoadingSteps}
        />
      </div>
    );
  }

  const isKeywordFlow =
    instructionType === "keyword" || instructionType === "keyword Selection";

  const instructionViewMap: Record<string, React.ReactNode> = {
    "keyword Selection": isLibrary ? null : (
      <SuggestionsSection
        instruction={displayedInstruction}
        primaryKeyword={primaryKeyword}
        suggestedKeywords={suggestedKeywords}
        onSelect={(selected) => handleWorkflow("KEYWORD_SELECT", selected)}
        seoResult={seoResult}
        selectedIntent={selectedIntent}
        onIntentChange={setSelectedIntent}
        keywordClusters={keywordClusters}
      />
    ),
    topic: (
      <TopicsSection
        instruction={displayedInstruction}
        topics={topics}
        onSelect={(selected) => handleWorkflow("TOPIC_SELECT", selected)}
        onRegenerate={(fb) => handleWorkflow("TOPIC_REGENERATE", fb)}
        isRegenerating={
          isManualLoading && (loadingStatus?.includes("Regenerating") ?? false)
        }
        keyword={primaryKeyword}
      />
    ),
    content_type: (
      <ContentType
        recommendedContentType={recommendedContentType}
        instruction={displayedInstruction}
        contentTypes={contentTypes}
        handleContentTypeSelect={(selected) =>
          handleWorkflow("CONTENT_TYPE_SELECT", selected)
        }
      />
    ),

    outline_reject: (
      <OutlineRejectSection
        instruction={displayedInstruction}
        rejectedReason={rejectedReason}
        onChange={(val) =>
          dispatch({ type: "SET_REJECTED_REASON", payload: val })
        }
        onSubmit={() => handleWorkflow("OUTLINE_REJECT_REASON", rejectedReason)}
      />
    ),
  };

  const WORKFLOW_STEPS = [
    { id: "keyword", label: "Search Keyword" },
    { id: "keyword Selection", label: "Select Keyword" },
    { id: "content_type", label: "Content Type" },
    { id: "topic", label: "Topic Selection", aliases: ["topic_selection"] },
    {
      id: "outline_review",
      label: "Content Outline",
      aliases: ["outline_reject"],
    },
    { id: "content", label: "Article" },
  ];

  const activeStepIndex = (() => {
    const idx = WORKFLOW_STEPS.findIndex(
      (s) =>
        s.id === instructionType || (s.aliases ?? []).includes(instructionType),
    );
    return idx === -1 ? WORKFLOW_STEPS.length - 1 : idx;
  })();

  return (
    <div className="relative">
      <div
        className={cn(
          "max-w-3xl mx-auto w-full flex flex-col items-center justify-center relative lg:px-8 transition-all duration-700",
          instructionType === "keyword"
            ? "min-h-[70vh]"
            : !showContentStream
              ? "min-h-[85vh]"
              : "min-h-0",
          instructionType === "outline_review"
            ? "justify-start"
            : " justify-center",
        )}
      >
        {/* Persistent workflow step indicator */}
        {!showContentStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={cn(
              "mt-5",
              activeStepIndex === 0 ? "mx-auto" : "mr-auto",
            )}
          >
            <WorkflowStepIndicator
              steps={WORKFLOW_STEPS}
              activeStepIndex={activeStepIndex}
            />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {instructionType === "keyword" && <HeroSection />}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full"
        >
          {isKeywordFlow && !isLibrary && (
            <KeywordForm
              userKeyword={userKeyword}
              country={country}
              disabled={isManualLoading}
              onSubmit={handleKeywordSubmit}
              onKeywordChange={(val) =>
                dispatch({ type: "SET_USER_KEYWORD", payload: val })
              }
              onCountryChange={(val) =>
                dispatch({ type: "SET_COUNTRY", payload: val })
              }
            />
          )}
        </motion.div>

        {showOutlineReview ? (
          <div className="w-full mt-0">
            <OutlineDisplay
              outline={parsedOutline}
              rawTokens={outline.streamedText}
              isLoading={isStreamingOutline}
              internalLinks={interruptInternalLinks}
              brandVoicePromotion={interruptBrandVoicePromotion}
              onApprove={(selectedLinks, promoteBrand) => {
                setTokenTarget("content");
                tokenTargetRef.current = "content";
                content.resetStream();
                setToolCalls([]);
                setPipelineSteps([]);
                dispatch({ type: "SET_GENERATED_CONTENT", payload: "" });
                dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
                dispatch({
                  type: "SET_LOADING_STEPS",
                  payload: FINAL_GENERATION_STEPS,
                });
                analytics.track("outline_approved", {
                  keyword: primaryKeyword,
                  workspace_id: workspaceId ?? undefined,
                  thread_id: threadId ?? undefined,
                });
                void startBackgroundWorkflow({
                  payload: {
                    action: "approve",
                    ...(parsedOutline?.tone
                      ? { tone: parsedOutline.tone }
                      : {}),
                    ...(parsedOutline?.target_audience?.length
                      ? { target_audience: parsedOutline.target_audience }
                      : {}),
                    ...(parsedOutline?.target_word_count && {
                      target_word_count: parsedOutline.target_word_count,
                    }),
                    ...(interruptInternalLinks?.length
                      ? { selected_internal_links: selectedLinks }
                      : {}),
                    ...(interruptBrandVoicePromotion
                      ? { promote_brand: promoteBrand }
                      : {}),
                  },
                  status: "Approving and generating content...",
                });
              }}
              onReject={() => handleWorkflow("OUTLINE_REJECT", "")}
              onUpdate={(updatedOutline) =>
                dispatch({ type: "SET_OUTLINE", payload: updatedOutline })
              }
              keywordClusters={keywordClusters}
            />
          </div>
        ) : (
          <div className="w-full">{instructionViewMap[instructionType]}</div>
        )}
      </div>

      {showContentStream && isManualLoading && !restoreError && (
        <div className="mx-auto mb-4 mt-5 flex w-full max-w-5xl flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Generating in the background
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You can leave this page. We will notify you when your article is
              ready.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 bg-background sm:w-auto"
            onClick={() =>
              router.push(
                workspaceRoutes.content_calendar(workspaceSlug) as Route,
              )
            }
          >
            <CalendarDays className="h-4 w-4" />
            Open content calendar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {restoreError && (
        <div className="mx-auto my-8 flex w-full max-w-2xl items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              We could not restore this article
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{restoreError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                router.push(
                  workspaceRoutes.generate_content(workspaceSlug) as Route,
                )
              }
            >
              Start a new article
            </Button>
          </div>
        </div>
      )}

      {/* ── Content: stream tokens live, then hand off to ContentEditor ── */}
      {showContentStream && !restoreError && (
        <div className={!isContentFinal ? "relative" : undefined}>
          <ContentEditor
            threadId={threadId ?? undefined}
            allContent={
              isContentFinal ? allContent : (allContent ?? streamedAllContent)
            }
            isEnhancing={isEnhancing}
            enhancingMsg={enhancingMsg}
            enhancingDescription={enhancingDescription}
            readabilityScore={readabilityScore}
            seoScore={seoScore}
            trustScore={trustScore}
            generatedContent={
              isContentFinal ? generatedContent : displayedBodyMarkdown
            }
            isEditing={isEditing}
            userKeyword={userKeyword}
            outline={parsedOutline}
            toolCalls={toolCalls}
            pipelineSteps={pipelineSteps}
            onEditToggle={handleEditToggle}
            onContentChange={handleContentChange}
          />
        </div>
      )}

      {creditsModal}
    </div>
  );
}
