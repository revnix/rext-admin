"use client";

import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TopicCardProps } from "@/types/topic-builder-results";
import { TopicCardActions } from "./TopicCardActions";
import { TopicScoreDisplay } from "./TopicScoreDisplay";

export const TopicCard = memo(function TopicCard({
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
          <TopicScoreDisplay topic={topic} />

          {/* Action Chips */}
          <div className="flex-1 min-w-0">
            <TopicCardActions
              topic={topic}
              onSave={onSave}
              onNavigateToContent={onNavigateToContent}
              onViewDetails={onViewDetails}
              onCopy={onCopy}
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});
