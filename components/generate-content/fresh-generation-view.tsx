"use client";

import { useReducer } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingIndicatorVariants } from "@/components/ui/content/loading-indicator-variants";
import type {
  ContentOutline,
  PageAction,
  PageState,
  ResumeOptions,
  RunStreamEvent,
  WorkflowStep,
} from "@/types/generate-content";
import { HeroSection } from "@/components/generate-content/hero";
import { KeywordForm } from "@/components/generate-content/keyword";
import { SuggestionsSection } from "@/components/generate-content/suggestions";
import { TopicsSection } from "@/components/generate-content/topics";
import {
  OutlineDisplay,
  OutlineRejectSection,
} from "@/components/generate-content/outline";
import { ContentEditor } from "@/components/generate-content/content";
import { Client } from "@langchain/langgraph-sdk";
import ContentType from "./content-type";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCurrentWorkspaceId } from "@/stores/workspace/use-workspace-context-store";
const ASSISTANT_ID = "agent";

const formatNodeName = (name: string) =>
  name
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const client = new Client({
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
});

const initialState: PageState = {
  step: "keyword",
  userKeyword: "",
  country: "us",
  primaryKeyword: "",
  suggestedKeywords: [],
  generatedContent: "",
  threadId: null,
  rejectedReason: "",
  outline: null,
  isLoading: false,
  topics: [],
  instruction: "",
  instructionType: "keyword",
  isEditing: false,
  seoResult: null,
  serp: null,
  competitors: null,
  currentContentState: null,
  interrupt: null,
  contentTypes: [],
  loadingStatus: "",
  isManualLoading: false,
  completedNodes: [],
  finalContent: null,
  seoScore: null,
};

function reducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case "SET_INSTRUCTION_TYPE":
      return { ...state, instructionType: action.payload };
    case "SET_USER_KEYWORD":
      return { ...state, userKeyword: action.payload };
    case "SET_COUNTRY":
      return { ...state, country: action.payload };
    case "SET_THREAD_ID":
      if (state.threadId === action.payload) return state;
      return { ...state, threadId: action.payload };
    case "SET_REJECTED_REASON":
      if (state.rejectedReason === action.payload) return state;
      return { ...state, rejectedReason: action.payload };
    case "SET_IS_EDITING":
      if (state.isEditing === action.payload) return state;
      return { ...state, isEditing: action.payload };
    case "SET_GENERATED_CONTENT":
      if (state.generatedContent === action.payload) return state;
      return { ...state, generatedContent: action.payload };
    case "SET_FINAL_CONTENT":
      if (state.finalContent === action.payload) return state;
      return { ...state, finalContent: action.payload };
    case "SET_SEO_SCORE":
      if (state.seoScore === action.payload) return state;
      return { ...state, seoScore: action.payload };
    case "RESET_FOR_REJECT":
      return { ...state, instruction: "", step: "outline-reject" };
    case "SUBMIT_REJECT_REASON":
      return { ...state, step: "outline", rejectedReason: "", outline: null };
    case "SET_INTERRUPT":
      return { ...state, interrupt: action.payload };
    case "SET_LOADING_STATUS": {
      const nextStatus = action.payload;
      const prevStatus = state.loadingStatus;

      let nextCompleted = [...state.completedNodes];
      if (
        prevStatus &&
        prevStatus.endsWith("...") &&
        prevStatus !== nextStatus
      ) {
        const finishedNode = prevStatus.slice(0, -3);
        if (!nextCompleted.includes(finishedNode)) {
          nextCompleted.push(finishedNode);
        }
      }

      return {
        ...state,
        loadingStatus: nextStatus,
        completedNodes: nextCompleted,
      };
    }
    case "SET_MANUAL_LOADING":
      return { ...state, isManualLoading: action.payload };
    case "CLEAR_COMPLETED_NODES":
      return { ...state, completedNodes: [] };
    case "ADD_COMPLETED_NODE":
      if (state.completedNodes.includes(action.payload)) return state;
      return {
        ...state,
        completedNodes: [...state.completedNodes, action.payload],
      };
    case "UPDATE_FROM_STREAM": {
      const updates = action.payload;
      let changed = false;
      const newState = { ...state };

      const interrupt = updates.__interrupt__;

      if (interrupt && interrupt.length > 0) {
        const newInstruction =
          interrupt[0].value.instruction || interrupt[0].value.instructions;
        const newInstructionType =
          interrupt[0].value.instruction_type || interrupt[0].value.type;

        if (
          newInstruction !== undefined &&
          state.instruction !== newInstruction
        ) {
          newState.instruction = newInstruction as string;
          changed = true;
        }
        if (
          newInstructionType !== undefined &&
          state.instructionType !== (newInstructionType as string)
        ) {
          newState.instructionType = newInstructionType as string;
          changed = true;
        }

        if (interrupt[0]?.value.Recommendations) {
          const keywords = interrupt[0]?.value.Recommendations;
          const primaryKeyword = interrupt[0]?.value["Primary Keyword"] as
            | string
            | undefined;
          if (keywords && keywords.length > 0) {
            if (
              JSON.stringify(state.suggestedKeywords) !==
              JSON.stringify(keywords)
            ) {
              newState.primaryKeyword = primaryKeyword || "";
              newState.suggestedKeywords = keywords;
              if (interrupt[0]?.value.seo_state) {
                newState.seoResult = interrupt[0]?.value.seo_state;
              }
              changed = true;
            }
            if (state.step === "keyword") {
              newState.step = "suggestions";
              changed = true;
            }
          }
        } else if (interrupt[0]?.value.topics) {
          const newTopics = interrupt[0].value.topics as string[];
          if (JSON.stringify(state.topics) !== JSON.stringify(newTopics)) {
            newState.topics = newTopics;
            changed = true;
          }
        } else if (interrupt[0]?.value.content_types) {
          const newContentTypes = interrupt[0].value.content_types as string[];
          if (
            JSON.stringify(state.contentTypes) !==
            JSON.stringify(newContentTypes)
          ) {
            newState.contentTypes = newContentTypes;
            changed = true;
          }
        } else if (interrupt[0]?.value.type === "outline_review") {
          const newOutline = interrupt[0].value.data as ContentOutline;
          if (JSON.stringify(state.outline) !== JSON.stringify(newOutline)) {
            newState.outline = newOutline;
            changed = true;
          }
          if (
            state.step !== "outline" &&
            state.step !== "outline-reject" &&
            state.step !== "content"
          ) {
            newState.step = "outline";
            changed = true;
          }
        }
      }
      return changed ? newState : state;
    }
    default:
      return state;
  }
}

