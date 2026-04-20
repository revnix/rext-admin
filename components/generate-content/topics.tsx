"use client";

import { ArrowRight, RefreshCcw, Loader2, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

interface TopicsSectionProps {
  instruction: string;
  topics: string[];
  onSelect: (topic: string) => void;
  onRegenerate: (feedback: string) => void;
  isRegenerating?: boolean;
  keyword?: string;
}

export function TopicsSection({
  instruction,
  topics,
  onSelect,
  onRegenerate,
  isRegenerating = false,
}: TopicsSectionProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setShowFeedback(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleRegenerate = () => {
    if (isRegenerating) return;
    onRegenerate(feedback);
    setFeedback("");
    setShowFeedback(false);
  };

  const handleCancel = () => {
    setFeedback("");
    setShowFeedback(false);
  };

  return (
    <div className="w-full py-3">
      {/* Header */}
      <div className="mb-6 space-y-3">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground tracking-tight leading-tight"
        >
          {instruction}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-sm"
        >
          Pick a topic below, or refine the direction with your own feedback.
        </motion.p>
      </div>

      {/* Topic cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {topics.map((topic, index) => (
          <motion.button
            key={topic}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 + 0.15, duration: 0.35 }}
            onClick={() => onSelect(topic)}
            disabled={isRegenerating}
            className={cn(
              "group relative flex items-start justify-between text-left p-6 rounded-xl cursor-pointer border outline-none",
              "bg-card/60 border-border/50 backdrop-blur-sm",
              "transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
              "active:scale-[0.985] active:shadow-none",
              isRegenerating && "opacity-40 pointer-events-none",
            )}
          >
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug pr-4">
              {topic}
            </span>
            <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center bg-muted/60 group-hover:bg-primary/10 transition-colors duration-200">
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5" />
            </span>
          </motion.button>
        ))}
      </div>

      {/* Regenerate area */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="relative"
      >
        <AnimatePresence mode="wait">
          {!showFeedback ? (
            /* ── Collapsed: single pill button ── */
            <motion.div
              key="pill"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="flex justify-center"
            >
              <button
                type="button"
                onClick={handleOpen}
                disabled={isRegenerating}
                className={cn(
                  "group flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm font-medium",
                  "bg-card cursor-pointer border-border/60 text-muted-foreground",
                  "hover:border-primary/40 hover:text-foreground hover:bg-accent/40",
                  "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-sm hover:shadow-md hover:shadow-primary/5",
                )}
              >
                {isRegenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                )}
                <span>
                  {isRegenerating
                    ? "Regenerating topics…"
                    : "Not what you're looking for?"}
                </span>
              </button>
            </motion.div>
          ) : (
            /* ── Expanded: inline feedback bar ── */
            <motion.div
              key="bar"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 p-1.5 rounded-2xl border border-primary/20 bg-background shadow-lg shadow-primary/5 ring-1 ring-primary/5"
            >
              {/* Icon */}
              <div className="shrink-0 w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center ml-1">
                <RefreshCcw className="w-3.5 h-3.5 text-primary" />
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what to change… e.g. 'more beginner-friendly'"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none py-2 px-1 min-w-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRegenerate();
                  if (e.key === "Escape") handleCancel();
                }}
              />

              {/* Cancel */}
              <button
                type="button"
                onClick={handleCancel}
                className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Submit */}
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-semibold mr-0.5",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 active:scale-95 transition-all duration-150",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <Send className="w-3 h-3" />
                Regenerate
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
