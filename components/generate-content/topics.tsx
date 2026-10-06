"use client";

import { ArrowRight, RefreshCcw, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface TopicsSectionProps {
  recommendedTopic?: string | null;
  topic?: string | null;
  instruction: string;
  topics: string[];
  onSelect: (topic: string) => void;
  onContinue?: (topic: string) => void;
  onRegenerate: (feedback: string) => void;
  isRegenerating?: boolean;
  keyword?: string;
  intent?: string;
  contentContext?: string;
}

export function TopicsSection({
  instruction,
  topics,
  onSelect,
  onContinue,
  onRegenerate,
  isRegenerating = false,
  recommendedTopic,
  keyword,
  intent,
  contentContext,
}: TopicsSectionProps) {
  const [feedback, setFeedback] = useState("");

  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    recommendedTopic || null,
  );

  useEffect(() => {
    if (recommendedTopic) {
      setSelectedTopic(recommendedTopic);
    }
  }, [recommendedTopic]);

  const handleRegenerate = () => {
    if (isRegenerating) return;
    onRegenerate(feedback);
    setFeedback("");
  };

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
  };

  return (
    <div className="w-full py-3">
      {/* Header */}
      <div className="mb-6 space-y-3">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold text-foreground tracking-tight leading-tight"
        >
          {instruction}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-sm"
        >
          Pick a title below, or refine the direction with your own feedback.
        </motion.p>
      </div>

      {/* Topic cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {topics.map((topic, index) => {
          const isSelected = selectedTopic === topic;
          const isRecommended = recommendedTopic === topic;

          return (
            <motion.button
              key={topic}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.06 + 0.15,
                duration: 0.35,
              }}
              onClick={() => handleSelectTopic(topic)}
              disabled={isRegenerating}
              className={cn(
                "group relative flex flex-col items-start gap-2 text-left p-6 rounded-md cursor-pointer border outline-none",
                "transition-all duration-200",
                "active:scale-[0.985]",
                isSelected
                  ? "border-foreground bg-card"
                  : "bg-card border-border hover:border-foreground/40",
                isRegenerating && "opacity-40 pointer-events-none",
              )}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex flex-col gap-1.5 items-start">
                  <span
                    className={cn(
                      "text-sm font-semibold leading-snug pr-4 transition-colors",
                      isSelected ? "text-foreground" : "text-foreground",
                    )}
                  >
                    {topic}

                    {isRecommended && (
                      <span className="inline-block m-1 rounded-md border border-foreground px-1.5 py-0.5 text-caption font-medium text-foreground">
                        Recommended
                      </span>
                    )}
                  </span>

                  {(keyword || intent || contentContext) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {keyword && (
                        <span className="text-caption font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                          <span className="text-foreground/70">{keyword}</span>
                        </span>
                      )}
                      {intent && (
                        <span className="text-caption font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md capitalize">
                          <span className="text-foreground/70">{intent}</span>
                        </span>
                      )}
                      {contentContext && (
                        <span className="text-caption font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md capitalize">
                          <span className="text-foreground/70">
                            {contentContext}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <span
                  className={cn(
                    "shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-200",
                    isSelected
                      ? "bg-foreground"
                      : "bg-muted group-hover:bg-muted",
                  )}
                >
                  <ArrowRight
                    className={cn(
                      "w-4 h-4 transition-all duration-200",
                      isSelected
                        ? "text-background translate-x-0.5"
                        : "text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5",
                    )}
                  />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Regenerate area */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="relative"
      >
        <div className="w-full max-w-3xl rounded-md border border-border bg-card p-1.5">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="!bg-card !border !border-border text-foreground h-9 w-full sm:w-auto"
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
              className="!bg-background !border !border-border !h-9 placeholder:text-muted-foreground"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Or describe what you're looking for..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && feedback.trim()) {
                  handleRegenerate();
                }
              }}
            />

            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating || !feedback.trim()}
              className="!bg-card h-9 !border !border-border w-full sm:w-auto"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end mt-8"
      >
        <Button
          onClick={() => {
            if (!selectedTopic) return;

            onSelect(selectedTopic);
            onContinue?.(selectedTopic);
          }}
          disabled={!selectedTopic || isRegenerating}
          className="min-w-[140px]"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
