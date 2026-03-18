"use client";

import { PenTool, Trash2 } from "lucide-react";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOPIC_PERMISSIONS } from "@/lib/permissions";

interface TopicActionsProps {
  onUse: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isDeletePending: boolean;
}

/**
 * Action buttons for topic detail page (use for content, delete)
 */
export function TopicActions({
  onUse,
  onDelete,
  isDeleting,
  isDeletePending,
}: TopicActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Write Content */}
      <PermissionGuard permission={TOPIC_PERMISSIONS.READ} showTooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onUse} className="gap-2">
              <PenTool className="h-4 w-4" />
              Write Content
            </Button>
          </TooltipTrigger>
          <TooltipContent>Use this topic to create new content</TooltipContent>
        </Tooltip>
      </PermissionGuard>

      {/* Remove Topic */}
      <PermissionGuard permission={TOPIC_PERMISSIONS.DELETE} showTooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onDelete}
              disabled={isDeleting || isDeletePending}
              variant="destructive"
              className="gap-2"
            >
              {isDeleting || isDeletePending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove this topic permanently</TooltipContent>
        </Tooltip>
      </PermissionGuard>
    </div>
  );
}
