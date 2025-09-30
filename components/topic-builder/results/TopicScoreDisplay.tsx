"use client";

import { Check } from "lucide-react";
import { memo } from "react";
import { CircularProgress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicScoreDisplayProps {
  topic: GeneratedTopic;
}

export const TopicScoreDisplay = memo(function TopicScoreDisplay({
  topic,
}: TopicScoreDisplayProps) {
  // Calculate overall score for circular progress
  const overallScore = Math.round(
    ((topic.scores.relevance +
      topic.scores.seo_potential +
      topic.scores.trend_level +
      topic.scores.uniqueness +
      topic.scores.reader_interest +
      topic.scores.actionable_potential +
      topic.scores.brand_alignment +
      topic.scores.controversy) /
      8) *
      100,
  );

  return (
    <div className="flex items-start gap-4">
      {/* Circular Progress Score */}
      <div className="flex-shrink-0 mt-1">
        <CircularProgress
          value={overallScore}
          size="md"
          className="text-primary"
        />
      </div>

      {/* Title and Basic Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 pr-2 group-hover:text-primary transition-colors">
            {topic.title}
          </h3>

          {/* Saved Indicator */}
          {(topic._optimisticSaved || topic.is_saved) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-medium shadow-sm flex-shrink-0",
                    topic._optimisticSaved && !topic.is_saved
                      ? "bg-amber-500"
                      : "bg-green-500",
                  )}
                >
                  <Check className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {topic._optimisticSaved && !topic.is_saved
                    ? "Saving..."
                    : "Saved"}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
});
