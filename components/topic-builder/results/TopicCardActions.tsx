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
            className="h-7 px-2 gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800"
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
              className={`h-7 px-2 gap-1 text-xs ${
                topic.is_saved
                  ? "bg-green-100 hover:bg-green-200 text-green-800 border-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 dark:border-green-800"
                  : "bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800"
              }`}
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
              className="h-7 px-2 gap-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800"
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
            className="h-7 px-2 gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 dark:text-gray-300 dark:border-gray-700"
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
