"use client";

import { Loader2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BaseKnowledgeItem, KnowledgeCardConfig } from "./types";

interface BaseKnowledgeCardProps<T extends BaseKnowledgeItem> {
  item: T;
  config: KnowledgeCardConfig<T>;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function BaseKnowledgeCard<T extends BaseKnowledgeItem>({
  item,
  config,
  onSelect,
  isSelected = false,
}: BaseKnowledgeCardProps<T>) {
  const [isDeleting, setIsDeleting] = useState(false);

  const statusConfig = config.getStatusConfig?.(item);
  const StatusIcon = statusConfig?.icon;
  const actions = config.getActions(item);
  const metadataSections = config.getMetadataSections(item);

  const handleCardClick = () => {
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
        `Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Separate actions into regular and delete
  const regularActions = actions.filter(
    (action) => action.variant !== "destructive",
  );
  const deleteAction = actions.find(
    (action) => action.variant === "destructive",
  );

  return (
    <Card
      className={`h-full transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${onSelect ? "cursor-pointer" : ""} ${config.className || ""}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <config.primaryIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              {statusConfig && StatusIcon && (
                <div className="flex items-center gap-2 mb-2">
                  <StatusIcon
                    className={`h-4 w-4 ${statusConfig.color} ${
                      statusConfig.animate ? "animate-spin" : ""
                    }`}
                  />
                  <Badge variant={statusConfig.variant} className="text-xs">
                    {statusConfig.label}
                  </Badge>
                </div>
              )}
              <CardTitle className="text-base font-medium truncate">
                {config.getTitle(item)}
              </CardTitle>
              <CardDescription className="text-sm">
                {config.getDescription(item)}
              </CardDescription>
            </div>
          </div>
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
              {regularActions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
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
                  title={
                    deleteAction.confirmationConfig?.title || "Delete Item"
                  }
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
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {metadataSections
            .filter((section) => section.condition !== false)
            .map((section) => (
              <div key={section.id}>{section.content}</div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
