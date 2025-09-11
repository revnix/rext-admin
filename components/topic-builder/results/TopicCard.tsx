"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  PenTool,
  Save,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  const [showDetails, setShowDetails] = useState(false);
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
    } else {
      setShowDetails(true);
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

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
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

              {/* Progressive Disclosure Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleToggleDetails}
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show details
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progressive Disclosure Content */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t space-y-3 animate-in fade-in duration-200">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium mb-1 text-muted-foreground">
                  Description
                </h4>
                <p className="text-sm">{topic.description || topic.angle}</p>
              </div>

              {/* Why It Works */}
              {topic.why_it_works && (
                <div>
                  <h4 className="text-sm font-medium mb-1 text-muted-foreground">
                    Why It Works
                  </h4>
                  <p className="text-sm">{topic.why_it_works}</p>
                </div>
              )}

              {/* Tags */}
              {topic.tags && topic.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {topic.tags.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="text-xs"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Scores */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  Detailed Scores
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">
                      {Math.round(topic.scores.relevance * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Relevance
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {Math.round(topic.scores.freshness * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Freshness
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {Math.round(topic.scores.novelty * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Novelty</div>
                  </div>
                </div>
              </div>

              {/* Channel and Audience Fit */}
              {(topic.channel_fit?.length > 0 ||
                topic.audience_fit?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topic.channel_fit?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-muted-foreground">
                        Best Channels
                      </h4>
                      <p className="text-sm">{topic.channel_fit.join(", ")}</p>
                    </div>
                  )}
                  {topic.audience_fit?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-muted-foreground">
                        Target Audience
                      </h4>
                      <p className="text-sm">{topic.audience_fit.join(", ")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
