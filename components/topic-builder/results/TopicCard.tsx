"use client";

import { Check, Copy, Eye, PenTool, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CircularProgress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicCardProps {
  topic: GeneratedTopic;
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
  onSave?: (topicId: string) => Promise<void> | void;
  onNavigateToContent?: (topicId: string) => void;
  onViewDetails?: (topicId: string) => void;
  onCopy?: (topicId: string) => void;
  className?: string;
}

export function TopicCard({
  topic,
  onSelect,
  isSelected = false,
  onSave,
  onNavigateToContent,
  onViewDetails,
  onCopy,
  className,
}: TopicCardProps) {
  const [_isHovered, setIsHovered] = useState(false);

  // Calculate overall score for circular progress
  const overallScore = Math.round(
    ((topic.scores.relevance + topic.scores.freshness + topic.scores.novelty) /
      3) *
      100,
  );

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(topic.id);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
      await onSave(topic.id);
    }
  };

  const handleWriteContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigateToContent) {
      onNavigateToContent(topic.id);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(topic.id);
    } else {
      // Default copy behavior
      await navigator.clipboard.writeText(
        `${topic.title}\n${topic.description || topic.angle}`,
      );
    }
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "transition-all duration-200 cursor-pointer group relative",
          "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20",
          isSelected && "ring-2 ring-primary",
          className,
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          {/* Selection Checkbox */}
          {onSelect && (
            <div className="absolute top-3 right-3 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(topic.id, !!checked)}
                className="h-4 w-4"
                aria-label={`Select topic: ${topic.title}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Main Content Area */}
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

              {/* Action Chips */}
              <div className="flex items-center gap-2 mb-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2 gap-1 text-xs"
                      onClick={handleCardClick}
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View topic details</p>
                  </TooltipContent>
                </Tooltip>

                {onSave && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 gap-1 text-xs"
                        onClick={handleSave}
                        disabled={topic._isBeingSaved || topic.is_saved}
                      >
                        <Save className="h-3 w-3" />
                        {topic.is_saved ? "Saved" : "Save"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {topic.is_saved ? "Already saved" : "Save to library"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {onNavigateToContent && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 gap-1 text-xs"
                        onClick={handleWriteContent}
                      >
                        <PenTool className="h-3 w-3" />
                        Write
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create content for this topic</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2 gap-1 text-xs"
                      onClick={handleCopy}
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy topic to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
