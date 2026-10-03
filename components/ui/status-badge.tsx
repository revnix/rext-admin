"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { StatusConfig } from "@/types/detail-page";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium border transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
        secondary:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        success:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        warning:
          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        destructive:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        outline: "bg-transparent border-border text-foreground hover:bg-accent",
      },
      color: {
        blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        green:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        yellow:
          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        red: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        purple:
          "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
        gray: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-sm hover:scale-105",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      pulse: false,
      interactive: false,
    },
  },
);

const statusIconVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof statusBadgeVariants> {
  status?: string;
  config?: StatusConfig;
  icon?: React.ReactNode;
  pulse?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

// Predefined status configurations
const defaultStatusConfigs: Record<string, StatusConfig> = {
  // Task/Content statuses
  pending: {
    label: "Pending",
    variant: "outline",
    color: "gray",
  },
  "in-progress": {
    label: "In Progress",
    variant: "secondary",
    color: "blue",
    pulse: true,
  },
  done: {
    label: "Done",
    variant: "success",
    color: "green",
  },
  completed: {
    label: "Completed",
    variant: "success",
    color: "green",
  },
  blocked: {
    label: "Blocked",
    variant: "destructive",
    color: "red",
  },
  deferred: {
    label: "Deferred",
    variant: "default",
    color: "gray",
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline",
    color: "gray",
  },
  review: {
    label: "Review",
    variant: "warning",
    color: "yellow",
  },

  // Content publication statuses
  published: {
    label: "Published",
    variant: "success",
    color: "green",
  },
  scheduled: {
    label: "Scheduled",
    variant: "secondary",
    color: "blue",
  },
  draft: {
    label: "Draft",
    variant: "outline",
    color: "gray",
  },
  archived: {
    label: "Archived",
    variant: "default",
    color: "gray",
  },

  // Priority levels
  high: {
    label: "High Priority",
    variant: "destructive",
    color: "red",
  },
  medium: {
    label: "Medium Priority",
    variant: "warning",
    color: "yellow",
  },
  low: {
    label: "Low Priority",
    variant: "default",
    color: "gray",
  },

  // User/Account statuses
  active: {
    label: "Active",
    variant: "success",
    color: "green",
  },
  inactive: {
    label: "Inactive",
    variant: "default",
    color: "gray",
  },
  suspended: {
    label: "Suspended",
    variant: "destructive",
    color: "red",
  },

  // System statuses
  online: {
    label: "Online",
    variant: "success",
    color: "green",
    pulse: true,
  },
  offline: {
    label: "Offline",
    variant: "default",
    color: "gray",
  },
  error: {
    label: "Error",
    variant: "destructive",
    color: "red",
  },
  warning: {
    label: "Warning",
    variant: "warning",
    color: "yellow",
  },
  success: {
    label: "Success",
    variant: "success",
    color: "green",
  },
  info: {
    label: "Info",
    variant: "secondary",
    color: "blue",
  },
};

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  (
    {
      className,
      status,
      config,
      icon,
      variant,
      color,
      size = "md",
      pulse,
      interactive = false,
      onClick,
      children,
      role: roleProp,
      tabIndex: tabIndexProp,
      ...rest
    },
    ref,
  ) => {
    // Get configuration from status string or use provided config
    const statusConfig =
      config || (status ? defaultStatusConfigs[status.toLowerCase()] : null);

    // Determine final props
    const finalVariant = variant || statusConfig?.variant || "default";
    const finalColor = color || statusConfig?.color;
    const finalPulse = pulse ?? statusConfig?.pulse ?? false;
    const finalIcon = icon || statusConfig?.icon;
    const finalLabel = children || statusConfig?.label || status;

    const handleClick = onClick ?? undefined;

    const baseClassName = cn(
      statusBadgeVariants({
        variant: finalColor ? undefined : finalVariant,
        color: finalColor,
        size,
        pulse: finalPulse,
        interactive: interactive || Boolean(handleClick),
      }),
      className,
    );

    if (handleClick) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={baseClassName}
          onClick={handleClick}
          {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {finalIcon && (
            <span className={statusIconVariants({ size })}>{finalIcon}</span>
          )}
          <span className="capitalize">{finalLabel}</span>
        </button>
      );
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={baseClassName}
        role={roleProp ?? "status"}
        tabIndex={tabIndexProp}
        {...rest}
      >
        {finalIcon && (
          <span className={statusIconVariants({ size })}>{finalIcon}</span>
        )}
        <span className="capitalize">{finalLabel}</span>
      </div>
    );
  },
);

StatusBadge.displayName = "StatusBadge";

// Specialized status badge components
export const TaskStatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<StatusBadgeProps, "config">
>(({ status, ...props }, ref) => {
  return <StatusBadge ref={ref} status={status} {...props} />;
});

TaskStatusBadge.displayName = "TaskStatusBadge";

export const ContentStatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<StatusBadgeProps, "config">
>(({ status, ...props }, ref) => {
  return <StatusBadge ref={ref} status={status} {...props} />;
});

ContentStatusBadge.displayName = "ContentStatusBadge";

export const PriorityBadge = React.forwardRef<
  HTMLDivElement,
  Omit<StatusBadgeProps, "config"> & { priority: string }
>(({ priority, ...props }, ref) => {
  return <StatusBadge ref={ref} status={priority} {...props} />;
});

PriorityBadge.displayName = "PriorityBadge";

export const SystemStatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<StatusBadgeProps, "config">
>(({ status, ...props }, ref) => {
  return <StatusBadge ref={ref} status={status} {...props} />;
});

SystemStatusBadge.displayName = "SystemStatusBadge";

export {
  StatusBadge,
  statusBadgeVariants,
  statusIconVariants,
  defaultStatusConfigs,
};
