"use client";

import { PenTool, Save, Trash2 } from "lucide-react";
import { CanAccess } from "@/components/permissions/can-access";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOPIC_PERMISSIONS } from "@/lib/permissions";

interface TopicActionsProps {
  isApproved: boolean;
  onApprove: () => void;
  onUse: () => void;
  onDelete: () => void;
  isApprovePending: boolean;
  isDeleting: boolean;
  isDeletePending: boolean;
}

/**
 * Action buttons for topic detail page (approve, write content, delete)
 */
export function TopicActions({
  isApproved,
  onApprove,
  onUse,
  onDelete,
  isApprovePending,
  isDeleting,
  isDeletePending,
}: TopicActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Approve - First and primary when not approved */}
      {!isApproved && (
        <CanAccess permission={TOPIC_PERMISSIONS.UPDATE}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onApprove}
                disabled={isApprovePending}
                className="gap-2"
              >
                {isApprovePending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Approve Topic
              </Button>
            </TooltipTrigger>
            <TooltipContent>Approve topic for content creation</TooltipContent>
          </Tooltip>
        </CanAccess>
      )}

      {/* Write Content - Only show when approved */}
      {isApproved && (
        <CanAccess permission={TOPIC_PERMISSIONS.READ}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onUse} className="gap-2">
                <PenTool className="h-4 w-4" />
                Write Content
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Use this topic to create new content
            </TooltipContent>
          </Tooltip>
        </CanAccess>
      )}

      {/* Remove Topic */}
      <CanAccess permission={TOPIC_PERMISSIONS.DELETE}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onDelete}
              disabled={isDeleting || isDeletePending}
              variant="destructive"
              className="gap-2"
            >
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove this topic permanently</TooltipContent>
        </Tooltip>
      </CanAccess>
    </div>
  );
}
