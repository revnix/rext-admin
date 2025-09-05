"use client";

import { Check, Hash, Info, Lightbulb, Target, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";
import { TopicActions } from "./TopicActions";

interface TopicCardProps {
  topic: GeneratedTopic;
  isSelected: boolean;
  onSelect: (topicId: string, selected: boolean) => void;
  onSave?: (topicId: string) => Promise<void> | void;
  onEdit?: (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => Promise<void> | void;
  onRegenerate?: (topicId: string) => Promise<void> | void;
  onExport?: (
    topics: GeneratedTopic[],
    format: "json" | "csv",
  ) => Promise<void> | void;
  onDelete?: (topicId: string) => Promise<void> | void;
  onNavigateToIdeas?: () => void;
  onGenerateNew?: () => void;
  className?: string;
}

export function TopicCard({
  topic,
  isSelected,
  onSelect,
  onSave,
  onEdit,
  onRegenerate,
  onExport,
  onDelete,
  onNavigateToIdeas,
  onGenerateNew,
  className,
}: TopicCardProps) {
  const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('[role="checkbox"], button')) {
      return;
    }
    onSelect(topic.id, !isSelected);
  };

  const overallScore = Math.round(
    ((topic.scores.relevance + topic.scores.freshness + topic.scores.novelty) /
      3) *
      100,
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "emerald";
    if (score >= 60) return "amber";
    return "red";
  };

  const scoreColor = getScoreColor(overallScore);

  // Enhanced Grid View - Single View with Icons and Tooltips
  return (
    <TooltipProvider>
      {/* biome-ignore lint/a11y/useSemanticElements: Card needs div for proper styling */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "group relative cursor-pointer rounded-lg border-2 border-border/80 bg-background/50 backdrop-blur-sm transition-all duration-150 hover:border-border hover:bg-background/80 hover:shadow-md",
          isSelected &&
            "border-primary bg-primary/8 shadow-md ring-1 ring-primary/20",
          className,
        )}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick(e);
          }
        }}
      >
        {/* Header */}
        <div className="relative p-5 pb-4">
          {/* Selection Checkbox */}
          <div className="absolute left-4 top-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(topic.id, !!checked)}
              className="border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary transition-all duration-150"
              aria-label={`Select topic: ${topic.title}`}
            />
          </div>

          {/* Saved Indicator */}
          {(topic._optimisticSaved || topic.is_saved) && (
            <div className="absolute right-16 top-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-medium shadow-sm",
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
            </div>
          )}

          {/* Topic Actions */}
          <div className="absolute right-4 top-4">
            <TopicActions
              topic={topic}
              onSave={onSave}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onExport={onExport}
              onDelete={onDelete}
              onNavigateToIdeas={onNavigateToIdeas}
              onGenerateNew={onGenerateNew}
              variant="dropdown"
            />
          </div>

          {/* Content */}
          <div className="mt-6">
            <h3 className="mb-2 text-base font-medium leading-snug text-foreground pr-16">
              {topic.title}
            </h3>
            {topic.angle && (
              <p className="mb-3 text-sm text-muted-foreground/80">
                {topic.angle}
              </p>
            )}
            {topic.description && (
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {topic.description}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-4 p-5 pt-0">
          {/* Score Row */}
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground/60">
                    Quality Score
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Based on relevance ({Math.round(topic.scores.relevance * 100)}
                  %), freshness ({Math.round(topic.scores.freshness * 100)}%),
                  and novelty ({Math.round(topic.scores.novelty * 100)}%)
                </p>
              </TooltipContent>
            </Tooltip>
            <div
              className={cn(
                "inline-flex h-7 w-12 items-center justify-center rounded-full text-xs font-semibold",
                scoreColor === "emerald" &&
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                scoreColor === "amber" &&
                  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
                scoreColor === "red" &&
                  "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
              )}
            >
              {overallScore}%
            </div>
          </div>

          {/* Why It Works */}
          {topic.why_it_works && (
            <div className="rounded-md bg-muted/30 p-3">
              <div className="flex gap-2 text-xs">
                <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-muted-foreground mb-1">
                    Why This Works
                  </p>
                  <p className="text-muted-foreground/80 leading-relaxed">
                    {topic.why_it_works}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Row with Icons */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: Channels & Audience */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Channels */}
              {topic.channel_fit && topic.channel_fit.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <Target className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground/80 truncate">
                        {topic.channel_fit.slice(0, 2).join(", ")}
                        {topic.channel_fit.length > 2 &&
                          ` +${topic.channel_fit.length - 2}`}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-medium mb-1">Best Channels:</p>
                    <p className="text-xs">{topic.channel_fit.join(", ")}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Audience */}
              {topic.audience_fit && topic.audience_fit.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <Users className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground/80 truncate">
                        {topic.audience_fit.slice(0, 2).join(", ")}
                        {topic.audience_fit.length > 2 &&
                          ` +${topic.audience_fit.length - 2}`}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-medium mb-1">Target Audience:</p>
                    <p className="text-xs">{topic.audience_fit.join(", ")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Right: Tags */}
            {topic.tags && topic.tags.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <Hash className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      {topic.tags.slice(0, 3).map((tag, index) => (
                        <div
                          key={tag}
                          className={cn(
                            "h-2 w-2 rounded-full",
                            index === 0 && "bg-purple-400",
                            index === 1 && "bg-purple-300",
                            index === 2 && "bg-purple-200",
                          )}
                        />
                      ))}
                      {topic.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground/60 ml-1">
                          +{topic.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium mb-1">Tags:</p>
                  <p className="text-xs">{topic.tags.join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
