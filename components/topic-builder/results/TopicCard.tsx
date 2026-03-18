"use client";

import { Check } from "lucide-react";
import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TopicCardProps } from "@/types/topic-builder-results";
import { TopicCardActions } from "./TopicCardActions";

export const TopicCard = memo(function TopicCard({
  topic,
  onSelect,
  isSelected = false,
  isHighlighted = false,
  onSave,
  onNavigateToContent,
  onViewDetails,
  onCopy,
  className,
}: TopicCardProps) {
  const [_isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(topic.id);
    }
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "transition-all duration-150 cursor-pointer group relative",
          "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20",
          isSelected && "ring-2 ring-primary",
          isHighlighted &&
            "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20 animate-pulse",
          className,
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Left Column: Checkbox + Title + Actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                {/* Selection Checkbox */}
                {onSelect && (
                  <div className="flex-shrink-0 mt-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        onSelect(topic.id, !!checked)
                      }
                      className="h-4 w-4"
                      aria-label={`Select topic: ${topic.topic_name || topic.title}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {/* Title, Saved Indicator, and Action Chips */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg line-clamp-2 pr-2 group-hover:text-primary transition-colors">
                      {topic.topic_name || topic.title}
                    </h3>

                    {/* Saved Indicator */}
                    {(topic._optimisticSaved || topic.is_saved) && (
                      <div className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-medium shadow-sm flex-shrink-0 bg-green-500">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>

                  {/* Action Chips - aligned with title */}
                  <TopicCardActions
                    topic={topic}
                    onSave={onSave}
                    onNavigateToContent={onNavigateToContent}
                    onViewDetails={onViewDetails}
                    onCopy={onCopy}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});
