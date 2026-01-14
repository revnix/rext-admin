"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { useEffect, useReducer, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useStream } from "@langchain/langgraph-sdk/react";
import { log } from "@/lib/logger";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingIndicatorVariants } from "@/components/ui/content/loading-indicator-variants";
import type {
  Outline,
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
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

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
    case "UPDATE_FROM_STREAM": {
      const values = action.payload;
      const interrupt = values.__interrupt__?.[0];
      let changed = false;
      const newState = { ...state };

      if (interrupt) {
        const newInstruction =
          interrupt.value.instructions || interrupt.value.instruction;
        if (state.instruction !== newInstruction) {
          newState.instruction = newInstruction;
          changed = true;
        }
        if (state.instructionType !== interrupt.value.type) {
          newState.instructionType = interrupt.value.type;
          changed = true;
        }
      }

      // 1. Content Phase (Dominant)
      if (values.content?.final_content) {
        if (values.content.final_content.body_markdown) {
          if (!state.generatedContent || !state.isEditing) {
            if (
              state.generatedContent !==
              values.content.final_content.body_markdown
            ) {
              newState.generatedContent =
                values.content.final_content.body_markdown;
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
        const newOutline = interrupt.value.data as Outline;
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
      // 3. Topics Phase
      else if (interrupt?.value.topics) {
        const newTopics = interrupt.value.topics as string[];
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
        const primaryKeyword = interrupt?.value["Primary Keyword"];
        if (keywords && keywords.length > 0) {
          if (
            JSON.stringify(state.suggestedKeywords) !== JSON.stringify(keywords)
          ) {
            newState.primaryKeyword = primaryKeyword || "";
            newState.suggestedKeywords = keywords;
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
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    step: initialStep, // Start from 'topics' if needed, but 'keyword' is safer if streaming is required
    userKeyword: initialKeyword,
  });

  // NOTE: If initialStep is 'topics' and initialKeyword is present (from Library),
  // we technically need the stream to be in a state where it has already "suggested" topics
  // or we need to manually kickstart it.
  // For the "Pick from Library" flow, we might need to simulate the 'keyword' -> 'suggestions' -> 'select' flow
  // OR just start sending a message as if a keyword was selected.
  // Given the current complex state logic, simply setting 'userKeyword' might be enough to PRE-FILL the form
  // if we start at 'keyword' step.
  // The requirements say: "on click of this there are a library of keywords... user select any keyword then its goes to next step where choose of topics".
  // This implies we skip the "suggestions" phase and go straight to topics?
  // If so, we need to handle that.
  // Let's implement an effect to auto-submit if initialKeyword is provided AND we want to skip.

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
  } = state;

  const onThreadId = useCallback(
    (id: string | null) => dispatch({ type: "SET_THREAD_ID", payload: id }),
    [],
  );

  const streamConfig = useMemo(
    () => ({
      apiUrl: "http://192.168.1.130:2024/",
      assistantId: "agent",
      messagesKey: "messages",
      threadId: threadId,
      onThreadId: onThreadId,
    }),
    [threadId, onThreadId],
  );

  const { values, submit, isLoading } = useStream<WREXT>(streamConfig);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Run once on mount to handle initial keyword
  useEffect(() => {
    if (initialKeyword && step === "keyword" && !values) {
      // If we have an initial keyword (from Library), we might want to "Select" it immediately.
      // However, the current flow requires receiving recommendations first to proceed to topics?
      // Or does "Select Keyword" -> "Topics"?

      // Let's assume for "Library", we treat it as if the user entered the keyword and clicked submit.
      // OR better: we treat it as "Selecting" a keyword directly?
      // But "Select Keyword" requires an interrupt value (Recommendations) usually.

      // If "Pick from Library" implies we already have the researched keyword data, we might need to mock that state.
      // But simpler approach: Auto-submit the keyword search to get suggestions/data?
      // Re-reading request: "User select any keyword the its goes to next step where choose of topics"
      // This implies skipping suggestions.

      // To skip suggestions and go to topics, we need to send the 'Primary Keyword' directly?
      // Let's try auto-submitting as if selecting a keyword.
      if (initialStep === "suggestions" || initialStep === "topics") {
        // Simulating selection
        // We won't have 'interrupt' values yet, so we pass empty Recommendations?
        /*
                submit(
                  {
                    "Primary Keyword": initialKeyword,
                    Recommendations: [], 
                    instruction_response: initialKeyword,
                    continue_workflow: true,
                  },
                  {
                    // We can't use resume: true if we haven't started? 
                    // We might need to start a NEW run with these inputs?
                    // The current backend graph might expect a specific state.
                    // For now, let's just pre-fill the keyword form and let the user click "Next" (or "Begin Research")
                    // unless we are sure.
                  }
                );
                */
        // SAFE FALLBACK: Just pre-fill and auto-submit the SERP search?
        // Since we technically need to "Analyze a new keyword" for Start Fresh,
        // but for Library "skip the research phase", it implies we trust the keyword.

        // If we really want to go to topics, we need to interact with the agent flow correctly.
        // Given I don't see the backend agent code, I will implement it such that:
        // If coming from Library, we auto-trigger the "Submit Keyword" action.
        handleKeywordSubmit();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    if (values) {
      dispatch({ type: "UPDATE_FROM_STREAM", payload: values });
    }
    log.info("values", values);
    log.info("step", step);
    log.info("isEditing", isEditing);
  }, [values, step, isEditing]);

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
    log.info("[User Action: Select Keyword]", selected);
    const interrupt = values.__interrupt__?.[0];
    submit(
      {
        "Primary Keyword": selected,
        Recommendations: interrupt?.value.Recommendations || [],
        instruction_response: selected, // Keep consistent with original
        continue_workflow: true,
      },
      {
        // CRITICAL: Use command.resume to resume from interrupt
        // If we are 'Library' flow, check if we have interrupt?
        // If not, we might be starting fresh?
        command: { resume: true },
      },
    );

    dispatch({ type: "SET_STEP", payload: "topics" });
  };

  const handleTopicSelect = (selected: string) => {
    log.info("[User Action: Select Topic]", selected);
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
    <div
      className={cn(
        "max-w-3xl mx-auto w-full flex flex-col items-center relative px-6 transition-all duration-700",
        step === "keyword" ? "min-h-[70vh] justify-center" : "min-h-0 pt-2",
      )}
    >
      {/* Back Button */}
      <div className="absolute top-0 left-6">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-primary"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

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
        />
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

      {step === "content" && values?.content?.final_content && (
        <div className="w-full mt-8">
          <ContentEditor
            values={values}
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
        </div>
      )}
    </div>
  );
}
