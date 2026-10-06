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
import { announceBackgroundGenerationRemoval } from "@/lib/generate-content/background-generation-sync";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { RunProgress } from "@/components/generate-content/run-progress";
import { useRunStages } from "@/hooks/use-run-stages";
import {
  FIRST_ARTICLE_TOKEN,
  type RunPhase,
} from "@/lib/generate-content/run-stages";
import { useTypewriter } from "@/hooks/use-typewriter";
import { useStreamingText } from "@/hooks/use-streaming-text";
import type {
  CommonOutput,
  ContentOutline,
  BrandVoicePromotion,
  ContentSection,
  FinalContent,
  InternalLinkSuggestion,
  Interrupt,
  NodeOutput,
  ResumeOptions,
  RunStreamEvent,
  SEORESULT,
  StreamUpdates,
  WREXT,
  WorkflowStep,
} from "@/types/generate-content";
import { HeroSection } from "@/components/generate-content/hero";
import { KeywordForm } from "@/components/generate-content/keyword";
import { SuggestionsSection } from "@/components/generate-content/suggestions";
import { TitleStep } from "@/components/generate-content/title-step";
import { StepColumn } from "@/components/layouts";
import {
  OutlineDisplay,
  OutlineRejectSection,
} from "@/components/generate-content/outline";
import { ContentEditor } from "@/components/generate-content/content";
import ContentType from "./content-type";
import { WorkflowStepIndicator } from "@/components/generate-content/workflow-step-indicator";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authenticatedFetch } from "@/lib/auth-utils";
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
import type { ToolCall } from "@/types/generate-content";
import { analytics } from "@/lib/analytics";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useBackgroundGenerationStore } from "@/stores/background-generation-store";
import { useWorkspace } from "@/providers/workspace-provider";
import { RunNotice } from "@/components/generate-content/run-notice";
import {
  GENERATION_STREAM_MODES,
  isOutlineToken,
  readMessageToken,
  readRunFailedEvent,
  readStoppedRun,
  runIsGoing,
  settlesRun,
} from "@/lib/generate-content/run-events";
import { workspaceRoutes } from "@/lib/routes";
import { isKeywordReanalysis } from "@/lib/generate-content/keyword-reanalysis";
import { toast } from "sonner";
import type { Route } from "next";
import { deriveActiveGenerationViewState } from "@/lib/generate-content/background-generation-view-state";
import {
  collectPendingInterrupts,
  deriveAwaitingInputStage,
} from "@/lib/generate-content/background-progress";
import {
  BACKGROUND_GENERATION_RESTORE_EVENT,
  type BackgroundGenerationRestoreDetail,
  requestBackgroundGenerationRestore,
} from "@/lib/generate-content/background-generation-sync";
import {
  formatWordCountRange,
  getContentTypeWordCountRange,
  type WordCountRange,
} from "@/lib/generate-content/content-type-word-count";

// Derived progress at which the workflow has left the interactive research
// steps and is writing the article — the only phase that gets the content
// editor overlay and the live content token stream on restore.
const ARTICLE_PHASE_PROGRESS = 42;
const isArticlePhase = (progress?: number) =>
  (progress ?? 0) >= ARTICLE_PHASE_PROGRESS;

