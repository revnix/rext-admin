"use client";

import { Copy, Eye, PenTool, Save } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicCardActionsProps {
  topic: GeneratedTopic;
  onSave?: (topicId: string) => Promise<void> | void;
  onNavigateToContent?: (topicId: string) => void;
  onViewDetails?: (topicId: string) => void;
  onCopy?: (topicId: string) => void;
}

export const TopicCardActions = memo(function TopicCardActions({
  topic,
  onSave,
  onNavigateToContent,
  onViewDetails,
  onCopy,
}: TopicCardActionsProps) {
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

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(topic.id);
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
    <div className="flex items-center gap-2 mb-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2 gap-1 text-xs"
            onClick={handleView}
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
            <p>{topic.is_saved ? "Already saved" : "Save to library"}</p>
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
  );
});
