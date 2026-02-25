"use client";

import Link from "next/link";
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
import type { Route } from "next";

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

  // Filter out disabled actions (but keep loading buttons visible)
  const availableActions = actions.filter((action) => {
    const label =
      typeof action.label === "function" ? action.label(row) : action.label;
    const isLoading = typeof label === "string" && label.endsWith("…");

    if (typeof action.disabled === "function") {
      return !action.disabled(row) || isLoading;
    }
    return !action.disabled || isLoading;
  });

  if (availableActions.length === 0) {
    return <div className={cn("w-[200px]", className)} />;
  }

  // Handle action click with confirmation if needed
  const handleActionClick = async (
    action: RowAction<T>,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    if (!action.onClick) return;

    if (action.requiresConfirmation) {
      const confirmed = await confirm({
        title:
          action.confirmationTitle ||
          `Confirm ${typeof action.label === "function" ? action.label(row) : action.label}`,
        description:
          action.confirmationDescription ||
          `Are you sure you want to ${typeof action.label === "function" ? action.label(row) : action.label}`.toLowerCase(),
        variant: action.variant === "destructive" ? "destructive" : "default",
        confirmText:
          typeof action.label === "function"
            ? String(action.label(row))
            : action.label, // must be string
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
        const getHref = () => {
          if (!action.href) return undefined;
          return typeof action.href === "function"
            ? action.href(row)
            : action.href;
        };

        const href = getHref();

        const getButtonVariant = (): "outline" => {
          return "outline";
        };

        const getButtonClassName = () => {
          const baseClasses = action.showLabel
            ? "h-8 px-2 gap-1"
            : "h-8 w-8 p-0";
          const primaryClasses = action.primary
            ? "border-primary text-primary hover:bg-primary/10 hover:text-primary"
            : "";
          const destructiveClasses =
            action.variant === "destructive"
              ? "border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              : "";

          return cn(baseClasses, primaryClasses, destructiveClasses);
        };

        const buttonContent = (
          <>
            {typeof action.icon === "function" ? action.icon(row) : action.icon}
            {action.showLabel && (
              <span className="text-xs font-medium">
                {typeof action.label === "function"
                  ? action.label(row)
                  : action.label}
              </span>
            )}
          </>
        );

        const button = href ? (
          <Button
            variant={getButtonVariant()}
            size="sm"
            asChild
            className={getButtonClassName()}
          >
            <Link href={href as Route}>{buttonContent}</Link>
          </Button>
        ) : (
          <Button
            variant={getButtonVariant()}
            size="sm"
            onClick={(e) => handleActionClick(action, e)}
            className={getButtonClassName()}
            disabled={
              typeof action.disabled === "function"
                ? action.disabled(row)
                : action.disabled
            }
          >
            {buttonContent}
          </Button>
        );

        return (
          <TooltipProvider key={`action-${action.label}-${index}`}>
            <Tooltip>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent>
                <p>
                  {action.tooltip ||
                    (typeof action.label === "function"
                      ? action.label(row)
                      : action.label)}
                </p>
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
