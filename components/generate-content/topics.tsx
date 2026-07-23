"use client";

import { ArrowRight, RefreshCcw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

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
  const [feedback, setFeedback] = useState("");

  const handleRegenerate = () => {
    if (isRegenerating) return;
    onRegenerate(feedback);
    setFeedback("");
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
        <div className="w-full max-w-3xl rounded-xl border border-border/70 bg-card/70 p-1.5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="!bg-background !border !border-border/60 text-foreground h-9 w-full sm:w-auto"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
              <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
            </Button>
            <Input
              type="text"
              className="!bg-background !border !border-border/60 !h-9 placeholder:text-muted-foreground"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Or describe what you're looking for..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && feedback.trim()) handleRegenerate();
              }}
            />

            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating || !feedback.trim()}
              className="!bg-background h-9 !border !border-border/60 w-full sm:w-auto"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
