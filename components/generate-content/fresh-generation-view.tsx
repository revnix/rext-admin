"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { useEffect, useReducer, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useStream } from "@langchain/langgraph-sdk/react";
import { log } from "@/lib/logger";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingIndicatorVariants } from "@/components/ui/content/loading-indicator-variants";
import type {
  CONTENT,
  ContentOutline,
  Interrupt,
  PageAction,
  PageState,
  WREXT,
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
  topics: [],
  instruction: "",
  instructionType: "",
  isEditing: false,
  seoResult: null,
  serp: null,
  competitors: null,
  currentContentState: null,
  interrupt: null,
  contentTypes: [],
};

function reducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
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
    case "RESET_FOR_REJECT":
      return { ...state, instruction: "", step: "outline-reject" };
    case "SUBMIT_REJECT_REASON":
      return { ...state, step: "outline", rejectedReason: "", outline: null };
    case "SET_INTERRUPT":
      return { ...state, interrupt: action.payload };
    case "UPDATE_FROM_STREAM": {
      const values = action.payload;
      let changed = false;
      const newState = { ...state };

      const interrupt = state.interrupt;

      if (interrupt) {
        const newInstruction =
          interrupt.value.instructions || interrupt.value.instruction || "";
        if (state.instruction !== newInstruction) {
          newState.instruction = newInstruction;
          changed = true;
        }
        if (state.instructionType) {
          changed = true;
        }
      }

      // 1. Content Phase (Dominant)
      if (interrupt?.value?.data?.final_content) {
        console.log("final_content", interrupt.value.data.final_content);
        if (interrupt.value.data.final_content.body_markdown) {
          if (!state.generatedContent || !state.isEditing) {
            if (
              state.generatedContent !==
              interrupt.value.data.final_content.body_markdown
            ) {
              newState.generatedContent =
                interrupt.value.data.final_content.body_markdown;
              changed = true;
            }
          }
        }
        if (state.step !== "content") {
          newState.step = "content";
          changed = true;
        }
      }
      // 2. Outline Review Phase
      else if (interrupt?.value.type === "outline_review") {
        const newOutline = interrupt.value.data as ContentOutline;
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
      else if (interrupt?.value.content_types) {
        const newContentTypes = interrupt.value.content_types as string[];
        if (JSON.stringify(state.contentTypes) !== JSON.stringify(newContentTypes)) {
          newState.contentTypes = newContentTypes;
          changed = true;
        }
        if (state.instructionType !== "content-type") {
          newState.instructionType = "content-type";
          changed = true;
        }
      }
      // 3. Topics Phase
      else if (interrupt?.value.topics) {
        const newTopics = interrupt.value.topics as string[];
        console.log("newTopics", newTopics);
        if (JSON.stringify(state.topics) !== JSON.stringify(newTopics)) {
          newState.topics = newTopics;
          changed = true;
        }
        if (state.instructionType !== "topics") {
          newState.instructionType = "topics";
          changed = true;
        }
      }
      // 4. Selection Phase
      else {
        const keywords = interrupt?.value.Recommendations;
        const primaryKeyword = interrupt?.value["Primary Keyword"] as string | undefined;
        if (keywords && keywords.length > 0) {
          if (
            JSON.stringify(state.suggestedKeywords) !== JSON.stringify(keywords)
          ) {
            newState.primaryKeyword = primaryKeyword || "";
            newState.suggestedKeywords = keywords;
            if (interrupt.value.seo_state) {
              newState.seoResult = interrupt.value.seo_state;
              console.log("seoResult33", newState.seoResult);
            }
            changed = true;
          }
          if (state.step === "keyword") {
            newState.step = "suggestions";
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
    interrupt,
    contentTypes,
  } = state;

  const { workspace, workspaceSlug } = useWorkspace();

  const onThreadId = useCallback(
    (id: string | null) => dispatch({ type: "SET_THREAD_ID", payload: id }),
    [],
  );

  const { values, submit, isLoading } = useStream<WREXT>({
    apiUrl: "http://192.168.1.130:2024/",
    assistantId: "agent",
    messagesKey: "messages",
    threadId: threadId,
    onThreadId: onThreadId,

    // Handle state updates after each graph step (including subgraphs)
    onUpdateEvent: (update, options) => {
      // Extract namespace from options (indicates nesting level)
      // namespace is an array like ['serp_engine:task_id', 'fetch_serp'] for subgraph nodes
      // or undefined/empty for parent graph nodes
      const namespace = options?.namespace || [];

      // The update object structure is { nodeName: { ...stateUpdate } }
      const nodeNames = Object.keys(update);
      const nodeName = nodeNames[0];

      if (namespace.length > 0) {
        // Subgraph update - show the full path through the graph hierarchy
        const graphPath = namespace.join(" → ");
        log.info(`Subgraph node executed: ${graphPath} → ${nodeName}`, update);
      } else {
        // Parent graph update
        log.info(`Parent graph node executed: ${nodeName}`, update);

        const interrupt = (update as any).__interrupt__?.[0] || (update[nodeName] as any)?.__interrupt__?.[0];

        if (interrupt) {
          dispatch({
            type: "SET_INTERRUPT",
            payload: interrupt,
          });
        }
      }
    },

    // Handle custom events streamed from your graph
    onCustomEvent: (event, _options) => {
      log.info("Custom event received", event);
    },

    // Handle metadata events with run/thread info
    onMetadataEvent: (metadata) => {
      log.info("Run ID:", metadata.run_id);
      log.info("Thread ID:", metadata.thread_id);
    },

    onError: (error) => {
      log.error("Stream error occurred", error);
    },

    onFinish: (state, _options) => {
      log.info("Stream completed successfully", state);
    },
  });

  useEffect(() => {
    if (values) {
      dispatch({ type: "UPDATE_FROM_STREAM", payload: values });
    }
    log.info("values", values);
    log.info("step", step);
    log.info("isEditing", isEditing);
  }, [values, step, isEditing]);

  useEffect(() => {
    if (interrupt) {
      console.log("interrupt344", interrupt);
    }
  }, [interrupt]);

  useEffect(() => {
    console.log("instructionType", step === "topics" && instructionType === "topics");
    console.log("instructionType", instructionType);
  }, [instructionType]);

  const handleKeywordSubmit = () => {
    log.info("[User Action: Submit Keyword]", userKeyword, country);
    submit({
      serp_payload: {
        query: userKeyword,
        country: country,
      },
      messages: [
        {
          type: "human",
          content: `Suggest 5 keywords related to: ${userKeyword}`,
        },
      ],
    });
    dispatch({ type: "SET_STEP", payload: "suggestions" });
  };

  const handleKeywordSelect = (selected: string) => {
    submit(
      {
        "Primary Keyword": selected,
        continue_workflow: true,
      },
      {
        // CRITICAL: Use command.resume to resume from interrupt
        command: { resume: true },
      },
    );

    dispatch({ type: "SET_STEP", payload: "topics" });
  };

  const handleTopicSelect = (selected: string) => {
    submit(
      {
        instruction_response: selected,
        continue_workflow: true,
      },
      {
        // CRITICAL: Use command.resume to resume from interrupt
        command: { resume: true },
      },
    );
    dispatch({ type: "SET_STEP", payload: "topic-type" });
  };

  const handleContentTypeSelect = (selected: string) => {
    submit(
      {
        instruction_response: selected,
        continue_workflow: true,
      },
      {
        // CRITICAL: Use command.resume to resume from interrupt
        command: { resume: true },
      },
    );
    dispatch({ type: "SET_STEP", payload: "outline" });
  };

  const handleOutlineApprove = () => {
    // Use null to avoid trying to update state keys, preventing InvalidUpdateError
    dispatch({ type: "SET_STEP", payload: "content" });
    submit(null, {
      command: { resume: "approve" },
    });
  };

  const handleOutlineReject = () => {
    dispatch({ type: "RESET_FOR_REJECT" });
    submit(null, {
      command: { resume: "reject" },
    });
  };

  const handleOutlineRejectReason = () => {
    dispatch({ type: "SUBMIT_REJECT_REASON" });
    submit(
      {
        instruction_response: rejectedReason,
        continue_workflow: true,
      },
      {
        command: { resume: true },
      },
    );
  };

  return (
    <>
      <div
        className={cn(
          "max-w-3xl mx-auto w-full flex flex-col items-center relative px-6 transition-all duration-700",
          step === "keyword" ? "min-h-[70vh] justify-center" : "min-h-0 pt-2",
        )}
      >
        <AnimatePresence mode="wait">
          {step === "keyword" && <HeroSection />}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full"
        >
          {(step === "keyword" || step === "suggestions") && (
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

        <LoadingIndicatorVariants
          step={step}
          isLoading={isLoading}
          className="mt-5"
        />

        {step === "suggestions" && suggestedKeywords.length > 0 && (
          <SuggestionsSection
            instruction={instruction}
            primaryKeyword={primaryKeyword}
            suggestedKeywords={suggestedKeywords}
            onSelect={handleKeywordSelect}
            seoResult={seoResult}
          />
        )}

        {step === "topic-type" && instructionType === "content-type" && (
          <>
            <h2 className="text-xl font-semibold my-4">{instruction}</h2>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((kw) => (
                <button
                  key={kw}
                  onClick={() => handleContentTypeSelect(kw)}
                  className="bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-all ease-in-out duration-300"
                >
                  <strong>{kw}</strong>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "topics" && instructionType === "topics" && (
          <TopicsSection
            instruction={instruction}
            topics={topics}
            onSelect={handleTopicSelect}
          />
        )}

        {step === "outline" && outline && (
          <OutlineDisplay
            outline={outline}
            isLoading={isLoading}
            onApprove={handleOutlineApprove}
            onReject={handleOutlineReject}
          />
        )}

        {step === "outline-reject" && instructionType === "outline_reject" && (
          <OutlineRejectSection
            instruction={instruction}
            rejectedReason={rejectedReason}
            onChange={(val) =>
              dispatch({ type: "SET_REJECTED_REASON", payload: val })
            }
            onSubmit={handleOutlineRejectReason}
          />
        )}
      </div>

      {step === "content" && interrupt?.value?.data?.final_content && (
        <ContentEditor
          values={interrupt.value.data as CONTENT}
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