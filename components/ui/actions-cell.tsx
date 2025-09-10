"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  showOnHover = true,
  alwaysShowTrigger = false,
}: ActionsCellProps<T>) {
  const [isHovered, setIsHovered] = useState(false);
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

  // Create action button with optional tooltip
  const createActionButton = (action: RowAction<T>, key: string) => {
    const button = (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => handleActionClick(action, e)}
        className={cn(
          "h-8 w-8 p-0",
          action.variant === "destructive" &&
            "hover:bg-destructive/10 hover:text-destructive",
        )}
      >
        {action.icon}
      </Button>
    );

    const buttonWithTooltip = action.tooltip ? (
      <TooltipProvider key={key}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{action.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      button
    );

    return <div key={key}>{buttonWithTooltip}</div>;
  };

  // Create dropdown menu item
  const createDropdownItem = (action: RowAction<T>, index: number) => {
    return (
      <DropdownMenuItem
        key={`dropdown-${index}`}
        onClick={(e) => handleActionClick(action, e)}
        className={cn(
          "flex items-center gap-2 cursor-pointer",
          action.variant === "destructive" &&
            "text-destructive focus:text-destructive",
        )}
      >
        {action.icon && (
          <span className="h-4 w-4 flex items-center justify-center">
            {action.icon}
          </span>
        )}
        <span>{action.label}</span>
      </DropdownMenuItem>
    );
  };

  // For 1-2 actions, show inline buttons
  if (availableActions.length <= 2) {
    return (
      <div
        className={cn(
          "flex items-center justify-end gap-1",
          showOnHover && !alwaysShowTrigger && "group-hover:opacity-100",
          showOnHover && !alwaysShowTrigger && !isHovered && "opacity-0",
          "transition-opacity duration-200",
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // biome-ignore lint/a11y/useSemanticElements: Group role is appropriate for action buttons
        role="group"
        aria-label="Row actions"
      >
        {availableActions.map((action, index) =>
          createActionButton(action, `inline-${index}`),
        )}
        {ConfirmationComponent}
      </div>
    );
  }

  // For 3+ actions, use dropdown menu
  const shouldShow = alwaysShowTrigger || !showOnHover || isHovered;

  return (
    <div
      className={cn("flex items-center justify-end", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // biome-ignore lint/a11y/useSemanticElements: Group role is appropriate for dropdown menu
      role="group"
      aria-label="Row actions menu"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "h-8 w-8 p-0",
              showOnHover && !alwaysShowTrigger && "group-hover:opacity-100",
              showOnHover && !alwaysShowTrigger && !shouldShow && "opacity-0",
              "transition-opacity duration-200",
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableActions.map((action, index) => (
            <>
              {createDropdownItem(action, index)}
              {/* Add separator before destructive actions */}
              {index < availableActions.length - 1 &&
                action.variant !== "destructive" &&
                availableActions[index + 1]?.variant === "destructive" && (
                  <DropdownMenuSeparator
                    key={`separator-${action.label}-${index}`}
                  />
                )}
            </>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {ConfirmationComponent}
    </div>
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
