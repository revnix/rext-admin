"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RowAction } from "@/types/data-table";

interface ActionsCellProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  actions: RowAction<T>[];
  row: T;
  className?: string;
  showOnHover?: boolean;
  alwaysShowTrigger?: boolean;
}

export function ActionsCell<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  actions,
  row,
  className,
  showOnHover: _showOnHover = true,
  alwaysShowTrigger: _alwaysShowTrigger = false,
}: ActionsCellProps<T>) {
  const [_isHovered, _setIsHovered] = useState(false);
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Filter out disabled actions
  const availableActions = actions.filter((action) => {
    if (typeof action.disabled === "function") {
      return !action.disabled(row);
    }
    return !action.disabled;
  });

  if (availableActions.length === 0) {
    return <div className={cn("w-[50px]", className)} />;
  }

  // Handle action click with confirmation if needed
  const handleActionClick = async (
    action: RowAction<T>,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    if (action.requiresConfirmation) {
      const confirmed = await confirm({
        title: action.confirmationTitle || `Confirm ${action.label}`,
        description:
          action.confirmationDescription ||
          `Are you sure you want to ${action.label.toLowerCase()}?`,
        variant: action.variant === "destructive" ? "destructive" : "default",
        confirmText: action.label,
      });

      if (confirmed) {
        action.onClick(row);
      }
      return;
    }

    action.onClick(row);
  };

  // Always show inline buttons with tooltips
  return (
    <fieldset
      className={cn(
        "flex items-center justify-end gap-1 border-none p-0 m-0",
        "opacity-100", // Always show buttons
        className,
      )}
    >
      <legend className="sr-only">Row actions</legend>
      {availableActions.map((action, index) => {
        const button = (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => handleActionClick(action, e)}
            className={cn(
              "h-8 w-8 p-0",
              action.variant === "destructive" &&
                "border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30",
            )}
          >
            {action.icon}
          </Button>
        );

        return (
          <TooltipProvider key={`action-${action.label}-${index}`}>
            <Tooltip>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent>
                <p>{action.tooltip || action.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {ConfirmationComponent}
    </fieldset>
  );
}

// Helper function to determine if actions should be visible on hover
export function shouldShowActionsOnHover() {
  // Check if device supports hover (not touch-only)
  if (typeof window !== "undefined") {
    return window.matchMedia("(hover: hover)").matches;
  }
  return true;
}
