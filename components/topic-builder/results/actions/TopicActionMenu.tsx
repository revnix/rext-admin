"use client";

/**
 * Topic Action Menu (Orchestrator Component)
 * Composes all topic action components together
 * Provides both dropdown and button variants
 */

import { Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";
import { DeleteTopicAction } from "./DeleteTopicAction";
import { EditTopicAction } from "./EditTopicAction";
import { ExportTopicAction } from "./ExportTopicAction";
import { NavigateToContentAction } from "./NavigateToContentAction";
import { RegenerateTopicAction } from "./RegenerateTopicAction";
import { SaveTopicAction } from "./SaveTopicAction";
import type { TopicActionHandlers } from "./types";

interface TopicActionMenuProps extends TopicActionHandlers {
  topic: GeneratedTopic;
  className?: string;
  variant?: "dropdown" | "buttons";
  showLabels?: boolean;
}

export function TopicActionMenu({
  topic,
  onSave,
  onEdit,
  onRegenerate,
  onExport,
  onDelete,
  onNavigateToContent,
  onNavigateToTopics,
  onGenerateNew,
  className,
  variant = "dropdown",
  showLabels = false,
}: TopicActionMenuProps) {
  // Track if any action is loading
  const isAnyLoading = false; // Individual components manage their own loading states

  if (variant === "buttons") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Save Button */}
        {onSave && (
          <SaveTopicAction
            topic={topic}
            onSave={onSave}
            onNavigateToTopics={onNavigateToTopics}
            onGenerateNew={onGenerateNew}
            showLabel={showLabels}
            variant="button"
          />
        )}

        {/* Navigate to Content Button */}
        {onNavigateToContent && (
          <NavigateToContentAction
            topic={topic}
            onNavigateToContent={onNavigateToContent}
            showLabel={showLabels}
            variant="button"
          />
        )}

        {/* Edit Button */}
        {onEdit && (
          <EditTopicAction
            topic={topic}
            onEdit={onEdit}
            showLabel={showLabels}
            variant="button"
          />
        )}

        {/* More Actions Dropdown */}
        {(onRegenerate || onExport || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="gap-1.5 cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
                {showLabels && "More"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRegenerate && (
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <RegenerateTopicAction
                    topic={topic}
                    onRegenerate={onRegenerate}
                    variant="dropdown-item"
                  />
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <ExportTopicAction
                    topic={topic}
                    onExport={onExport}
                    variant="dropdown-item"
                  />
                </DropdownMenuItem>
              )}
              {(onRegenerate || onExport) && onDelete && (
                <DropdownMenuSeparator />
              )}
              {onDelete && (
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <DeleteTopicAction
                    topic={topic}
                    onDelete={onDelete}
                    variant="dropdown-item"
                  />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isAnyLoading}
            className="h-8 w-8 p-0 cursor-pointer"
          >
            {isAnyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onNavigateToContent && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <NavigateToContentAction
                topic={topic}
                onNavigateToContent={onNavigateToContent}
                variant="dropdown-item"
              />
            </DropdownMenuItem>
          )}
          {onSave && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <SaveTopicAction
                topic={topic}
                onSave={onSave}
                onNavigateToTopics={onNavigateToTopics}
                onGenerateNew={onGenerateNew}
                variant="dropdown-item"
              />
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <EditTopicAction
                topic={topic}
                onEdit={onEdit}
                variant="dropdown-item"
              />
            </DropdownMenuItem>
          )}
          {onRegenerate && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <RegenerateTopicAction
                topic={topic}
                onRegenerate={onRegenerate}
                variant="dropdown-item"
              />
            </DropdownMenuItem>
          )}
          {onExport && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ExportTopicAction
                topic={topic}
                onExport={onExport}
                variant="dropdown-item"
              />
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <DeleteTopicAction
                  topic={topic}
                  onDelete={onDelete}
                  variant="dropdown-item"
                />
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