interface FreshGenerationViewProps {
  onBack: () => void;
  initialKeyword?: string;
  initialIntent?: string;
  isLibrary?: boolean;
  /** The Library item a Library start names (its store key); the backend loads its research. */
  libraryKey?: string;
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
  // Sometimes the streamed article is a JSON string with quotes escaped:
  // {\"title\":\"...\",\"body_markdown\":\"...\"}
  // Normalize it so field extraction works.
  return raw.includes('\\"') ? raw.replace(/\\"/g, '"') : raw;
};

const extractRequestedTargetWordCount = (feedback: string): number | null => {
  const match = feedback.match(
    /\b(?:target\s+)?word\s*(?:count|length)\s*(?:should\s*be|is|to|of|:|=)?\s*([\d,]{2,6})\b|\b([\d,]{2,6})\s*(?:-|\s)?words?\b/i,
  );
  const rawCount = match?.[1] ?? match?.[2];
  if (!rawCount) return null;

  const count = Number(rawCount.replaceAll(",", ""));
  return Number.isInteger(count) && count >= 100 && count <= 10_000
    ? count
    : null;
};

const showWordCountRangeError = (
  requestedCount: number,
  contentType: string | undefined,
  wordCountRange: WordCountRange,
) => {
  const typeLabel = contentType || "selected content type";
  toast.error("Word count is outside the allowed range", {
    description: `${typeLabel} supports ${formatWordCountRange(wordCountRange)}. ${requestedCount.toLocaleString()} words cannot be used.`,
  });
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
  onBack,
  initialKeyword: _initialKeyword = "",
  initialIntent: _initialIntent = "",
  isLibrary = false,
  libraryKey,
  backgroundThreadId,
}: FreshGenerationViewProps) {
  const [state, dispatch] = useReducer(generationReducer, initialState);
  // The run on screen as named stages (RunProgress): started with each phase the page waits on,
  // moved by the stream's node updates (processStream), cleared when the page stops waiting.
  const runStages = useRunStages();
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
  const removeBackgroundJob = useBackgroundGenerationStore(
    (store) => store.removeJob,
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

  // Which buffer should receive streamed tokens right now?
  const tokenTargetRef = useRef<"none" | "outline" | "content">("none");
  const [tokenTarget, setTokenTarget] = useState<
    "none" | "outline" | "content"
  >("none");
  const {
    userKeyword,
    country,
    analyzedCountry,
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
    isLoading,
    readabilityScore,
    checklist,
    seoScore,
    trustScore,
    allContent,
    run: runState,
    keywordClusters,
    recommendedContentType,
    selectedContentType,
    recommendedTopic,
  } = state;

  const { start: startRunStages, clear: clearRunStages } = runStages;
  useEffect(() => {
    if (runState) {
      startRunStages(runState.phase, {
        joined: runState.joined,
        at: runState.stageId,
      });
    } else clearRunStages();
  }, [runState, startRunStages, clearRunStages]);

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

  // Tracks which thread the current live stream belongs to. Allows the restore
  // effect to distinguish "same thread" (skip) from "different thread" (abort
  // and switch). Without this, switching between concurrent generations was
  // silently blocked by streamBusyRef.
  const streamingThreadRef = useRef<string | null>(null);

  // Set by `run/created`: proof the server actually started a run for the
  // current attempt. A resume that ends without it left nothing behind.
  const runCreatedRef = useRef(false);

  // Track generation completion once per thread to avoid duplicate events
  const trackedThreadRef = useRef<string | null>(null);
  const trackedKeywordSearchRef = useRef<string | null>(null);
  const trackedTitleSuggestionsRef = useRef<string | null>(null);
  const trackedOutlineGeneratedRef = useRef<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  // A run the backend ended early (no search results, a failed lookup).
  const [runError, setRunError] = useState<string | null>(null);
  const [backgroundRestoreRevision, setBackgroundRestoreRevision] = useState(0);
  const [isBackgroundGenerationActive, setIsBackgroundGenerationActive] =
    useState(Boolean(backgroundThreadId));
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancingMsg, setEnhancingMsg] = useState("Enhancing content...");
  const [enhancingDescription, setEnhancingDescription] = useState("");
  const [pendingTargetWordCount, setPendingTargetWordCount] = useState<
    number | null
  >(null);

  const restoreActiveGenerationView = useCallback(
    (progress?: number, stage?: string) => {
      const activeView = deriveActiveGenerationViewState(progress, stage);
      setIsBackgroundGenerationActive(true);
      setEnhancingMsg(activeView.message);
      setEnhancingDescription(activeView.description);
    },
    [],
  );

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  // The thread's latest run as the server has it, or null when it has none (or
  // the check fails). The stream routes announce a run (`run/created`) with
  // its first chunk, so a connection lost before that hides a run that goes on.
  const readLatestRun = async (
    runThreadId: string,
  ): Promise<{ status?: string } | null> => {
    try {
      const response = await authenticatedFetch(
        `/api/generate/${encodeURIComponent(runThreadId)}/status`,
        { cache: "no-store" },
      );
      if (!response.ok) return null;
      const payload = (await response.json()) as {
        run?: { status?: string } | null;
      };
      return payload.run ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!backgroundThreadId) return;

    const handleRestoreRequest = (event: Event) => {
      const { threadId: requestedThreadId } = (
        event as CustomEvent<BackgroundGenerationRestoreDetail>
      ).detail;
      if (requestedThreadId === backgroundThreadId) {
        setBackgroundRestoreRevision((revision) => revision + 1);
      }
    };

    window.addEventListener(
      BACKGROUND_GENERATION_RESTORE_EVENT,
      handleRestoreRequest,
    );
    return () =>
      window.removeEventListener(
        BACKGROUND_GENERATION_RESTORE_EVENT,
        handleRestoreRequest,
      );
  }, [backgroundThreadId]);

  // Cancel on unmount (e.g. user navigates away)
  // biome-ignore lint/correctness/useExhaustiveDependencies: cancelStream is stable (uses refs internally), dep array intentionally empty
  useEffect(() => {
    return () => cancelStream();
  }, []);

  const hydrateFromBackgroundState = useCallback(
    (values: Partial<WREXT>) => {
      const restoredContent = values.content;
      const finalContent = restoredContent?.final_content;

      const review = restoredContent?.review as
        | (NonNullable<typeof restoredContent>["review"] & {
            on_page_metrics?: SEORESULT;
          })
        | undefined;

      dispatch({ type: "SET_THREAD_ID", payload: backgroundThreadId ?? null });
      dispatch({
        type: "SET_USER_KEYWORD",
        payload:
          values.serp_payload?.query ??
          finalContent?.focus_keyphrase ??
          finalContent?.primary_keyword ??
          "",
      });
      dispatch({
        type: "SET_PRIMARY_KEYWORD",
        payload:
          finalContent?.focus_keyphrase ??
          finalContent?.primary_keyword ??
          values.serp_payload?.query ??
          "",
      });
      dispatch({
        type: "SET_OUTLINE",
        payload: restoredContent?.outline ?? null,
      });
      if (finalContent) {
        dispatch({ type: "SET_ALL_CONTENT", payload: finalContent });
        dispatch({
          type: "SET_GENERATED_CONTENT",
          payload:
            finalContent.body_markdown ||
            htmlToMarkdownLite(finalContent.html_content ?? ""),
        });
      }
      if (review?.readability_metrics) {
        dispatch({
          type: "SET_READABILITY_SCORE",
          payload: review.readability_metrics,
        });
      }
      if (review?.checklist) {
        dispatch({ type: "SET_CHECKLIST", payload: review.checklist });
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
      return Boolean(finalContent);
    },
    [backgroundThreadId],
  );

  // Every interactive step (keyword selection, content type, topics, outline
  // review) is rendered purely from its `interrupt()` payload, so replaying the
  // thread's pending interrupt through the same reducer path the live stream
  // uses restores whichever step the workflow is waiting on.
  const hydrateFromPendingInterrupt = useCallback(
    (interrupts: Interrupt[], values?: Partial<WREXT>) => {
      dispatch({ type: "SET_THREAD_ID", payload: backgroundThreadId ?? null });

      const query = values?.serp_payload?.query;
      const selectedKeyword = values?.["Primary Keyword"] || query;
      if (query) dispatch({ type: "SET_USER_KEYWORD", payload: query });
      if (selectedKeyword)
        dispatch({ type: "SET_PRIMARY_KEYWORD", payload: selectedKeyword });
      if (values?.serp_payload?.country)
        dispatch({
          type: "SET_COUNTRY",
          payload: values.serp_payload.country,
        });

      const value = interrupts[0]?.value;
      if (typeof value?.recommended_content_type === "string")
        dispatch({
          type: "SET_RECOMMENDED_CONTENT_TYPE",
          payload: value.recommended_content_type,
        });
      if (typeof value?.recommended_topic === "string")
        dispatch({
          type: "SET_RECOMMENDED_TOPIC",
          payload: value.recommended_topic,
        });

      dispatch({ type: "SET_INTERRUPT", payload: interrupts });
      dispatch({
        type: "UPDATE_FROM_STREAM",
        payload: { __interrupt__: interrupts } as StreamUpdates,
      });
    },
    [backgroundThreadId],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: processStream/cancelStream are declared later and are intentionally not deps (accessed via ref / at call time)
  useEffect(() => {
    if (!backgroundThreadId) return;
    // A stream is live — but is it for THIS thread or a DIFFERENT one?
    // Same thread: skip restore (the original guard's intent — don't abort a
    //   stream to rejoin the same run it's already reading).
    // Different thread: the user switched to another generation. Abort the
    //   outgoing stream so we can restore the requested one.
    if (streamBusyRef.current) {
      if (streamingThreadRef.current === backgroundThreadId) return;
      // Abort the outgoing stream; processStream's finally will see itself as
      // superseded and skip UI teardown so it doesn't clobber the new restore.
      cancelStream();
      streamBusyRef.current = false;
      streamingThreadRef.current = null;
    }

    let disposed = false;
    let retryId: number | undefined;
    let consecutiveFailures = 0;

    dispatch({ type: "SET_THREAD_ID", payload: backgroundThreadId });
    // Clear stale content / scores / outline from a previously-viewed thread
    // so they don't bleed into this thread's view (e.g. showing a finished
    // article underneath a different thread's outline step).
    dispatch({ type: "RESET_FOR_THREAD_SWITCH" });
    // Also reset local component state that lives outside the reducer.
    setTokenTarget("none");
    tokenTargetRef.current = "none";
    outline.resetStream();
    content.resetStream();
    setToolCalls([]);
    dispatch({ type: "SET_MANUAL_LOADING", payload: true });
    dispatch({
      type: "SET_LOADING_STATUS",
      payload: "Restoring background generation...",
    });
    const trackedJob = useBackgroundGenerationStore
      .getState()
      .jobs.find((job) => job.threadId === backgroundThreadId);

    if (isArticlePhase(trackedJob?.progress)) {
      dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
      dispatch({
        type: "SET_RUN_PHASE",
        payload: {
          phase: "article",
          stageId:
            trackedJob?.runStage?.phase === "article"
              ? trackedJob.runStage.id
              : undefined,
          joined: true,
        },
      });
      restoreActiveGenerationView(trackedJob?.progress, trackedJob?.stage);
    } else {
      // Research phase — show the plain analysis loader, not the article editor.
      dispatch({
        type: "SET_RUN_PHASE",
        payload: {
          phase: trackedJob?.runStage?.phase ?? "analysis",
          stageId: trackedJob?.runStage?.id,
          joined: true,
        },
      });
      setIsBackgroundGenerationActive(false);
    }
    setRestoreError(null);
    // A notice belongs to the run it came from, not to the next one opened.
    setRunError(null);

    const restore = async () => {
      let terminalFailure = false;
      try {
        const response = await authenticatedFetch(
          `/api/generate/${encodeURIComponent(backgroundThreadId)}/status?includeState=true`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          run?: { id?: string; status?: string };
          state?: {
            values?: Partial<WREXT>;
            tasks?: Array<{ interrupts?: Interrupt[] }>;
          };
          progress?: number;
          stage?: string;
          error?: string;
          awaitingInput?: boolean;
          runStage?: { phase: RunPhase; id: string };
        };

        if (!response.ok && response.status !== 202) {
          throw new Error(payload.error || "Unable to restore this article");
        }
        if (disposed) return;

        // A run the backend ended for want of search results is a finished
        // state, not a failure to restore: show the notice the live stream
        // shows (its event is not replayed on a restore).
        const stoppedMessage = readStoppedRun(payload.state?.values);
        if (stoppedMessage) {
          setRunError(stoppedMessage);
          setIsBackgroundGenerationActive(false);
          setIsEnhancing(false);
          dispatch({ type: "SET_MANUAL_LOADING", payload: false });
          updateBackgroundJob(backgroundThreadId, {
            status: "failed",
            stage: "Generation stopped",
            error: stoppedMessage,
          });
          return;
        }

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

        const inArticlePhase = isArticlePhase(payload.progress);
        // Interactive steps interrupt inside a subgraph, so the pending
        // interrupt can sit one level down under `tasks[].state`.
        const pendingInterrupts = collectPendingInterrupts(
          payload.state,
        ) as Interrupt[];

        // The run paused for user input: restore that step's interactive view
        // instead of the article editor. This is what makes leaving during
        // keyword analysis (or any other step) safe to come back to.
        if (payload.awaitingInput && pendingInterrupts.length > 0) {
          hydrateFromPendingInterrupt(pendingInterrupts, payload.state?.values);
          setIsBackgroundGenerationActive(false);
          setIsEnhancing(false);
          dispatch({ type: "SET_MANUAL_LOADING", payload: false });
          dispatch({ type: "SET_LOADING_STATUS", payload: "" });
          dispatch({ type: "SET_RUN_PHASE", payload: null });
          updateBackgroundJob(backgroundThreadId, {
            status: "completed",
            stage: payload.stage ?? "Waiting for your input",
            progress: payload.progress ?? 24,
            awaitingInput: true,
            // The user is looking at the step — no need to also toast it.
            completionNotified: true,
          });
          return;
        }

        const hasFinalContent =
          payload.state?.values &&
          (inArticlePhase || payload.run?.status === "success")
            ? hydrateFromBackgroundState(payload.state.values)
            : false;

        if (payload.run?.status === "success") {
          if (hasFinalContent) {
            setIsBackgroundGenerationActive(false);
            setIsEnhancing(false);
            dispatch({ type: "SET_MANUAL_LOADING", payload: false });
            dispatch({ type: "SET_LOADING_STATUS", payload: "" });
            dispatch({ type: "SET_RUN_PHASE", payload: null });
            updateBackgroundJob(backgroundThreadId, {
              status: "completed",
              stage: "Article ready",
              progress: 100,
            });
            return;
          }
          terminalFailure = true;
          throw new Error(
            payload.awaitingInput
              ? "This generation is waiting on a step we could not restore."
              : "Generation finished, but the article result was unavailable.",
          );
        }

        updateBackgroundJob(backgroundThreadId, {
          status: "running",
          stage: payload.stage ?? "Generating your article",
          progress: payload.progress ?? 24,
          awaitingInput: false,
          runStage: payload.runStage,
        });

        // The status names the stage the run is in: the stages start there, not
        // at the phase's first one.
        dispatch({ type: "SET_MANUAL_LOADING", payload: true });
        dispatch({
          type: "SET_RUN_PHASE",
          payload: {
            phase:
              payload.runStage?.phase ??
              (inArticlePhase ? "article" : "analysis"),
            stageId: payload.runStage?.id,
            joined: true,
          },
        });
        if (inArticlePhase) {
          restoreActiveGenerationView(payload.progress, payload.stage);
        }

        // Run still in progress: reconnect to its live token stream so the
        // article renders as it's written (same as staying on the page),
        // instead of showing a poll-only skeleton until completion.
        const runId = payload.run?.id;
        if (runId) {
          if (inArticlePhase) {
            setTokenTarget("content");
            tokenTargetRef.current = "content";
          }
          dispatch({
            type: "SET_LOADING_STATUS",
            payload: payload.stage ?? "Generating your article...",
          });
          cancelStream();
          abortControllerRef.current = new AbortController();
          const { signal } = abortControllerRef.current;
          streamBusyRef.current = true;
          streamingThreadRef.current = backgroundThreadId;
          try {
            const stream = streamFromSSE(
              `/api/generate/${encodeURIComponent(backgroundThreadId)}/join`,
              { runId },
              signal,
            );
            await processStreamRef.current(stream);
          } catch {
            // Join dropped or the run just ended — the re-check below reconciles.
          } finally {
            streamBusyRef.current = false;
            streamingThreadRef.current = null;
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
        setIsBackgroundGenerationActive(false);
        setIsEnhancing(false);
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
  }, [
    backgroundThreadId,
    backgroundRestoreRevision,
    hydrateFromBackgroundState,
    hydrateFromPendingInterrupt,
    restoreActiveGenerationView,
    updateBackgroundJob,
  ]);

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
  const outlineWordCountRange = getContentTypeWordCountRange(
    parsedOutline?.schema_type,
  );

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

  // ── Tool call tracking for agent activity feed ────────────────────────────
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

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
  /**
   * Reads a run's stream into the view. Resolves to whether the run reached a
   * point the page can show (`settlesRun`): false means the stream closed while
   * the run was still going on the server.
   */
  const processStream = async (
    stream: AsyncGenerator<RunStreamEvent>,
  ): Promise<boolean> => {
    // `threadId` is still stale in this closure for the very first run (the
    // reducer dispatch has not re-rendered yet), so track it locally and let
    // `run/created` confirm it.
    let activeThreadId = threadId ?? backgroundThreadId ?? null;
    let settled = false;
    // The backend ended the run early (run.failed): its stages fail, they don't complete.
    let stopped = false;
    // The first article token this stream reads ends Research (once per stream).
    let writing = false;

    try {
      dispatch({ type: "SET_KEYWORD_DIFFICULTY", payload: 0 });

      for await (const chunk of stream) {
        if (settlesRun(chunk)) settled = true;
        if (chunk.event === "run/created") {
          const runData = chunk.data as {
            run_id?: string;
            thread_id?: string;
          };
          runCreatedRef.current = true;
          activeThreadId = runData.thread_id ?? activeThreadId;
          if (activeThreadId) {
            // Stage/progress belong to whichever phase started this run; only
            // the run identity and "this job is live again" are known here.
            updateBackgroundJob(activeThreadId, {
              runId: runData.run_id,
              status: "running",
              awaitingInput: false,
              runStage: undefined,
              completionNotified: false,
            });
          }
          continue;
        }

        // ── messages — one model token per event (messages-tuple) ────────────
        // Only the outline's model feeds a buffer here. The article's text
        // arrives as `custom` token events, which generate_content writes.
        const message = readMessageToken(chunk);
        if (message) {
          if (
            message.token &&
            tokenTargetRef.current === "outline" &&
            isOutlineToken(message)
          ) {
            outline.appendToken(message.token);
          }
          continue;
        }

        // ── custom — agent streaming events (token, tool_start, tool_end) ──
        if (chunk.event === "custom" || chunk.event?.startsWith("custom|")) {
          // biome-ignore lint/suspicious/noExplicitAny: custom event payload
          const d = chunk.data as any;
          if (d?.type === "token" && tokenTargetRef.current === "content") {
            // The agent has stopped searching and writes: Research ends, Draft runs.
            if (!writing) {
              writing = true;
              runStages.nodeDone(FIRST_ARTICLE_TOKEN);
              setEnhancingMsg("Draft");
              setEnhancingDescription(
                "Writing the article from the approved outline and its sources.",
              );
              if (activeThreadId) {
                updateBackgroundJob(activeThreadId, {
                  status: "running",
                  stage: "Draft",
                });
              }
            }
            content.appendToken(d.content as string);
          } else if (d?.type === "tool_start") {
            const id = String(d.id ?? "");
            const name = String(d.name ?? "");
            const query = String(d.query ?? "");
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
          } else if (d?.type === "run") {
            const runFailed = readRunFailedEvent(d);
            if (runFailed) {
              stopped = true;
              runStages.fail();
              setRunError(runFailed.message);
              if (activeThreadId) {
                updateBackgroundJob(activeThreadId, {
                  status: "failed",
                  stage: "Generation stopped",
                  error: runFailed.message,
                });
              }
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
              return true;
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
          setPendingTargetWordCount(null);
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
          setEnhancingMsg("Research");
          setEnhancingDescription(
            "Searching for sources for the approved outline.",
          );
          if (activeThreadId) {
            updateBackgroundJob(activeThreadId, {
              status: "running",
              stage: "Research",
              progress: ARTICLE_PHASE_PROGRESS,
            });
          }
        }

        if (updates?.generate_content) {
          setEnhancingMsg("Style pass");
          setEnhancingDescription(
            "Checking the draft against the outline and smoothing its wording and flow.",
          );
          if (activeThreadId) {
            updateBackgroundJob(activeThreadId, {
              status: "running",
              stage: "Style pass",
              progress: 58,
            });
          }
        }

        if (updates?.humanize_content) {
          setEnhancingMsg("Checks");
          setEnhancingDescription(
            "Validation, readability, on-page SEO and trust.",
          );
          if (activeThreadId) {
            updateBackgroundJob(activeThreadId, {
              status: "running",
              stage: "Checks",
              progress: 78,
            });
          }
        }

        if (updates?.review_content) {
          if (activeThreadId) {
            updateBackgroundJob(activeThreadId, {
              status: "running",
              stage: "Checks",
              progress: 90,
            });
          }
        }

        if (updates?.content_engine) {
          setIsEnhancing(false);
          if (activeThreadId) {
            updateBackgroundJob(activeThreadId, {
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
          u.review_content?.content,
          u.calculate_readability?.content,
          u.calculate_on_page_seo?.content,
          u.calculate_eeat_trust?.content,
          u.persist_content?.content,
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
            if (review.checklist)
              dispatch({ type: "SET_CHECKLIST", payload: review.checklist });
          }
        }

        if (updates.__interrupt__) {
          // The run just paused for the user, so no further tokens belong to
          // the previous phase. Releasing the target matters most on restore:
          // a stale "content" target keeps `showOutlineReview` false and the
          // article overlay up, hiding the approve/reject step entirely.
          setTokenTarget("none");
          tokenTargetRef.current = "none";
          dispatch({ type: "SET_INTERRUPT", payload: updates.__interrupt__ });
          const recommendedContentType =
            updates.__interrupt__?.[0]?.value?.recommended_content_type;
          const recommendedTopic =
            updates.__interrupt__?.[0]?.value?.recommended_topic;
          const interruptType = updates.__interrupt__?.[0]?.value?.type;

          // A new outline-review interrupt means regeneration is complete, so
          // replace the optimistic target with the server-confirmed outline.
          if (interruptType === "outline_review") {
            setPendingTargetWordCount(null);
          }

          if (typeof recommendedContentType === "string") {
            dispatch({
              type: "SET_RECOMMENDED_CONTENT_TYPE",
              payload: recommendedContentType,
            });
          }
          if (typeof recommendedTopic === "string") {
            dispatch({
              type: "SET_RECOMMENDED_TOPIC",
              payload: recommendedTopic,
            });
          }

          // The run is about to pause for this step. Record it now (and mark it
          // notified — the user is looking at it) so the dock reflects reality
          // before its next poll and doesn't toast a step already on screen.
          if (activeThreadId) {
            const awaiting = deriveAwaitingInputStage(
              updates.__interrupt__?.[0]?.value?.type,
            );
            updateBackgroundJob(activeThreadId, {
              status: "completed",
              awaitingInput: true,
              completionNotified: true,
              ...awaiting,
            });
          }
        }

        dispatch({ type: "UPDATE_FROM_STREAM", payload: updates });
        Object.keys(updates)
          .filter((k) => !k.startsWith("__"))
          .forEach((node) => {
            runStages.nodeDone(node);
            dispatch({
              type: "SET_LOADING_STATUS",
              payload: `${formatNodeName(node)}...`,
            });
          });
      }
    } catch (_e) {
      const isAbort = _e instanceof DOMException && _e.name === "AbortError";
      if (!isAbort && runCreatedRef.current) {
        // The stream broke, not the run: it was started with onDisconnect
        // "continue" and goes on on the server (leaving the page mid-run, a
        // dropped connection). Keep the job running so the dock's status poll
        // reports how it really ends, instead of a "network error" failure.
        if (activeThreadId) {
          updateBackgroundJob(activeThreadId, { status: "running" });
        }
      } else if (!isAbort) {
        analytics.track("content_generation_failed", {
          keyword: userKeyword,
          workspace_id: workspaceId ?? undefined,
          thread_id: threadId ?? undefined,
          error_message:
            _e instanceof Error ? _e.message : "Unknown stream error",
        });
        if (activeThreadId) {
          updateBackgroundJob(activeThreadId, {
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
      // If a different stream has already taken over (thread switch), this
      // stream was superseded. Skip UI teardown so we don't clobber the
      // replacement stream's loading state.
      const superseded =
        streamingThreadRef.current !== null &&
        streamingThreadRef.current !== activeThreadId;
      if (!superseded) {
        if (settled && !stopped) runStages.settle();
        await new Promise((r) => setTimeout(r, 1500));
        dispatch({ type: "SET_MANUAL_LOADING", payload: false });
        dispatch({ type: "SET_LOADING_STATUS", payload: "" });
        dispatch({ type: "SET_RUN_PHASE", payload: null });
      }
    }
    return settled;
  };

  // Keep a live handle so the background-restore effect (declared earlier) always
  // invokes the latest processStream closure instead of a stale one.
  const processStreamRef = useRef(processStream);
  processStreamRef.current = processStream;

  // ─────────────────────────────────────────────────────────────────────────
  // Workflow handlers — UNCHANGED
  // ─────────────────────────────────────────────────────────────────────────
  const handleKeywordSubmit = async () => {
    // No "one article at a time" guard here. Each submit creates its own
    // LangGraph thread and its own dock entry, so generations run independently
    // — this used to bounce the user back into whatever was already running.

    // Not enough for a whole article → stop before a thread or stream is ever created
    if (!ensureCredits()) return;

    // If a stream is already active (e.g. background join stream or old thread),
    // abort it so the user can start a fresh keyword generation.
    if (streamBusyRef.current) {
      cancelStream();
      streamBusyRef.current = false;
      streamingThreadRef.current = null;
    }
    streamBusyRef.current = true;
    streamingThreadRef.current = null; // set to newThreadId once created below
    let unsettledThreadId: string | null = null;

    try {
      cancelStream();
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setRunError(null);
      dispatch({ type: "RESET_FOR_REANALYSIS" });
      dispatch({ type: "SET_RUN_PHASE", payload: { phase: "analysis" } });
      dispatch({ type: "SET_MANUAL_LOADING", payload: true });
      dispatch({ type: "SET_LOADING_STATUS", payload: "Creating session..." });
      setTokenTarget("none");
      tokenTargetRef.current = "none";
      outline.resetStream();
      content.resetStream();

      if (!workspaceId) {
        dispatch({ type: "SET_MANUAL_LOADING", payload: false });
        return;
      }
      let newThreadId: string;
      try {
        newThreadId = await createThread(workspaceId);
      } catch (error) {
        // The server refused the run (a role without content.create) or could
        // not start it: say so in the run notice instead of a spinner.
        dispatch({ type: "SET_MANUAL_LOADING", payload: false });
        setRunError(
          error instanceof Error ? error.message : "This run could not start.",
        );
        return;
      }
      if (!newThreadId) {
        dispatch({ type: "SET_MANUAL_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_THREAD_ID", payload: newThreadId });
      streamingThreadRef.current = newThreadId;
      if (workspaceSlug) {
        window.history.replaceState(
          null,
          "",
          `${workspaceRoutes.generate_content(workspaceSlug)}?thread=${encodeURIComponent(newThreadId)}`,
        );
      }
      dispatch({ type: "SET_LOADING_STATUS", payload: "Starting analysis..." });

      const keyword = _initialKeyword || userKeyword;

      // Register the tracking record before the stream opens so the dock can
      // take over the moment the user navigates away. Like the content run, the
      // keyword run is server-owned (onDisconnect: "continue"), so leaving the
      // page only stops reading the stream — it never cancels the analysis.
      const startedAt = new Date().toISOString();
      upsertBackgroundJob({
        threadId: newThreadId,
        workspaceId: workspaceId ?? undefined,
        workspaceSlug,
        title: keyword || "Keyword research",
        keyword,
        status: "running",
        stage: "Analyzing search results",
        progress: 5,
        createdAt: startedAt,
        updatedAt: startedAt,
        resultUrl: `${workspaceRoutes.generate_content(
          workspaceSlug,
        )}?thread=${encodeURIComponent(newThreadId)}`,
        completionNotified: false,
        awaitingInput: false,
        runStage: undefined,
      });

      toast.info("Analyzing your keyword", {
        description:
          "You can leave this page — we'll keep working and notify you when it's ready.",
      });

      analytics.track("content_generation_started", {
        keyword,
        country,
        workspace_id: workspaceId ?? undefined,
        thread_id: newThreadId,
        from_library: isLibrary,
      });

      runCreatedRef.current = false;
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
              ...(isLibrary && libraryKey ? { library_key: libraryKey } : {}),
            },
            ...(selectedIntent || _initialIntent
              ? { final_intent_type: selectedIntent || _initialIntent }
              : {}),
          },
          streamMode: GENERATION_STREAM_MODES,
          streamSubgraphs: true,
          onDisconnect: "continue",
        },
        signal,
      );

      const settled = await processStream(stream);
      // A new thread has no other run: any run on it is this one.
      if (
        !settled &&
        !signal.aborted &&
        (runCreatedRef.current || (await readLatestRun(newThreadId)))
      ) {
        unsettledThreadId = newThreadId;
      }
    } finally {
      streamBusyRef.current = false;
      streamingThreadRef.current = null;
    }
    // The stream closed while the run was still going (a dropped connection, a
    // proxy or server timeout): the restore path reads the run's status,
    // rejoins it and shows the step, article or error it ends on.
    if (unsettledThreadId)
      requestBackgroundGenerationRestore(unsettledThreadId);
  };

  /** Resolves to whether the server actually started a run for this step. */
  const resumeWorkflow = async ({
    payload,
    status: statusMsg,
  }: ResumeOptions): Promise<boolean> => {
    if (!threadId) return false;
    // Mid-article: the earlier stages are already paid for, so only a fully
    // exhausted balance stops the workflow advancing to the next step
    if (!ensureCreditsToContinue()) return false;
    if (streamBusyRef.current) {
      if (
        streamingThreadRef.current === threadId &&
        abortControllerRef.current
      ) {
        // Already active on this exact thread resume — prevent double-click
        return false;
      }
      // Supersede active join or other thread's stream
      cancelStream();
      streamBusyRef.current = false;
      streamingThreadRef.current = null;
    }
    streamBusyRef.current = true;
    streamingThreadRef.current = threadId;
    let unsettled = false;

    try {
      dispatch({ type: "SET_MANUAL_LOADING", payload: true });
      if (statusMsg)
        dispatch({ type: "SET_LOADING_STATUS", payload: statusMsg });

      // The workflow is moving again: reopen the tracking record so the dock
      // resumes polling (and can notify again) if the user leaves mid-step.
      // Drop the previous paused run ID so other tabs do not keep polling that
      // completed run and restore this same interactive step over the new run.
      // `run/created` supplies the replacement ID as soon as the resume starts.
      updateBackgroundJob(threadId, {
        runId: undefined,
        status: "running",
        awaitingInput: false,
        runStage: undefined,
        completionNotified: false,
        ...(statusMsg ? { stage: statusMsg.replace(/\.+$/, "") } : {}),
      });

      // A resume that dies before `run/created` (aborted fetch, dev-server
      // hiccup, rejected run) leaves no run on the thread and nothing on
      // screen — the click simply vanishes. Retry once before reporting back.
      setRunError(null);
      let settled = false;
      let aborted = false;
      let runGoing = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        cancelStream();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        runCreatedRef.current = false;

        const stream = streamFromSSE(
          `/api/generate/${threadId}/resume`,
          {
            payload,
            streamMode: GENERATION_STREAM_MODES,
            streamSubgraphs: true,
            onDisconnect: "continue",
          },
          controller.signal,
        );
        settled = await processStream(stream);
        aborted = controller.signal.aborted;

        // An abort is deliberate (cancelled generation, unmount, a newer
        // stream taking over) — never retry over it.
        if (runCreatedRef.current || aborted || settled) break;
        // No announcement, but the server may have started the run before the
        // connection went: never resume a thread whose run is still going.
        runGoing = runIsGoing((await readLatestRun(threadId))?.status);
        if (runGoing) break;
      }
      const started = runCreatedRef.current || runGoing;
      unsettled = started && !settled && !aborted;
      return started;
    } finally {
      streamBusyRef.current = false;
      streamingThreadRef.current = null;
      // The stream closed while the run was still going: catch up with it
      // through the restore path, as for the first stream.
      if (unsettled) requestBackgroundGenerationRestore(threadId);
    }
  };

  const startBackgroundWorkflow = async ({
    payload,
    status: statusMsg,
  }: ResumeOptions) => {
    // Approving the outline starts the article's billed stages: their whole cost up front.
    if (!threadId || !ensureCredits("generate")) return;

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
      stage: "Research",
      // The article phase's first stage, at the derived article milestone, so
      // the shared record keeps climbing from the earlier steps instead of rewinding.
      progress: ARTICLE_PHASE_PROGRESS,
      createdAt: now,
      updatedAt: now,
      resultUrl,
      completionNotified: false,
      awaitingInput: false,
      runStage: undefined,
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
      case "KEYWORD_SELECT": {
        // A different keyword or country sends the run back through the SERP
        // engine (keyword_router) and pauses on this same step again with a
        // fresh analysis — so show the analysis steps, not the next step's.
        const isReanalysis = isKeywordReanalysis({
          value,
          primaryKeyword,
          country,
          analyzedCountry,
        });
        setTokenTarget("none");
        tokenTargetRef.current = "none";
        // Drop everything derived from the previous keyword/country so it can
        // neither be shown nor reused while the new analysis runs.
        if (isReanalysis) dispatch({ type: "RESET_FOR_REANALYSIS" });
        dispatch({
          type: "SET_RUN_PHASE",
          payload: { phase: isReanalysis ? "analysis" : "content-type" },
        });
        dispatch({ type: "SET_USER_KEYWORD", payload: value });
        dispatch({ type: "SET_PRIMARY_KEYWORD", payload: value });
        // The dock still carries the keyword this thread was created with.
        // Re-point it at the selected one so the banner, its toasts and the
        // sidebar entry don't keep naming a keyword the run has moved off.
        if (threadId) {
          updateBackgroundJob(threadId, { title: value, keyword: value });
        }
        analytics.track("keyword_selected", {
          keyword: value,
          workspace_id: workspaceId ?? undefined,
          thread_id: threadId ?? undefined,
        });
        return resumeWorkflow({
          payload: {
            "Primary Keyword": value,
            country,
            ...(selectedIntent ? { intent: selectedIntent } : {}),
          },
          status: isReanalysis
            ? "Analyzing keyword..."
            : "Content Type Selection...",
        });
      }
      case "CONTENT_TYPE_SELECT":
        setTokenTarget("outline");
        tokenTargetRef.current = "outline";
        outline.resetStream();
        dispatch({ type: "SUBMIT_REJECT_REASON" });
        dispatch({
          type: "SET_SELECTED_CONTENT_TYPE",
          payload: value,
        });
        dispatch({
          type: "SET_RUN_PHASE",
          payload: { phase: "titles" },
        });
        return resumeWorkflow({
          payload: { "Selected Content Type": value },
          status: "Suggesting titles...",
        });
      case "TOPIC_SELECT":
        setTokenTarget("none");
        tokenTargetRef.current = "none";
        dispatch({
          type: "SET_RUN_PHASE",
          payload: { phase: "outline" },
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
          type: "SET_RUN_PHASE",
          payload: { phase: "titles" },
        });
        return resumeWorkflow({
          payload: { action: "regenerate", feedback: value || "" },
          status: "Regenerating titles...",
        });

      case "OUTLINE_APPROVE":
        setTokenTarget("content");
        tokenTargetRef.current = "content";
        content.resetStream();
        setToolCalls([]);
        dispatch({ type: "SET_GENERATED_CONTENT", payload: "" });
        dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
        dispatch({
          type: "SET_RUN_PHASE",
          payload: { phase: "article" },
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
        // Keep the graph paused at the outline-review interrupt while the user
        // enters feedback. Sending `reject` here makes the graph issue a
        // second interrupt for the same feedback, which leaves a short window
        // where the first Submit Feedback click races the previous stream.
        // The backend accepts `regenerate` with feedback inline, so we can
        // collect it locally and resume exactly once on submit.
        dispatch({ type: "SET_REJECTED_REASON", payload: "" });
        dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "outline_reject" });
        return;
      case "OUTLINE_REJECT_REASON": {
        const requestedTargetWordCount = extractRequestedTargetWordCount(value);
        if (
          requestedTargetWordCount !== null &&
          outlineWordCountRange &&
          (requestedTargetWordCount < outlineWordCountRange.min ||
            requestedTargetWordCount > outlineWordCountRange.max)
        ) {
          showWordCountRangeError(
            requestedTargetWordCount,
            parsedOutline?.schema_type,
            outlineWordCountRange,
          );
          return;
        }
        if (requestedTargetWordCount !== null) {
          setPendingTargetWordCount(requestedTargetWordCount);
        }
        setTokenTarget("outline");
        tokenTargetRef.current = "outline";
        outline.resetStream();
        dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "outline_review" });
        dispatch({ type: "SET_REJECTED_REASON", payload: "" });

        return resumeWorkflow({
          payload: { action: "regenerate", feedback: value },
          status: "Regenerating outline...",
        }).then((started) => {
          if (started) return;
          // Nothing was sent: hand the user back their feedback instead of an
          // empty outline screen that never regenerates.
          setPendingTargetWordCount(null);
          dispatch({ type: "SET_REJECTED_REASON", payload: value });
          dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "outline_reject" });
          toast.error("We couldn't send your feedback", {
            description: "Please submit it again.",
          });
        });
      }
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
    isLibrary && isTopicLoading && runState === null;

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

  // Cancel an in-progress generation. Stops the server-owned run (credits
  // already spent on finished steps are not refunded), clears the tracking
  // record across tabs, and returns to a fresh generation screen.
  // biome-ignore lint/correctness/useExhaustiveDependencies: cancelStream/dispatch are stable (refs/reducer), intentionally omitted
  const _handleCancelGeneration = useCallback(async () => {
    if (!threadId) return;
    const job = useBackgroundGenerationStore
      .getState()
      .jobs.find((j) => j.threadId === threadId);
    cancelStream();
    try {
      await authenticatedFetch(
        `/api/generate/${encodeURIComponent(threadId)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: job?.runId }),
        },
      );
    } catch {
      // Best-effort: the run may already be gone. The record cleanup below
      // still stops the UI from tracking work that will never finish.
    }
    runStages.fail();
    removeBackgroundJob(threadId);
    announceBackgroundGenerationRemoval([threadId]);
    dispatch({ type: "SET_MANUAL_LOADING", payload: false });
    dispatch({ type: "SET_LOADING_STATUS", payload: "" });
    dispatch({ type: "SET_RUN_PHASE", payload: null });
    toast.info("Generation cancelled", {
      description: "Credits already used for this generation are not refunded.",
    });
    router.push(workspaceRoutes.generate_content(workspaceSlug) as Route);
  }, [threadId, removeBackgroundJob, router, workspaceSlug]);

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
        {runStages.run && (
          <RunProgress
            stages={runStages.run.stages}
            onCancel={_handleCancelGeneration}
            className="max-w-md"
          />
        )}
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
      <TitleStep
        instruction={displayedInstruction}
        titles={topics}
        recommendedTitle={recommendedTopic}
        gate={state.interrupt?.[0]?.value}
        onContinue={(title) => handleWorkflow("TOPIC_SELECT", title)}
        onRegenerate={(fb) => handleWorkflow("TOPIC_REGENERATE", fb)}
        isRegenerating={
          isManualLoading && (loadingStatus?.includes("Regenerating") ?? false)
        }
        // The content type the user picked, not the backend's suggestion, which can differ.
        context={[
          primaryKeyword,
          selectedIntent ||
            (Array.isArray(seoResult?.intent)
              ? seoResult.intent[0]
              : (seoResult?.intent as string)),
          selectedContentType || recommendedContentType,
        ]}
      />
    ),
    content_type: (
      <ContentType
        recommendedContentType={recommendedContentType}
        instruction={displayedInstruction}
        contentTypes={contentTypes}
        keyword={primaryKeyword || userKeyword}
        intent={
          selectedIntent ||
          (Array.isArray(seoResult?.intent)
            ? seoResult.intent[0]
            : (seoResult?.intent as string)) ||
          ""
        }
        handleContentTypeSelect={(selected) =>
          handleWorkflow("CONTENT_TYPE_SELECT", selected)
        }
      />
    ),

    outline_reject: (
      <OutlineRejectSection
        instruction={displayedInstruction}
        rejectedReason={rejectedReason}
        contentType={parsedOutline?.schema_type}
        wordCountRange={outlineWordCountRange}
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
    { id: "topic", label: "Title", aliases: ["topic_selection"] },
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
      <StepColumn
        // A step with a side pane beside it (the Title step's search results) gets the room for both.
        withSidePane={
          instructionType === "topic" || instructionType === "topic_selection"
        }
        className={cn(
          "flex flex-col items-center justify-center relative lg:px-8 transition-all duration-700",
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
              run={
                instructionType === "keyword Selection"
                  ? "change_keyword"
                  : "analyze"
              }
              // Step 2 already owns a thread paused on the keyword interrupt.
              // Re-analysing there must resume that thread — starting a new one
              // trips the "article already in progress" guard on its own job.
              onSubmit={
                instructionType === "keyword Selection"
                  ? () => handleWorkflow("KEYWORD_SELECT", userKeyword)
                  : handleKeywordSubmit
              }
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
              isLoading={isManualLoading || isStreamingOutline}
              pendingTargetWordCount={pendingTargetWordCount}
              internalLinks={interruptInternalLinks}
              brandVoicePromotion={interruptBrandVoicePromotion}
              workspaceId={workspaceId}
              onApprove={(selectedLinks, promoteBrand, selectedPersonaId) => {
                setTokenTarget("content");
                tokenTargetRef.current = "content";
                content.resetStream();
                setToolCalls([]);
                dispatch({ type: "SET_GENERATED_CONTENT", payload: "" });
                dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
                dispatch({
                  type: "SET_RUN_PHASE",
                  payload: { phase: "article" },
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
                    // Always sent, null included: the backend reads the key's
                    // presence as the user's decision, so omitting it on a
                    // cleared persona would restore the recommended one.
                    selected_persona_id: selectedPersonaId,
                  },
                  status: "Approving and generating content...",
                });
              }}
              onReject={() => handleWorkflow("OUTLINE_REJECT", "")}
              onUpdate={(updatedOutline) => {
                const requestedTargetWordCount =
                  updatedOutline.target_word_count;
                if (
                  requestedTargetWordCount !== undefined &&
                  outlineWordCountRange &&
                  (requestedTargetWordCount < outlineWordCountRange.min ||
                    requestedTargetWordCount > outlineWordCountRange.max)
                ) {
                  showWordCountRangeError(
                    requestedTargetWordCount,
                    parsedOutline?.schema_type,
                    outlineWordCountRange,
                  );
                  return;
                }
                dispatch({ type: "SET_OUTLINE", payload: updatedOutline });
              }}
              keywordClusters={keywordClusters}
            />
          </div>
        ) : runError && !restoreError ? (
          // A run that has stopped shows its notice in the step's place, under
          // the search, instead of a step that will never fill in.
          <RunNotice
            title="The analysis stopped"
            message={runError}
            actionLabel="Start again"
            onAction={() => {
              setRunError(null);
              onBack();
            }}
          />
        ) : (
          <div className="w-full">{instructionViewMap[instructionType]}</div>
        )}
      </StepColumn>

      {restoreError && (
        <RunNotice
          title="We could not restore this article"
          message={restoreError}
          actionLabel="Start a new article"
          onAction={() => {
            setRestoreError(null);
            onBack();
          }}
        />
      )}

      {/* ── Content: stream tokens live, then hand off to ContentEditor ── */}
      {showContentStream && !restoreError && (
        <div className={!isContentFinal ? "relative" : undefined}>
          <ContentEditor
            // The article's run, while it runs: the same stages as every other
            // phase, in the editor's side panel (the editor fills the page).
            runProgress={
              runStages.run?.phase === "article" &&
              runStages.run.stages.some((stage) => stage.state === "active") ? (
                <RunProgress
                  stages={runStages.run.stages}
                  onCancel={_handleCancelGeneration}
                />
              ) : null
            }
            threadId={threadId ?? undefined}
            allContent={
              isContentFinal ? allContent : (allContent ?? streamedAllContent)
            }
            isEnhancing={isEnhancing || isBackgroundGenerationActive}
            enhancingMsg={enhancingMsg}
            enhancingDescription={enhancingDescription}
            readabilityScore={readabilityScore}
            checklist={checklist}
            seoScore={seoScore}
            trustScore={trustScore}
            generatedContent={
              isContentFinal ? generatedContent : displayedBodyMarkdown
            }
            isEditing={isEditing}
            userKeyword={userKeyword}
            outline={parsedOutline}
            toolCalls={toolCalls}
            onEditToggle={handleEditToggle}
            onContentChange={handleContentChange}
          />
        </div>
      )}

      {creditsModal}
    </div>
  );
}
