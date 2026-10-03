"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Bot,
  CheckCircle2,
  Loader2,
  Globe,
  Wrench,
  Zap,
} from "lucide-react";
import { formatNodeName } from "@/lib/generate-content/stream-utils";

export interface ToolCall {
  id: string;
  name: string;
  query: string;
  status: "running" | "done";
  resultCount?: number;
  output?: string;
}

interface PipelineStep {
  label: string;
  status: "pending" | "active" | "done";
}

interface AgentActivityPanelProps {
  isVisible: boolean;
  currentStep: string;
  stepDescription: string;
  toolCalls: ToolCall[];
  pipelineSteps: PipelineStep[];
}

const TOOL_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  duckduckgo_results_json: Search,
  web_search: Globe,
  search: Search,
};

function getToolIcon(name: string) {
  for (const [key, Icon] of Object.entries(TOOL_ICON_MAP)) {
    if (name.toLowerCase().includes(key)) return Icon;
  }
  return Wrench;
}

function getToolLabel(name: string) {
  if (
    name.toLowerCase().includes("duck") ||
    name.toLowerCase().includes("search")
  )
    return "Web Search";
  return formatNodeName(name);
}

function ToolCallCard({
  tc,
  Icon,
  isRunning,
  hasOutput,
}: {
  tc: ToolCall;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
  isRunning: boolean;
  hasOutput: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`relative rounded-md border overflow-hidden transition-colors ${
        isRunning
          ? "bg-amber-500/5 border-amber-500/20"
          : "bg-emerald-500/4 border-emerald-500/15"
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-0.5 ${isRunning ? "bg-amber-400" : "bg-emerald-500/60"}`}
      />

      <div className="flex items-start gap-2 pl-3 pr-2.5 py-2">
        <div
          className={`shrink-0 mt-0.5 ${isRunning ? "text-amber-500" : "text-emerald-500"}`}
        >
          {isRunning ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <CheckCircle2 size={10} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <Icon size={8} className="text-muted-foreground/50 shrink-0" />
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider">
              {getToolLabel(tc.name)}
            </span>
          </div>
          <div className="text-[10px] text-foreground/70 leading-snug">
            <span className="text-muted-foreground/35">"</span>
            {tc.query.length > 42 ? `${tc.query.slice(0, 42)}…` : tc.query}
            <span className="text-muted-foreground/35">"</span>
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
                  className="text-[8px] text-muted-foreground/40 hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                  {expanded ? "hide" : "view"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && tc.output && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mx-2 mb-2 p-1.5 rounded-md bg-background/60 border border-border/40 text-[9px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              {tc.output}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AgentActivityPanel({
  isVisible,
  currentStep,
  stepDescription,
  toolCalls,
  pipelineSteps,
}: AgentActivityPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll feed to bottom when new tool calls arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: toolCalls.length triggers scroll when items are added
  useEffect(() => {
    if (feedRef.current && !collapsed) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [toolCalls.length, collapsed]);

  const activeToolCount = toolCalls.filter(
    (t) => t.status === "running",
  ).length;
  const doneToolCount = toolCalls.filter((t) => t.status === "done").length;
  const activePipelineStep = pipelineSteps.find((s) => s.status === "active");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-5 right-5 z-50 w-[290px] select-none"
        >
          <div className="rounded-md border border-border/80 bg-card/98 backdrop-blur-2xl shadow-black/20 overflow-hidden ring-1 ring-white/5">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b border-border/50 hover:bg-muted/60 transition-colors"
              onClick={() => setCollapsed((c) => !c)}
            >
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <Bot size={13} className="text-foreground" />
                  {activeToolCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                  {activeToolCount === 0 && currentStep && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-foreground tracking-[0.12em] uppercase">
                  Agent Activity
                </span>
                {activeToolCount > 0 && (
                  <span className="text-[9px] bg-amber-400/15 text-amber-500 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold border border-amber-400/20">
                    {activeToolCount} active
                  </span>
                )}
              </div>
              <div className="text-muted-foreground/60">
                {collapsed ? (
                  <ChevronUp size={11} />
                ) : (
                  <ChevronDown size={11} />
                )}
              </div>
            </button>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  {/* ── Current Step ──────────────────────────────────────────── */}
                  {(currentStep || activePipelineStep) && (
                    <div className="px-3.5 pt-2.5 pb-2 border-b border-border/40 bg-amber-500/3">
                      <div className="flex items-start gap-2">
                        <Loader2
                          size={10}
                          className="text-amber-500 animate-spin shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-foreground leading-tight">
                            {currentStep || activePipelineStep?.label}
                          </div>
                          {stepDescription && (
                            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                              {stepDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Pipeline Steps ────────────────────────────────────────── */}
                  {pipelineSteps.length > 0 && (
                    <div className="px-3.5 pt-2.5 pb-2 border-b border-border/40">
                      <div className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.18em] mb-2">
                        Pipeline
                      </div>
                      <div className="space-y-0">
                        {pipelineSteps.map((step, idx) => (
                          <div
                            key={step.label}
                            className="flex items-stretch gap-2"
                          >
                            <div className="flex flex-col items-center w-3 shrink-0">
                              <div
                                className={`w-2 h-2 rounded-full border shrink-0 mt-0.5 transition-all duration-300 ${
                                  step.status === "done"
                                    ? "bg-emerald-500 border-emerald-500"
                                    : step.status === "active"
                                      ? "bg-amber-400 border-amber-400"
                                      : "bg-transparent border-border/50"
                                }`}
                              />
                              {idx < pipelineSteps.length - 1 && (
                                <div
                                  className={`w-px flex-1 mt-0.5 mb-0.5 min-h-[10px] ${
                                    step.status === "done"
                                      ? "bg-emerald-500/30"
                                      : "bg-border/30"
                                  }`}
                                />
                              )}
                            </div>
                            <div
                              className={`flex-1 pb-2 pt-0.5 ${idx === pipelineSteps.length - 1 ? "pb-0" : ""}`}
                            >
                              <span
                                className={`text-[10px] leading-tight ${
                                  step.status === "done"
                                    ? "text-muted-foreground/35 line-through"
                                    : step.status === "active"
                                      ? "text-foreground font-semibold"
                                      : "text-muted-foreground/30"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Tool Calls Feed ───────────────────────────────────────── */}
                  {toolCalls.length > 0 && (
                    <div className="px-3 pt-2.5 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.18em]">
                          Research
                        </div>
                        <div className="flex items-center gap-1 text-[9px]">
                          <span className="text-emerald-500 font-bold">
                            {doneToolCount}
                          </span>
                          <span className="text-muted-foreground/30">/</span>
                          <span className="text-muted-foreground/50">
                            {toolCalls.length}
                          </span>
                        </div>
                      </div>
                      <div
                        ref={feedRef}
                        className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/15 scrollbar-track-transparent pr-0.5"
                      >
                        {toolCalls.map((tc) => {
                          const Icon = getToolIcon(tc.name);
                          const isRunning = tc.status === "running";
                          const hasOutput = tc.status === "done" && !!tc.output;
                          return (
                            <ToolCallCard
                              key={tc.id}
                              tc={tc}
                              Icon={Icon}
                              isRunning={isRunning}
                              hasOutput={hasOutput}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {toolCalls.length === 0 &&
                    !currentStep &&
                    pipelineSteps.length === 0 && (
                      <div className="px-4 py-5 text-center text-[10px] text-muted-foreground/50">
                        Waiting for agent…
                      </div>
                    )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
