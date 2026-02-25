"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TableLevelAction } from "@/types/data-table";
import type { Route } from "next";

interface TableActionButtonProps
  extends Omit<TableLevelAction, "id" | "onClick"> {
  onClick?: () => void;
  className?: string;
  hideLabel?: boolean; // For responsive behavior
  asChild?: boolean;
  children?: React.ReactNode;
}

export const TableActionButton = forwardRef<
  HTMLButtonElement,
  TableActionButtonProps
>(
  (
    {
      label,
      icon,
      onClick,
      variant = "outline",
      size = "sm",
      disabled = false,
      tooltip,
      href,
      shortcut,
      className,
      hideLabel = false,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const buttonContent = (
      <>
        {icon}
        {!hideLabel && label && (
          <span className={cn("hidden sm:inline", icon && "ml-2")}>
            {label}
          </span>
        )}
        {hideLabel && !icon && <span className="sr-only">{label}</span>}
      </>
    );

    const buttonElement = href ? (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled}
        className={cn("gap-1", className)}
        asChild
        {...props}
      >
        <Link href={href as Route}>{buttonContent}</Link>
      </Button>
    ) : (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={onClick}
        className={cn("gap-1", className)}
        asChild={asChild}
        {...props}
      >
        {asChild ? props.children : buttonContent}
      </Button>
    );

    // Wrap with tooltip if provided
    if (tooltip || shortcut) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center justify-between gap-2">
                <span>{tooltip || label}</span>
                {shortcut && (
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    {shortcut}
                  </kbd>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonElement;
  },
);

TableActionButton.displayName = "TableActionButton";