interface FreshGenerationViewProps {
  onBack: () => void;
  initialKeyword?: string;
  initialStep?: PageState["step"];
}

export function FreshGenerationView({
  onBack,
  initialKeyword = "",
  initialStep = "keyword",
}: FreshGenerationViewProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuthSession();
  const workspaceId = useCurrentWorkspaceId();

  const {
    step,
    userKeyword,
    country,
    primaryKeyword,
    suggestedKeywords,
    generatedContent,
    threadId,
    rejectedReason,
    outline,
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
    finalContent,
    seoScore,
  } = state;

  const processStream = async (
    stream: AsyncGenerator<RunStreamEvent>,
  ): Promise<void> => {
    try {
      for await (const chunk of stream) {
        if (chunk.event !== "updates" && !chunk.event.startsWith("updates|")) {
          continue;
        }

        const updates = chunk.data as any;
        console.log("updates", updates)
        if (
          updates?.calculate_on_page_seo?.content?.review?.on_page_metrics
            ?.score
        ) {
          dispatch({
            type: "SET_SEO_SCORE",
            payload:
              updates.calculate_on_page_seo.content.review.on_page_metrics,
          });
        }

        if (updates?.calculate_readability?.content?.final_content) {
          dispatch({
            type: "SET_FINAL_CONTENT",
            payload: updates.calculate_readability.content,
          });
          dispatch({
            type: "SET_GENERATED_CONTENT",
            payload:
              updates.calculate_readability.content.final_content.body_markdown,
          });
          dispatch({
            type: "SET_INSTRUCTION_TYPE",
            payload: "content",
          });
        }

        if (updates.__interrupt__) {
          dispatch({
            type: "SET_INTERRUPT",
            payload: updates.__interrupt__,
          });
        }

        dispatch({ type: "UPDATE_FROM_STREAM", payload: updates });

        Object.keys(updates)
          .filter((key) => !key.startsWith("__"))
          .forEach((node) => {
            dispatch({
              type: "SET_LOADING_STATUS",
              payload: `${formatNodeName(node)}...`,
            });
          });
      }
    } catch (error) {
      console.error("❌ Stream error:", error);
    } finally {
      dispatch({ type: "SET_MANUAL_LOADING", payload: false });
      dispatch({ type: "SET_LOADING_STATUS", payload: "" });
    }
  };

  const handleKeywordSubmit = async () => {
    dispatch({ type: "CLEAR_COMPLETED_NODES" });
    dispatch({ type: "SET_MANUAL_LOADING", payload: true });
    dispatch({ type: "SET_LOADING_STATUS", payload: "Creating session..." });

    const thread = await client.threads.create();
    if (!thread) return;

    dispatch({ type: "SET_THREAD_ID", payload: thread.thread_id });

    dispatch({ type: "SET_LOADING_STATUS", payload: "Starting analysis..." });

    const stream = client.runs.stream(thread.thread_id, ASSISTANT_ID, {
      input: {
        serp_payload: {
          query: userKeyword,
          country,
          user_id: user?.id,
          workspace_id: workspaceId ?? undefined,
        },
      },
      streamMode: "updates",
      streamSubgraphs: true,
    });

    await processStream(stream);
  };

  const resumeWorkflow = async ({ payload, status }: ResumeOptions) => {
    if (!threadId) {
      console.error("⚠️ No active thread to resume.");
      return;
    }

    dispatch({ type: "CLEAR_COMPLETED_NODES" });
    dispatch({ type: "SET_MANUAL_LOADING", payload: true });

    if (status) {
      dispatch({ type: "SET_LOADING_STATUS", payload: status });
    }

    const stream = client.runs.stream(threadId, ASSISTANT_ID, {
      command: { resume: payload },
      streamMode: "updates",
      streamSubgraphs: true,
    });

    await processStream(stream);
  };

  const handleWorkflow = (step: WorkflowStep, value?: string) => {
    switch (step) {
      case "KEYWORD_SELECT":
        return resumeWorkflow({
          payload: { "Primary Keyword": value },
          status: `Resuming workflow for "${value}"...`,
        });

      case "TOPIC_SELECT":
        return resumeWorkflow({
          payload: { "Selected Topic": value },
          status: `Resuming workflow for "${value}"...`,
        });

      case "CONTENT_TYPE_SELECT":
        return resumeWorkflow({
          payload: { "Selected Content Type": value },
          status: `Resuming workflow for "${value}"...`,
        });

      case "OUTLINE_APPROVE":
        return resumeWorkflow({
          payload: { action: "approve" },
        });

      case "OUTLINE_REJECT":
        return resumeWorkflow({
          payload: { action: "reject" },
        });

      case "OUTLINE_REJECT_REASON":
        return resumeWorkflow({
          payload: { reason: value },
        });

      default:
        // Exhaustiveness guard
        const _never: never = step;
        return _never;
    }
  };

  if (isLoading || isManualLoading) {
    return (
      <div
        className={cn(
          "max-w-3xl mx-auto w-full flex flex-col items-center relative px-6 transition-all duration-700",
          instructionType === "keyword"
            ? "min-h-[70vh] justify-center"
            : "min-h-0 pt-2",
        )}
      >
        <LoadingIndicatorVariants
          step={step}
          isLoading={isLoading || isManualLoading}
          loadingStatus={loadingStatus}
          completedSteps={completedNodes}
          className="mt-5"
        />
      </div>
    );
  }

  const isKeywordFlow =
    instructionType === "keyword" || instructionType === "keyword Selection";

  const instructionViewMap: Record<string, React.ReactNode> = {
    "keyword Selection": (
      <SuggestionsSection
        instruction={instruction}
        primaryKeyword={primaryKeyword}
        suggestedKeywords={suggestedKeywords}
        onSelect={(selected) => handleWorkflow("KEYWORD_SELECT", selected)}
        seoResult={seoResult}
      />
    ),

    topic: (
      <TopicsSection
        instruction={instruction}
        topics={topics}
        onSelect={(selected) => handleWorkflow("TOPIC_SELECT", selected)}
        keyword={primaryKeyword || userKeyword}
      />
    ),

    content_type: (
      <ContentType
        instruction={instruction}
        contentTypes={contentTypes}
        handleContentTypeSelect={(selected) =>
          handleWorkflow("CONTENT_TYPE_SELECT", selected)
        }
      />
    ),

    outline_review: outline && (
      <OutlineDisplay
        outline={outline}
        isLoading={false}
        onApprove={() => handleWorkflow("OUTLINE_APPROVE")}
        onReject={() => handleWorkflow("OUTLINE_REJECT")}
      />
    ),

    outline_reject: (
      <OutlineRejectSection
        instruction={instruction}
        rejectedReason={rejectedReason}
        onChange={(val) =>
          dispatch({ type: "SET_REJECTED_REASON", payload: val })
        }
        onSubmit={() => handleWorkflow("OUTLINE_REJECT_REASON", rejectedReason)}
      />
    ),
  };

  return (
    <>
      <div
        className={cn(
          "max-w-3xl mx-auto w-full flex flex-col items-center relative px-6 transition-all duration-700",
          instructionType === "keyword"
            ? "min-h-[70vh] justify-center"
            : "min-h-0 pt-2",
        )}
      >
        <AnimatePresence mode="wait">
          {instructionType === "keyword" && <HeroSection />}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full"
        >
          {isKeywordFlow && (
            <KeywordForm
              userKeyword={userKeyword}
              country={country}
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

        {instructionViewMap[instructionType]}
      </div>

      {instructionType === "content" && finalContent && (
        <ContentEditor
          values={finalContent}
          seoScore={seoScore}
          generatedContent={generatedContent}
          isEditing={isEditing}
          userKeyword={userKeyword}
          outline={outline}
          onEditToggle={() =>
            dispatch({ type: "SET_IS_EDITING", payload: !isEditing })
          }
          onContentChange={(val) =>
            dispatch({ type: "SET_GENERATED_CONTENT", payload: val })
          }
        />
      )}

    </>
  );
}
