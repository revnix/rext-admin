"use client";

import { useReducer, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingIndicatorVariants } from "@/components/ui/content/loading-indicator-variants";
import type {
  PageState,
  ResumeOptions,
  RunStreamEvent,
  StreamUpdates,
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
import ContentType from "./content-type";
import { useAuthSession } from "@/hooks/use-auth-session";
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

interface FreshGenerationViewProps {
  onBack: () => void;
  initialKeyword?: string;
  initialStep?: PageState["step"];
}

function ProgressStepper({ steps, activeNode, completedNodes }: { steps: any[], activeNode: string | null, completedNodes: string[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="w-full mb-6 flex items-baseline gap-1.5 px-0.5">
      {steps.map((step, idx) => {
        const isCompleted = completedNodes.includes(step.id);
        const isActive = activeNode === step.id;

        return (
          <div key={step.id + idx} className="flex-1 group">
            <div className={cn(
              "h-1 w-full rounded-full transition-all duration-700 ease-in-out mb-1.5",
              isCompleted ? "bg-primary" : isActive ? "bg-primary/40 relative overflow-hidden" : "bg-muted"
            )}>
              {isActive && (
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute inset-0 bg-primary/60"
                />
              )}
            </div>
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-[0.1em] block transition-colors duration-300",
              isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground",
              isCompleted ? "text-primary/70" : ""
            )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const cleanStreamingJSON = (json: string) => {
  if (!json) return "";
  // Check if it's likely a JSON fragment
  if (!json.includes('"') && !json.includes('{')) return json;

  return json
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    // Capture specific fields for better presentation
    .replace(/\{"title":\s*"/g, "TITLE: ")
    .replace(/\{"heading":\s*"/g, "\n\nSECTION: ")
    .replace(/"description":\s*"/g, "\n    ")
    .replace(/"key_points":\s*\[\s*"/g, "\n    • ")
    .replace(/"brief":\s*"/g, "\nBRIEF: ")
    .replace(/"slug_suggestion":\s*"/g, "\nSLUG: ")
    .replace(/"focus_keyphrase":\s*"/g, "\nKEYPHRASE: ")
    .replace(/"keywords_to_include":\s*\[\s*"/g, "\nKEYWORDS: ")
    .replace(/"body_markdown":\s*"/g, "")
    // Clean up generic JSON artifacts
    .replace(/"\s*,\s*"/g, "\n")
    .replace(/["{}[\]]/g, "")
    .replace(/\\/g, "")
    .replace(/:/g, ": ") // add space after colon
    .replace(/\s+/g, " ") // normalize spacing
    .trim();
};

export function FreshGenerationView({
  onBack: _onBack,
  initialKeyword: _initialKeyword = "",
  initialStep: _initialStep = "keyword",
}: FreshGenerationViewProps) {
  const [state, dispatch] = useReducer(generationReducer, initialState);
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
    allContent,
    currentLoadingSteps,
    keywordDifficulty,
    activeNode,
    streamingPlan,
    isEEATProcessed,
    isHumanized,
  } = state;

  const processStream = async (
    stream: AsyncGenerator<RunStreamEvent>,
  ): Promise<void> => {
    let internalActiveNode = state.activeNode;
    try {
      for await (const chunk of stream) {
        // 1. Handle Message Streaming (ChatGPT Style)
        if (chunk.event === "messages" || chunk.event === "messages/partial") {
          const [message, metadata] = Array.isArray(chunk.data)
            ? chunk.data
            : [chunk.data, {}];

          let node = metadata?.langgraph_node || internalActiveNode;

          // If node info is missing but content matches outline structure, pre-emptively set it
          if (!node) {
            const content = typeof message.content === "string" ? message.content : "";
            if (content.includes('{"title":')) {
              node = "generate_outline";
              internalActiveNode = "generate_outline";
              dispatch({ type: "SET_ACTIVE_NODE", payload: "generate_outline" });
            }
          }

          // user specifically requested to stream strictly for outline generation
          const streamingNodes = [
            "generate_outline",
            "topic_generation",
            "generate_content",
            "inject_eeat",
            "humanize_content",
            "review_content",
          ];

          if (node && streamingNodes.includes(node)) {
            let text = "";
            if (typeof message.content === "string") {
              text = message.content;
            } else if (Array.isArray(message.content)) {
              text = message.content.map((c: any) => c.text || "").join("");
            } else if (message.tool_call_chunks?.[0]?.args) {
              const argsChunk = message.tool_call_chunks[0].args;
              // Accept all tokens from tool calls (JSON fragments)
              text = argsChunk;
            }

            if (text) {
              if (node === "generate_outline") {
                dispatch({ type: "SET_STREAMING_PLAN", payload: text });
              } else {
                dispatch({ type: "SET_STREAMING_CONTENT", payload: text });
              }
            }
          }
        }

        if (chunk.event === "updates") {
          const updates = chunk.data as StreamUpdates;
          // Dispatch general update
          dispatch({ type: "UPDATE_FROM_STREAM", payload: updates });

          // Extract and format node names for the loading UI
          Object.keys(updates)
            .filter((key) => !key.startsWith("__"))
            .forEach((node) => {
              internalActiveNode = node;
              dispatch({ type: "SET_ACTIVE_NODE", payload: node });
              dispatch({
                type: "SET_LOADING_STATUS",
                payload: `${formatNodeName(node)}...`,
              });

              // Clear content if we just started a generation node
              if (["generate_outline"].includes(node)) {
                dispatch({ type: "SET_STREAMING_PLAN", payload: "" });
              }

              if (["generate_content", "inject_eeat", "humanize_content", "review_content"].includes(node)) {
                // Only clear if we're not already in content mode to maintain stream
                if (state.instructionType !== "content") {
                  dispatch({ type: "SET_GENERATED_CONTENT", payload: "" });
                  dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });
                }
              }
            });

          // Specialized content/review updates
          // Enhanced content extraction (checks both nested and flat structures)
          const finalContent =
            updates?.review_content?.content?.final_content ||
            updates?.review_content?.final_content ||
            updates?.humanize_content?.content?.final_content ||
            updates?.humanize_content?.final_content ||
            updates?.inject_eeat?.content?.final_content ||
            updates?.inject_eeat?.final_content ||
            updates?.generate_content?.content?.final_content ||
            updates?.generate_content?.final_content;

          if (finalContent) {
            dispatch({ type: "SET_ALL_CONTENT", payload: finalContent });
            dispatch({ type: "SET_GENERATED_CONTENT", payload: finalContent.body_markdown });
            dispatch({ type: "SET_INSTRUCTION_TYPE", payload: "content" });

            if (updates?.humanize_content) dispatch({ type: "SET_HUMANIZED", payload: true });
            if (updates?.inject_eeat) dispatch({ type: "SET_EEAT_PROCESSED", payload: true });
          }


          if (updates?.calculate_on_page_seo?.content?.review?.on_page_metrics) {
            dispatch({
              type: "SET_SEO_SCORE",
              payload: updates.calculate_on_page_seo.content.review.on_page_metrics,
            });
          }

          if (updates?.calculate_eeat_trust?.content?.review?.trust_score) {
            dispatch({
              type: "SET_TRUST_SCORE",
              payload: updates.calculate_eeat_trust.content.review.trust_score,
            });
          }

          if (updates?.calculate_readability?.content?.review?.readability_metrics) {
            dispatch({
              type: "SET_READABILITY_SCORE",
              payload: updates.calculate_readability.content.review.readability_metrics,
            });
          }
        }
      }
    } catch (_error) {
      console.error("Stream processing error:", _error);
    } finally {
      // Intentional UX hold: lets the user see the final completed loading step
      await new Promise((resolve) => setTimeout(resolve, 1000));
      dispatch({ type: "SET_MANUAL_LOADING", payload: false });
      dispatch({ type: "SET_LOADING_STATUS", payload: "" });
      dispatch({ type: "SET_LOADING_STEPS", payload: [] });
    }
  };

  const handleKeywordSubmit = async (keywordToUse?: string) => {
    const finalKeyword = keywordToUse || userKeyword;
    if (!finalKeyword) return;

    dispatch({ type: "SET_USER_KEYWORD", payload: finalKeyword });
    dispatch({ type: "CLEAR_COMPLETED_NODES" });
    dispatch({ type: "SET_LOADING_STEPS", payload: INITIAL_ANALYSIS_STEPS });
    dispatch({ type: "SET_MANUAL_LOADING", payload: true });
    dispatch({ type: "SET_LOADING_STATUS", payload: "Creating session..." });

    try {
      const newThreadId = await createThread();
      if (!newThreadId) throw new Error("Thread creation failed");

      dispatch({ type: "SET_THREAD_ID", payload: newThreadId });
      dispatch({ type: "SET_LOADING_STATUS", payload: "Starting analysis..." });

      const stream = streamFromSSE(`/api/generate/${newThreadId}/stream`, {
        input: {
          serp_payload: {
            query: finalKeyword,
            country,
            user_id: user?.id,
            workspace_id: workspaceId ?? undefined,
          },
        },
        streamMode: ["updates", "messages"],
        streamSubgraphs: true,
      });

      await processStream(stream);
    } catch (e) {
      console.error("Submission failed:", e);
      dispatch({ type: "SET_MANUAL_LOADING", payload: false });
    }
  };

  // Handle initial keyword from library
  useEffect(() => {
    if (_initialKeyword && !threadId) {
      handleKeywordSubmit(_initialKeyword);
    }
  }, [_initialKeyword]);

  const resumeWorkflow = async ({ payload, status }: ResumeOptions) => {
    if (!threadId) return;

    dispatch({ type: "CLEAR_COMPLETED_NODES" });
    dispatch({ type: "SET_MANUAL_LOADING", payload: true });

    if (status) {
      dispatch({ type: "SET_LOADING_STATUS", payload: status });
    }

    const stream = streamFromSSE(`/api/generate/${threadId}/resume`, {
      payload,
      streamMode: ["updates", "messages"],
      streamSubgraphs: true,
    });

    await processStream(stream);
  };

  const handleWorkflow = (step: WorkflowStep, value: string | any) => {
    if (isLoading || isManualLoading) return;

    switch (step) {
      case "KEYWORD_SELECT":
        dispatch({ type: "SET_LOADING_STEPS", payload: KEYWORD_SELECTION_STEPS });
        return resumeWorkflow({
          payload: { "Primary Keyword": value },
          status: "Researching topics...",
        });

      case "TOPIC_SELECT":
        dispatch({ type: "SET_LOADING_STEPS", payload: TOPIC_GENERATION_STEPS });
        return resumeWorkflow({
          payload: { topic: value },
          status: "Preparing content formats...",
        });

      case "CONTENT_TYPE_SELECT":
        dispatch({ type: "SET_LOADING_STEPS", payload: CONTENT_TYPE_STEPS });
        return resumeWorkflow({
          payload: value,
          status: "Generating outline...",
        });

      case "OUTLINE_APPROVE":
        dispatch({ type: "SET_LOADING_STEPS", payload: FINAL_GENERATION_STEPS });
        return resumeWorkflow({
          payload: { action: "approve" },
          status: "Writing final content...",
        });

      case "OUTLINE_REJECT":
        return resumeWorkflow({ payload: { action: "reject" } });

      case "OUTLINE_REJECT_REASON":
        return resumeWorkflow({ payload: { reason: value } });

      default: {
        const _never: never = step;
        return _never;
      }
    }
  };

  // Determine which UI to show
  // We show the loader if we are explicitly loading AND we don't have enough data yet to show the next step.
  const isKeywordStep = instructionType === "keyword" || instructionType === "keyword Selection";

  if (
    (isLoading || isManualLoading) &&
    instructionType !== "content" &&
    (keywordDifficulty === null || keywordDifficulty === 0 && suggestedKeywords.length === 0)
  ) {
    return (
      <div className={cn(
        "max-w-3xl mx-auto w-full flex flex-col items-center relative px-6 transition-all duration-700 min-h-[70vh] justify-center"
      )}>
        <LoadingIndicatorVariants
          step={instructionType}
          isLoading={true}
          loadingStatus={loadingStatus}
          completedSteps={completedNodes}
          steps={currentLoadingSteps}
          className="mt-5"
        />
      </div>
    );
  }

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
    "topic": (
      <TopicsSection
        instruction={instruction}
        topics={topics}
        onSelect={(selected) => handleWorkflow("TOPIC_SELECT", selected)}
        keyword={primaryKeyword}
      />
    ),
    "content_type": (
      <ContentType
        instruction={instruction}
        contentTypes={contentTypes}
        handleContentTypeSelect={(selected) => handleWorkflow("CONTENT_TYPE_SELECT", selected)}
      />
    ),
    "outline_review": outline && (
      <OutlineDisplay
        outline={outline}
        isLoading={false}
        onApprove={() => handleWorkflow("OUTLINE_APPROVE", "")}
        onReject={() => handleWorkflow("OUTLINE_REJECT", "")}
        onUpdate={(updatedOutline) => {
          dispatch({ type: "SET_OUTLINE", payload: updatedOutline });
        }}
      />
    ),
    "outline_reject": (
      <OutlineRejectSection
        instruction={instruction}
        rejectedReason={rejectedReason}
        onChange={(val) => dispatch({ type: "SET_REJECTED_REASON", payload: val })}
        onSubmit={() => handleWorkflow("OUTLINE_REJECT_REASON", rejectedReason)}
      />
    ),
  };

  return (
    <>
      <div className={cn(
        "max-w-3xl mx-auto w-full flex flex-col items-center relative px-6 transition-all duration-700",
        instructionType === "keyword" ? "min-h-[70vh] justify-center" : "min-h-0 pt-2",
      )}>
        <ProgressStepper
          steps={currentLoadingSteps}
          activeNode={activeNode}
          completedNodes={completedNodes}
        />
        <AnimatePresence mode="wait">
          {instructionType === "keyword" && !(isManualLoading || isLoading) && <HeroSection />}
        </AnimatePresence>

        <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full">
          {isKeywordStep && !(isManualLoading || isLoading) && (
            <KeywordForm
              userKeyword={userKeyword}
              country={country}
              onSubmit={handleKeywordSubmit}
              onKeywordChange={(val) => dispatch({ type: "SET_USER_KEYWORD", payload: val })}
              onCountryChange={(val) => dispatch({ type: "SET_COUNTRY", payload: val })}
            />
          )}
        </motion.div>

        {/* Streaming Preview (AI Agent Style) */}
        {(isManualLoading || isLoading) && (streamingPlan || (generatedContent && instructionType === "content")) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8"
          >
            <div className="bg-muted/40 backdrop-blur-xl border border-primary/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl shadow-primary/5">
              {/* Background Micro-animation */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 animate-pulse pointer-events-none" />

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping absolute inset-0 opacity-50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary relative" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none">
                  {activeNode === "generate_outline" || (streamingPlan?.includes('{"title":'))
                    ? "Architecting Content Plan"
                    : activeNode === "topic_generation"
                      ? "Mapping Semantic Entities"
                      : activeNode === "generate_content"
                        ? "Drafting Narrative Content"
                        : activeNode === "inject_eeat"
                          ? "Establishing Topical Authority"
                          : activeNode === "humanize_content"
                            ? "Infusing Natural Voice"
                            : activeNode
                              ? `Executing ${formatNodeName(activeNode)}`
                              : "Processing Engine"}
                </span>
                <AnimatePresence>
                  {isEEATProcessed && !isHumanized && activeNode !== "humanize_content" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-500/20"
                    >
                      EEAT injection is processed
                    </motion.span>
                  )}
                  {isHumanized && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-500/20"
                    >
                      Humanized
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative group/content-container overflow-hidden rounded-2xl">
                {/* Diagonal Refinement Badges */}
                <AnimatePresence>
                  {activeNode === "inject_eeat" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20, y: 20, rotate: -45 }}
                      animate={{ opacity: 1, x: 0, y: 0, rotate: -45 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-10 right-[-40px] z-20 bg-primary/90 text-primary-foreground px-12 py-2 font-black text-xs uppercase tracking-[0.3em] shadow-xl border-y border-white/20 whitespace-nowrap pointer-events-none"
                    >
                      EEAT APPLICATION IN PROGRESS
                    </motion.div>
                  )}
                  {activeNode === "humanize_content" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20, y: 20, rotate: -45 }}
                      animate={{ opacity: 1, x: 0, y: 0, rotate: -45 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-10 right-[-40px] z-20 bg-green-500/90 text-white px-12 py-2 font-black text-xs uppercase tracking-[0.3em] shadow-xl border-y border-white/20 whitespace-nowrap pointer-events-none"
                    >
                      HUMANIZING AGENT ACTIVE
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide relative z-10 transition-all duration-500">
                  <div className={cn(
                    "space-y-4 text-[13px] leading-relaxed transition-all duration-1000",
                    activeNode === "inject_eeat" && "blur-[10px] opacity-40 select-none grayscale scale-[0.98]",
                    activeNode === "humanize_content" && "blur-[4px] opacity-70 select-none scale-[0.99]",
                    (activeNode === "review_content" || !activeNode) && "blur-0 opacity-100"
                  )}>
                    {(activeNode === "generate_outline" || (streamingPlan?.includes('{"title":'))
                      ? cleanStreamingJSON(streamingPlan)
                      : (generatedContent.length > 800
                        ? "..." + cleanStreamingJSON(generatedContent.slice(-800))
                        : cleanStreamingJSON(generatedContent))
                    ).split('\n').map((line, idx, arr) => {
                      const isLabel = line.match(/^(TITLE|SLUG|BRIEF|KEYPHRASE|KEYWORDS|SECTION):/);
                      const isBullet = line.trim().startsWith('•');
                      const isLast = idx === arr.length - 1;

                      if (isLabel) {
                        const [label, ...rest] = line.split(':');
                        return (
                          <motion.div layout key={idx} className="mt-8 first:mt-0 group">
                            <span className="text-[10px] font-black tracking-[0.2em] text-primary/60 uppercase block mb-1 group-hover:text-primary transition-colors">
                              {label}
                            </span>
                            <p className="text-foreground/90 font-medium">
                              {rest.join(':').trim()}
                              {isLast && (
                                <motion.span
                                  animate={{ opacity: [0, 1] }}
                                  transition={{ repeat: Infinity, duration: 0.8 }}
                                  className="inline-block w-1.5 h-3.5 bg-primary/60 align-middle ml-1.5 rounded-full"
                                />
                              )}
                            </p>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.p layout key={idx} className={cn(
                          "text-muted-foreground/80",
                          isBullet ? "pl-4 border-l-2 border-primary/10 py-0.5" : ""
                        )}>
                          {line}
                          {isLast && (
                            <motion.span
                              animate={{ opacity: [0, 1] }}
                              transition={{ repeat: Infinity, duration: 0.8 }}
                              className="inline-block w-1.5 h-4 bg-primary/40 align-middle ml-1.5 rounded-full"
                            />
                          )}
                        </motion.p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!(isManualLoading || isLoading) && instructionViewMap[instructionType]}
      </div>

      {instructionType === "content" && (
        <ContentEditor
          allContent={allContent}
          readabilityScore={readabilityScore}
          seoScore={seoScore}
          trustScore={trustScore}
          generatedContent={generatedContent}
          isEditing={isEditing}
          userKeyword={userKeyword}
          outline={outline}
          onEditToggle={() => dispatch({ type: "SET_IS_EDITING", payload: !isEditing })}
          onContentChange={(val) => {
            dispatch({ type: "SET_GENERATED_CONTENT", payload: val });
          }}
        />
      )}
    </>
  );
}
