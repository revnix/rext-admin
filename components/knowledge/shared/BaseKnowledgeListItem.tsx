"use client";

import { Loader2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  BaseKnowledgeItem,
  KnowledgeListItemConfig,
} from "./types";

interface BaseKnowledgeListItemProps<T extends BaseKnowledgeItem> {
  item: T;
  config: KnowledgeListItemConfig<T>;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function BaseKnowledgeListItem<T extends BaseKnowledgeItem>({
  item,
  config,
  onSelect,
  isSelected = false,
}: BaseKnowledgeListItemProps<T>) {
  const [isDeleting, setIsDeleting] = useState(false);

  const statusConfig = config.getStatusConfig?.(item);
  const StatusIcon = statusConfig?.icon;
  const actions = config.getActions(item);
  const inlineActions = config.getInlineActions?.(item) || [];

  const handleItemClick = () => {
    if (onSelect) {
      onSelect(item.id);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await config.onDelete(item);
    } catch (error) {
      toast.error(
        `Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Separate actions into regular and delete
  const regularActions = actions.filter(
    (action) => action.variant !== "destructive"
  );
  const deleteAction = actions.find((action) => action.variant === "destructive");

  // Check if we should use inline actions or dropdown
  const useInlineActions = inlineActions.length > 0;

  return (
    <button
      type="button"
      className={`flex items-center gap-4 p-4 border rounded-lg transition-all hover:shadow-sm ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${onSelect ? "cursor-pointer" : ""} w-full text-left ${config.className || ""}`}
      onClick={handleItemClick}
      disabled={!onSelect}
    >
      {/* Icon */}
      <config.primaryIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium truncate">{config.getTitle(item)}</h4>
          {statusConfig && StatusIcon && (
            <Badge variant={statusConfig.variant} className="text-xs">
              <StatusIcon
                className={`mr-1 h-3 w-3 ${statusConfig.color} ${
                  statusConfig.animate ? "animate-spin" : ""
                }`}
              />
              {statusConfig.label}
            </Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {config.getCompactMetadata?.(item) || config.getDescription(item)}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
        role="toolbar"
        aria-label="Knowledge item actions"
      >
        {useInlineActions ? (
          <>
            {inlineActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(e);
                }}
                disabled={action.disabled}
                className={`h-8 ${
                  action.variant === "destructive"
                    ? "text-destructive hover:text-destructive"
                    : ""
                }`}
              >
                {isDeleting && action.variant === "destructive" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <action.icon className="h-4 w-4" />
                )}
                <span className="sr-only">{action.label}</span>
              </Button>
            ))}
            {deleteAction && (
              <ConfirmationDialog
                title={deleteAction.confirmationConfig?.title || "Delete Item"}
                description={
                  deleteAction.confirmationConfig?.description ||
                  "Are you sure? This action cannot be undone."
                }
                confirmText={
                  deleteAction.confirmationConfig?.confirmText || "Delete"
                }
                variant="destructive"
                onConfirm={handleDelete}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  className="h-8 text-destructive hover:text-destructive"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <deleteAction.icon className="h-4 w-4" />
                  )}
                  <span className="sr-only">{deleteAction.label}</span>
                </Button>
              </ConfirmationDialog>
            )}
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {regularActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(e);
                  }}
                  disabled={action.disabled}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              {deleteAction && regularActions.length > 0 && (
                <DropdownMenuSeparator />
              )}
              {deleteAction && (
                <ConfirmationDialog
                  title={deleteAction.confirmationConfig?.title || "Delete Item"}
                  description={
                    deleteAction.confirmationConfig?.description ||
                    "Are you sure? This action cannot be undone."
                  }
                  confirmText={
                    deleteAction.confirmationConfig?.confirmText || "Delete"
                  }
                  variant="destructive"
                  onConfirm={handleDelete}
                >
                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                    disabled={deleteAction.disabled}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <deleteAction.icon className="mr-2 h-4 w-4" />
                    )}
                    {deleteAction.label}
                  </DropdownMenuItem>
                </ConfirmationDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </button>
  );
}
