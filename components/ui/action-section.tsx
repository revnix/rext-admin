"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ActionSectionProps,
  DetailSectionAction,
} from "@/types/detail-page";

const actionSectionVariants = cva("flex", {
  variants: {
    layout: {
      horizontal: "flex-row items-center",
      vertical: "flex-col items-stretch",
      grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    },
    align: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    },
    gap: {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    layout: "horizontal",
    align: "start",
    gap: "md",
    fullWidth: false,
  },
});

const actionButtonVariants = cva("gap-2 transition-all duration-200", {
  variants: {
    layout: {
      horizontal: "",
      vertical: "w-full justify-start",
      grid: "w-full justify-start",
    },
    priority: {
      primary: "order-1",
      secondary: "order-2",
      tertiary: "order-3",
    },
  },
  defaultVariants: {
    layout: "horizontal",
    priority: "secondary",
  },
});

export interface ActionSectionComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof actionSectionVariants>,
    Omit<ActionSectionProps, "align" | "layout" | "gap" | "fullWidth"> {
  primaryActions?: DetailSectionAction[];
  secondaryActions?: DetailSectionAction[];
  showSeparator?: boolean;
}

const ActionSection = React.forwardRef<
  HTMLDivElement,
  ActionSectionComponentProps
>(
  (
    {
      className,
      actions,
      primaryActions = [],
      secondaryActions = [],
      layout = "horizontal",
      align = "start",
      gap = "md",
      fullWidth = false,
      showSeparator = false,
      ...props
    },
    ref,
  ) => {
    // Combine actions if using the combined actions prop
    const allActions = actions || [...primaryActions, ...secondaryActions];

    // Group actions by priority if not explicitly separated
    const groupedActions = React.useMemo(() => {
      if (primaryActions.length > 0 || secondaryActions.length > 0) {
        return { primary: primaryActions, secondary: secondaryActions };
      }

      // Auto-group by variant
      const primary = allActions.filter(
        (action) =>
          action.variant === "default" || action.variant === undefined,
      );
      const secondary = allActions.filter(
        (action) =>
          action.variant !== "default" && action.variant !== undefined,
      );

      return { primary, secondary };
    }, [allActions, primaryActions, secondaryActions]);

    const renderAction = (
      action: DetailSectionAction,
      index: number,
      priority: "primary" | "secondary",
    ) => {
      const button = (
        <Button
          key={`${action.label}-${priority}-${index}`}
          variant={
            action.variant || (priority === "primary" ? "default" : "outline")
          }
          size={layout === "grid" ? "sm" : "default"}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className={cn(
            actionButtonVariants({
              layout,
              priority: priority as "primary" | "secondary",
            }),
            {
              "min-w-[120px]": layout === "grid",
            },
          )}
        >
          {action.loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            action.icon
          )}
          {action.loading ? "Loading..." : action.label}
        </Button>
      );

      // Wrap with tooltip if action has additional context
      if (action.disabled && !action.loading) {
        return (
          <Tooltip key={`${action.label}-${priority}-${index}`}>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>Action temporarily unavailable</TooltipContent>
          </Tooltip>
        );
      }

      return button;
    };

    const renderActionGroup = (
      actions: DetailSectionAction[],
      priority: "primary" | "secondary",
    ) => {
      if (actions.length === 0) return null;

      return (
        <div
          className={cn(
            actionSectionVariants({ layout, align, gap, fullWidth }),
            priority === "secondary" && "opacity-90",
          )}
        >
          {actions.map((action, index) =>
            renderAction(action, index, priority),
          )}
        </div>
      );
    };

    const hasBothGroups =
      groupedActions.primary.length > 0 && groupedActions.secondary.length > 0;

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {showSeparator && <Separator />}

        <div
          className={cn(
            "flex flex-col space-y-4",
            layout === "horizontal" &&
              hasBothGroups &&
              "sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center sm:justify-between",
          )}
        >
          {renderActionGroup(groupedActions.primary, "primary")}
          {renderActionGroup(groupedActions.secondary, "secondary")}
        </div>
      </div>
    );
  },
);

ActionSection.displayName = "ActionSection";

// Specialized variants for common use cases
export const PrimaryActions = React.forwardRef<
  HTMLDivElement,
  Omit<
    ActionSectionComponentProps,
    "layout" | "primaryActions" | "secondaryActions"
  > & {
    actions: DetailSectionAction[];
  }
>(({ actions, ...props }, ref) => (
  <ActionSection
    ref={ref}
    primaryActions={actions}
    layout="horizontal"
    align="start"
    {...props}
  />
));

PrimaryActions.displayName = "PrimaryActions";

export const SecondaryActions = React.forwardRef<
  HTMLDivElement,
  Omit<
    ActionSectionComponentProps,
    "layout" | "primaryActions" | "secondaryActions"
  > & {
    actions: DetailSectionAction[];
  }
>(({ actions, ...props }, ref) => (
  <ActionSection
    ref={ref}
    secondaryActions={actions}
    layout="horizontal"
    align="end"
    {...props}
  />
));

SecondaryActions.displayName = "SecondaryActions";

export const ActionGrid = React.forwardRef<
  HTMLDivElement,
  Omit<ActionSectionComponentProps, "layout">
>(({ ...props }, ref) => (
  <ActionSection ref={ref} layout="grid" fullWidth={true} {...props} />
));

ActionGrid.displayName = "ActionGrid";

export const ActionStack = React.forwardRef<
  HTMLDivElement,
  Omit<ActionSectionComponentProps, "layout" | "fullWidth">
>(({ ...props }, ref) => (
  <ActionSection ref={ref} layout="vertical" fullWidth={true} {...props} />
));

ActionStack.displayName = "ActionStack";

export { ActionSection, actionSectionVariants, actionButtonVariants };
