"use client";

import { useEffect, useReducer, useState } from "react";
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
import {
  INITIAL_ANALYSIS_STEPS,
  KEYWORD_SELECTION_STEPS,
  TOPIC_GENERATION_STEPS,
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
  readabilityScore: null,
  seoScore: null,
  trustScore: null,
  eeatData: null,
  allContent: null,
  currentLoadingSteps: [],
  keywordDifficulty: null,
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
    case "SET_ALL_CONTENT":
      if (state.allContent === action.payload) return state;
      return { ...state, allContent: action.payload };
    case "SET_READABILITY_SCORE":
      if (state.readabilityScore === action.payload) return state;
      return { ...state, readabilityScore: action.payload };
    case "SET_TRUST_SCORE":
      if (state.trustScore === action.payload) return state;
      return { ...state, trustScore: action.payload };
    case "SET_SEO_SCORE":
      if (state.seoScore === action.payload) return state;
      return { ...state, seoScore: action.payload };
    case "SET_EEAT_DATA":
      if (state.eeatData === action.payload) return state;
      return { ...state, eeatData: action.payload };
    case "RESET_FOR_REJECT":
      return { ...state, instruction: "", step: "outline-reject" };
    case "SUBMIT_REJECT_REASON":
      return { ...state, step: "outline", rejectedReason: "", outline: null };
    case "SET_INTERRUPT":
      return { ...state, interrupt: action.payload };
    case "SET_OUTLINE":
      return { ...state, outline: action.payload };
    case "SET_KEYWORD_DIFFICULTY":
      return {
        ...state,
        keywordDifficulty: action.payload,
        instructionType:
          state.instructionType === "keyword"
            ? "keyword Selection"
            : state.instructionType,
      };
    case "SET_LOADING_STEPS":
      return { ...state, currentLoadingSteps: action.payload };
    case "SET_LOADING_STATUS": {
      const nextStatus = action.payload;
      const prevStatus = state.loadingStatus;

      const nextCompleted = [...state.completedNodes];
      if (prevStatus?.endsWith("...") && prevStatus !== nextStatus) {
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
  onBack: _onBack,
  initialKeyword: _initialKeyword = "",
  initialStep: _initialStep = "keyword",
}: FreshGenerationViewProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuthSession();
  const workspaceId = useCurrentWorkspaceId();

  const {
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
    readabilityScore,
    seoScore,
    trustScore,
    eeatData,
    allContent,
    currentLoadingSteps,
    keywordDifficulty,
  } = state;
  const [contentMarkdown, setContentMarkdown] = useState("");

  useEffect(() => {
    if (allContent?.body_markdown) {
      setContentMarkdown(allContent.body_markdown);
    }
  }, [allContent?.body_markdown]);

  useEffect(() => {
    if (keywordDifficulty) {
      console.log("keywordDifficulty", keywordDifficulty);
    }
  }, [keywordDifficulty])

  const processStream = async (
    stream: AsyncGenerator<RunStreamEvent>,
  ): Promise<void> => {
    try {
      dispatch({
        type: "SET_KEYWORD_DIFFICULTY",
        payload: 0,
      });

      for await (const chunk of stream) {

        // biome-ignore lint/suspicious/noExplicitAny: Dynamic runtime data with unknown structure
        const updates = chunk.data as any;
        console.log("updates", updates);

        if (updates?.compute_keyword_difficulty?.seo_result?.keyword_difficulty) {
          dispatch({
            type: "SET_KEYWORD_DIFFICULTY",
            payload: updates.compute_keyword_difficulty.seo_result.keyword_difficulty.kd,
          });
          console.log("keywordDifficulty", updates.compute_keyword_difficulty.seo_result.keyword_difficulty.kd);
        }

        if (updates?.generate_content?.content?.final_content) {
          dispatch({
            type: "SET_ALL_CONTENT",
            payload: updates.generate_content.content.final_content,
          });
        }

        if (updates?.calculate_on_page_seo?.content?.review?.on_page_metrics) {
          dispatch({
            type: "SET_SEO_SCORE",
            payload:
              updates.calculate_on_page_seo.content.review.on_page_metrics,
          });
        }

        if (updates?.calculate_eeat_trust?.content?.review?.trust_score) {
          dispatch({
            type: "SET_TRUST_SCORE",
            payload: updates.calculate_eeat_trust.content.review.trust_score,
          });
          if (updates.calculate_eeat_trust.content.review.eeat_data) {
            dispatch({
              type: "SET_EEAT_DATA",
              payload: updates.calculate_eeat_trust.content.review.eeat_data,
            });
          }
        }

        if (
          updates?.calculate_readability?.content?.review?.readability_metrics
        ) {
          dispatch({
            type: "SET_READABILITY_SCORE",
            payload:
              updates.calculate_readability.content.review.readability_metrics,
          });
        }

        if (updates?.generate_content?.content?.final_content) {
          dispatch({
            type: "SET_GENERATED_CONTENT",
            payload:
              updates.generate_content.content.final_content.body_markdown,
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
    } catch (_error) {
    } finally {
      // Mark the very last status as completed if it was a node status
      // We use a local check based on the current loadingStatus
      if (loadingStatus?.endsWith("...")) {
        const finishedNode = loadingStatus.slice(0, -3);
        dispatch({ type: "ADD_COMPLETED_NODE", payload: finishedNode });
      }

      // Add a small delay to allow the user to see the final step completion
      await new Promise((resolve) => setTimeout(resolve, 1500));
      dispatch({ type: "SET_MANUAL_LOADING", payload: false });
      dispatch({ type: "SET_LOADING_STATUS", payload: "" });
      dispatch({ type: "SET_LOADING_STEPS", payload: [] });
    }
  };

  const handleKeywordSubmit = async () => {
    dispatch({ type: "CLEAR_COMPLETED_NODES" });
    dispatch({ type: "SET_LOADING_STEPS", payload: INITIAL_ANALYSIS_STEPS });
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
      streamMode: ["updates", "messages"],
      streamSubgraphs: true,
    });

    await processStream(stream);
  };

  const resumeWorkflow = async ({ payload, status }: ResumeOptions) => {
    if (!threadId) {
      return;
    }

    dispatch({ type: "CLEAR_COMPLETED_NODES" });
    dispatch({ type: "SET_MANUAL_LOADING", payload: true });

    if (status) {
      dispatch({ type: "SET_LOADING_STATUS", payload: status });
    }

    const stream = client.runs.stream(threadId, ASSISTANT_ID, {
      command: { resume: payload },
      streamMode: ["updates", "messages"],
      streamSubgraphs: true,
    });

    await processStream(stream);
  };

  const handleWorkflow = (step: WorkflowStep, value?: string) => {
    switch (step) {
      case "KEYWORD_SELECT":
        dispatch({
          type: "SET_LOADING_STEPS",
          payload: KEYWORD_SELECTION_STEPS,
        });
        return resumeWorkflow({
          payload: { "Primary Keyword": value },
          status: "Keyword Recommendation...",
        });

      case "TOPIC_SELECT":
        dispatch({
          type: "SET_LOADING_STEPS",
          payload: TOPIC_GENERATION_STEPS,
        });
        return resumeWorkflow({
          payload: { "Selected Topic": value },
          status: "Content Type Generation...",
        });

      case "CONTENT_TYPE_SELECT":
        dispatch({ type: "SET_LOADING_STEPS", payload: CONTENT_TYPE_STEPS });
        return resumeWorkflow({
          payload: { "Selected Content Type": value },
          status: "Topic Type...",
        });

      case "OUTLINE_APPROVE":
        dispatch({
          type: "SET_LOADING_STEPS",
          payload: FINAL_GENERATION_STEPS,
        });
        return resumeWorkflow({
          payload: {
            action: "approve",
            // tone: outline?.tone,
            // target_audience: outline?.target_audience,
          },
          status: "Approving and generating content...",
        });

      case "OUTLINE_REJECT":
        return resumeWorkflow({
          payload: { action: "reject" },
        });

      case "OUTLINE_REJECT_REASON":
        return resumeWorkflow({
          payload: { reason: value },
        });

      default: {
        // Exhaustiveness guard
        const _never: never = step;
        return _never;
      }
    }
  };

  if (
    (isLoading || isManualLoading) &&
    instructionType !== "content" &&
    (keywordDifficulty !== 0 || keywordDifficulty !== null)
  ) {
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
          step={instructionType}
          isLoading={isLoading || isManualLoading}
          loadingStatus={loadingStatus}
          completedSteps={completedNodes}
          steps={currentLoadingSteps}
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
        primaryKeyword={primaryKeyword || userKeyword}
        suggestedKeywords={suggestedKeywords}
        onSelect={(selected) => handleWorkflow("KEYWORD_SELECT", selected)}
        seoResult={seoResult}
        keywordDifficulty={keywordDifficulty}
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
        onUpdate={(updatedOutline) => {
          dispatch({ type: "SET_OUTLINE", payload: updatedOutline });
        }}
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

      {instructionType === "content" && (
        <ContentEditor
          allContent={allContent}
          readabilityScore={readabilityScore}
          seoScore={seoScore}
          trustScore={trustScore}
          eeatData={eeatData}
          generatedContent={generatedContent || contentMarkdown}
          isEditing={isEditing}
          userKeyword={userKeyword}
          outline={outline}
          onEditToggle={() =>
            dispatch({ type: "SET_IS_EDITING", payload: !isEditing })
          }
          onContentChange={(val) => {
            dispatch({ type: "SET_GENERATED_CONTENT", payload: val });
            setContentMarkdown(val);
          }}
        />
      )}
    </>
  );
}
