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
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-xl border overflow-hidden transition-colors ${
        isRunning
          ? "bg-amber-500/5 border-amber-500/25"
          : "bg-emerald-500/5 border-emerald-500/20"
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl ${
          isRunning ? "bg-amber-400" : "bg-emerald-500"
        }`}
      />

      <div className="flex items-start gap-2.5 p-2.5">
        <div
          className={`shrink-0 mt-0.5 ${isRunning ? "text-amber-500" : "text-emerald-500"}`}
        >
          {isRunning ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCircle2 size={12} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon size={9} className="text-muted-foreground shrink-0" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              {getToolLabel(tc.name)}
            </span>
          </div>
          <div className="text-[11px] text-foreground/80 leading-tight">
            <span className="text-muted-foreground/60">"</span>
            <span className="truncate block">
              {tc.query.length > 45 ? `${tc.query.slice(0, 45)}…` : tc.query}
            </span>
            <span className="text-muted-foreground/60">"</span>
          </div>
          {tc.status === "done" && tc.resultCount !== undefined && (
            <div className="flex items-center justify-between mt-0.5">
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Zap size={9} />
                {tc.resultCount} result{tc.resultCount !== 1 ? "s" : ""} found
              </div>
              {hasOutput && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  {expanded ? (
                    <ChevronUp size={10} />
                  ) : (
                    <ChevronDown size={10} />
                  )}
                  {expanded ? "hide" : "view"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable output */}
      <AnimatePresence initial={false}>
        {expanded && tc.output && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-2.5 mb-2.5 p-2 rounded-lg bg-background/60 border border-border/50 text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
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
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed bottom-6 right-6 z-50 w-[300px] select-none font-[family-name:var(--font-geist-mono,ui-monospace,monospace)]"
        >
          <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border hover:bg-muted/80 transition-colors"
              onClick={() => setCollapsed((c) => !c)}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <Bot size={15} className="text-primary" />
                  {activeToolCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                  {activeToolCount === 0 && currentStep && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-foreground tracking-wider uppercase">
                  Agent Activity
                </span>
                {activeToolCount > 0 && (
                  <span className="text-[10px] bg-amber-400/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                    {activeToolCount} active
                  </span>
                )}
              </div>
              <div className="text-muted-foreground">
                {collapsed ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </div>
            </button>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* ── Current Step ──────────────────────────────────────────── */}
                  {(currentStep || activePipelineStep) && (
                    <div className="px-4 pt-3 pb-2 border-b border-border/40">
                      <div className="flex items-start gap-2">
                        <Loader2
                          size={11}
                          className="text-amber-500 animate-spin shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-foreground leading-tight truncate">
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
                    <div className="px-4 py-3 border-b border-border/40">
                      <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] mb-2">
                        Pipeline
                      </div>
                      <div className="space-y-1.5">
                        {pipelineSteps.map((step) => (
                          <div
                            key={step.label}
                            className="flex items-center gap-2"
                          >
                            {step.status === "done" ? (
                              <CheckCircle2
                                size={11}
                                className="text-emerald-500 shrink-0"
                              />
                            ) : step.status === "active" ? (
                              <Loader2
                                size={11}
                                className="text-amber-500 animate-spin shrink-0"
                              />
                            ) : (
                              <div className="w-[11px] h-[11px] rounded-full border border-border/60 shrink-0" />
                            )}
                            <span
                              className={`text-[11px] leading-tight ${
                                step.status === "done"
                                  ? "text-muted-foreground line-through"
                                  : step.status === "active"
                                    ? "text-foreground font-semibold"
                                    : "text-muted-foreground/50"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Tool Calls Feed ───────────────────────────────────────── */}
                  {toolCalls.length > 0 && (
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
                          Research
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {doneToolCount}/{toolCalls.length}
                        </div>
                      </div>
                      <div
                        ref={feedRef}
                        className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pr-1"
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
                      <div className="px-4 py-5 text-center text-[11px] text-muted-foreground">
                        Waiting for agent...
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
