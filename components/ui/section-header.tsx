"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { SectionHeaderProps } from "@/types/detail-page";

const sectionHeaderVariants = cva("flex items-start justify-between gap-4", {
  variants: {
    variant: {
      default: "",
      compact: "pb-2",
      spacious: "pb-6",
    },
    level: {
      1: "mb-6",
      2: "mb-4",
      3: "mb-3",
      4: "mb-2",
    },
  },
  defaultVariants: {
    variant: "default",
    level: 2,
  },
});

const sectionTitleVariants = cva("font-semibold tracking-tight", {
  variants: {
    level: {
      1: "text-3xl",
      2: "text-xl",
      3: "text-lg",
      4: "text-base",
    },
  },
  defaultVariants: {
    level: 2,
  },
});

export interface SectionHeaderComponentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof sectionHeaderVariants>,
    Omit<SectionHeaderProps, "variant" | "level"> {
  level?: SectionHeaderProps["level"];
  children?: React.ReactNode;
}

const SectionHeader = React.forwardRef<
  HTMLDivElement,
  SectionHeaderComponentProps
>(
  (
    {
      className,
      variant,
      level = 2,
      title,
      description,
      icon,
      actions = [],
      badge,
      collapsible = false,
      defaultCollapsed = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    const headerContent = (
      <div
        ref={ref}
        className={cn(sectionHeaderVariants({ variant, level }), className)}
        {...props}
      >
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-6 w-6 p-0 shrink-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            {icon && (
              <div className="text-foreground/80 shrink-0">
                {React.isValidElement(icon) &&
                  React.cloneElement(
                    icon as React.ReactElement<{ className?: string }>,
                    {
                      className: cn(
                        "h-5 w-5",
                        level === 1 && "h-6 w-6",
                        level === 3 && "h-4 w-4",
                        level === 4 && "h-4 w-4",
                      ),
                    },
                  )}
              </div>
            )}
            <h2
              className={cn(
                sectionTitleVariants({ level }),
                "text-foreground truncate",
              )}
            >
              {title}
            </h2>
            {badge && (
              <Badge variant={badge.variant} className="shrink-0">
                {badge.label}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((action, index) => (
              <Button
                key={`${action.label}-${index}`}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="gap-2"
              >
                {action.loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  action.icon
                )}
                {action.loading ? "Loading..." : action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );

    if (collapsible && children) {
      return (
        <Collapsible
          open={!isCollapsed}
          onOpenChange={(open) => setIsCollapsed(!open)}
        >
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer">{headerContent}</div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            {children}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <>
        {headerContent}
        {children}
      </>
    );
  },
);

SectionHeader.displayName = "SectionHeader";

// Specialized variants for common use cases
export const PageHeader = React.forwardRef<
  HTMLDivElement,
  Omit<SectionHeaderComponentProps, "level"> & { subtitle?: string }
>(({ subtitle, children, ...props }, ref) => (
  <SectionHeader
    ref={ref}
    level={1}
    variant="spacious"
    description={subtitle}
    {...props}
  >
    {children}
  </SectionHeader>
));

PageHeader.displayName = "PageHeader";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  Omit<SectionHeaderComponentProps, "level">
>(({ ...props }, ref) => (
  <SectionHeader ref={ref} level={3} variant="compact" {...props} />
));

CardHeader.displayName = "CardHeader";

export const SubsectionHeader = React.forwardRef<
  HTMLDivElement,
  Omit<SectionHeaderComponentProps, "level">
>(({ ...props }, ref) => (
  <SectionHeader ref={ref} level={4} variant="compact" {...props} />
));

SubsectionHeader.displayName = "SubsectionHeader";

export { SectionHeader, sectionHeaderVariants, sectionTitleVariants };
