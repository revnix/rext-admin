"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const detailCardVariants = cva(
  "rounded-xl border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-background border-border shadow-sm",
        highlight:
          "bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60 " +
          "dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 " +
          "border-blue-200/60 dark:border-blue-800/60",
        accent:
          "bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-purple-50/30 " +
          "dark:from-purple-950/20 dark:via-pink-950/10 dark:to-purple-950/20 " +
          "border-purple-200/50 dark:border-purple-800/50",
        warning:
          "bg-gradient-to-br from-amber-50/40 via-yellow-50/30 to-amber-50/40 " +
          "dark:from-amber-950/20 dark:via-yellow-950/15 dark:to-amber-950/20 " +
          "border-amber-200/60 dark:border-amber-800/60",
        success:
          "bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-green-50/50 " +
          "dark:from-green-950/20 dark:via-emerald-950/15 dark:to-green-950/20 " +
          "border-green-200/50 dark:border-green-800/50",
        info:
          "bg-gradient-to-br from-sky-50/50 via-blue-50/30 to-sky-50/50 " +
          "dark:from-sky-950/20 dark:via-blue-950/15 dark:to-sky-950/20 " +
          "border-sky-200/50 dark:border-sky-800/50",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md hover:shadow-lg",
        lg: "shadow-lg hover:shadow-xl",
      },
      border: {
        none: "border-0",
        subtle: "border border-border/50",
        normal: "border",
        strong: "border-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shadow: "sm",
      border: "normal",
    },
  },
);

export interface DetailCardComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof detailCardVariants> {
  children: React.ReactNode;
  gradient?: boolean;
  interactive?: boolean;
  as?: "div" | "section" | "article";
}

const DetailCard = React.forwardRef<HTMLDivElement, DetailCardComponentProps>(
  (
    {
      className,
      variant,
      size,
      padding,
      shadow,
      border,
      gradient = true,
      interactive = false,
      as: Component = "div",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        className={cn(
          detailCardVariants({
            variant,
            size: padding ? undefined : size,
            padding,
            shadow: interactive ? "md" : shadow,
            border,
          }),
          {
            "hover:shadow-lg hover:border-border/80 cursor-pointer":
              interactive,
            "bg-gradient-to-br": gradient && variant !== "default",
          },
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

DetailCard.displayName = "DetailCard";

// Specialized card variants for common use cases
export const DetailCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
  }
>(({ className, title, description, icon, actions, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-start justify-between gap-4 mb-6", className)}
    {...props}
  >
    <div className="space-y-1 flex-1">
      <div className="flex items-center gap-3">
        {icon && <div className="text-foreground/80">{icon}</div>}
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
));

DetailCardHeader.displayName = "DetailCardHeader";

export const DetailCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));

DetailCardContent.displayName = "DetailCardContent";

export const DetailCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-4 pt-4 mt-6 border-t border-border/50",
      className,
    )}
    {...props}
  />
));

DetailCardFooter.displayName = "DetailCardFooter";

export { DetailCard, detailCardVariants };
