"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const detailCardVariants = cva(
  "rounded-md border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        // Cards are white; only success keeps a semantic tint.
        highlight: "bg-card border-border",
        accent: "bg-card border-border",
        warning: "bg-card border-border",
        success:
          "bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/50",
        info: "bg-card border-border",
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
        // Cards are flat across the app; variants kept for API compatibility.
        none: "shadow-none",
        sm: "shadow-none",
        md: "shadow-none",
        lg: "shadow-none",
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
  /** @deprecated Cards no longer render gradients; kept for API compatibility. */
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
      gradient: _gradient,
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
            "hover:border-foreground/20 cursor-pointer": interactive,
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
