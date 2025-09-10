"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  onSelect?: (id: string, selected: boolean) => void;
  isSelected?: boolean;
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
  onNavigateToContent?: (topicId: string) => void;
  className?: string;
}

export function TopicCard({
  topic,
  onSelect,
  isSelected = false,
  onSave,
  onEdit,
  onRegenerate,
  onExport,
  onDelete,
  onNavigateToIdeas,
  onGenerateNew,
  onNavigateToContent,
  className,
}: TopicCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate relevance and audience fit scores for display
  const relevanceScore = Math.round(topic.scores.relevance * 10);
  const audienceFit = Math.round(
    ((topic.scores.relevance + topic.scores.freshness + topic.scores.novelty) /
      3) *
      10,
  );

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md",
          isSelected && "ring-2 ring-primary",
          className,
        )}
      >
        <CardContent className="pt-6">
          {/* Selection Checkbox */}
          {onSelect && (
            <div className="absolute top-2 right-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(topic.id, !!checked)}
                className="h-4 w-4"
                aria-label={`Select topic: ${topic.title}`}
              />
            </div>
          )}

          {/* Saved Indicator */}
          {(topic._optimisticSaved || topic.is_saved) && (
            <div className="absolute top-2 right-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-medium shadow-sm",
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

          {/* Topic Content */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 pr-16">
            {topic.title}
          </h3>

          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {topic.description || topic.angle}
          </p>

          {/* Keywords/Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {topic.tags?.slice(0, 3).map((keyword) => (
              <Badge key={keyword} variant="outline">
                {keyword}
              </Badge>
            ))}
            {topic.tags && topic.tags.length > 3 && (
              <Badge variant="outline">+{topic.tags.length - 3}</Badge>
            )}
          </div>

          {/* Scores */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Relevance:</span>
              <span className="font-medium">{relevanceScore}/10</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Audience Fit:</span>
              <span className="font-medium">{audienceFit}/10</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(true)}
          >
            View Details
          </Button>

          <TopicActions
            topic={topic}
            onSave={onSave}
            onEdit={onEdit}
            onRegenerate={onRegenerate}
            onExport={onExport}
            onDelete={onDelete}
            onNavigateToIdeas={onNavigateToIdeas}
            onGenerateNew={onGenerateNew}
            onNavigateToContent={onNavigateToContent}
            variant="dropdown"
          />
        </CardFooter>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{topic.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-muted-foreground">
                {topic.description || topic.angle}
              </p>
            </div>

            {topic.why_it_works && (
              <div>
                <h4 className="text-sm font-medium mb-1">Why It Works</h4>
                <p className="text-muted-foreground">{topic.why_it_works}</p>
              </div>
            )}

            {topic.tags && topic.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {topic.tags.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Metrics</h4>
                <ul className="text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">
                      Relevance Score:
                    </span>
                    <span>{relevanceScore}/10</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Audience Fit:</span>
                    <span>{audienceFit}/10</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">
                      Freshness Score:
                    </span>
                    <span>{Math.round(topic.scores.freshness * 10)}/10</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">
                      Novelty Score:
                    </span>
                    <span>{Math.round(topic.scores.novelty * 10)}/10</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Details</h4>
                <ul className="text-sm">
                  {topic.channel_fit && topic.channel_fit.length > 0 && (
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">
                        Best Channels:
                      </span>
                      <span className="text-right text-xs">
                        {topic.channel_fit.slice(0, 2).join(", ")}
                        {topic.channel_fit.length > 2 && "..."}
                      </span>
                    </li>
                  )}
                  {topic.audience_fit && topic.audience_fit.length > 0 && (
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">
                        Target Audience:
                      </span>
                      <span className="text-right text-xs">
                        {topic.audience_fit.slice(0, 2).join(", ")}
                        {topic.audience_fit.length > 2 && "..."}
                      </span>
                    </li>
                  )}
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span>
                      {topic.is_saved || topic._optimisticSaved
                        ? "Saved"
                        : "Not saved"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <TopicActions
              topic={topic}
              onSave={onSave}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onExport={onExport}
              onDelete={onDelete}
              onNavigateToIdeas={onNavigateToIdeas}
              onGenerateNew={onGenerateNew}
              onNavigateToContent={onNavigateToContent}
              variant="buttons"
              showLabels={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
