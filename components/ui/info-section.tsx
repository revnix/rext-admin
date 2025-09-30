"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Copy, ExternalLink } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { InfoItem, InfoSectionProps } from "@/types/detail-page";

const infoSectionVariants = cva("space-y-4", {
  variants: {
    variant: {
      default: "",
      compact: "space-y-2",
      detailed: "space-y-6",
    },
    columns: {
      1: "grid grid-cols-1 gap-4",
      2: "grid grid-cols-1 md:grid-cols-2 gap-4",
      3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
      4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
    },
  },
  defaultVariants: {
    variant: "default",
    columns: 1,
  },
});

const infoItemVariants = cva("flex items-start gap-3", {
  variants: {
    variant: {
      default: "justify-between",
      compact: "justify-between min-h-[2rem]",
      detailed: "flex-col space-y-2",
    },
    layout: {
      horizontal: "justify-between",
      vertical: "flex-col space-y-1",
      inline: "items-center gap-2",
    },
  },
  defaultVariants: {
    variant: "default",
    layout: "horizontal",
  },
});

export interface InfoSectionComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof infoSectionVariants>,
    Omit<InfoSectionProps, "columns" | "variant"> {}

const InfoSection = React.forwardRef<HTMLDivElement, InfoSectionComponentProps>(
  (
    {
      className,
      title,
      items,
      columns = 1,
      variant = "default",
      showDividers = false,
      ...props
    },
    ref,
  ) => {
    const handleCopy = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        // You might want to add a toast notification here
        console.log("Copied to clipboard:", text);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    };

    const renderInfoItem = (item: InfoItem, index: number) => {
      const isLink = Boolean(item.href);
      const isCopyable = Boolean(item.copyable);
      const itemLayout = variant === "detailed" ? "vertical" : "horizontal";

      return (
        <div key={`${item.label}-${index}`} className="space-y-2">
          <div
            className={cn(infoItemVariants({ variant, layout: itemLayout }))}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-0 flex-shrink-0">
              {item.icon && (
                <div className="text-foreground/60">{item.icon}</div>
              )}
              <span className="truncate">{item.label}</span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="text-sm font-semibold text-foreground text-right min-w-0 flex-1">
                {isLink ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 decoration-1"
                  >
                    <span className="truncate">{item.value}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="truncate">{item.value}</span>
                )}
              </div>

              {isCopyable && typeof item.value === "string" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.value as string)}
                      className="h-6 w-6 p-0 shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to clipboard</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {item.description && variant === "detailed" && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          )}

          {showDividers && index < items.length - 1 && (
            <Separator className="my-2" />
          )}
        </div>
      );
    };

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {title && (
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
        )}

        <div className={cn(infoSectionVariants({ columns, variant }))}>
          {items.map(renderInfoItem)}
        </div>
      </div>
    );
  },
);

InfoSection.displayName = "InfoSection";

// Specialized variants for common use cases
export const MetadataGrid = React.forwardRef<
  HTMLDivElement,
  Omit<InfoSectionComponentProps, "variant" | "columns"> & {
    columns?: 2 | 3 | 4;
  }
>(({ columns = 2, ...props }, ref) => (
  <InfoSection
    ref={ref}
    variant="compact"
    columns={columns}
    showDividers={false}
    {...props}
  />
));

MetadataGrid.displayName = "MetadataGrid";

export const DetailsList = React.forwardRef<
  HTMLDivElement,
  Omit<InfoSectionComponentProps, "variant" | "columns">
>(({ ...props }, ref) => (
  <InfoSection
    ref={ref}
    variant="detailed"
    columns={1}
    showDividers={true}
    {...props}
  />
));

DetailsList.displayName = "DetailsList";

export const CompactInfo = React.forwardRef<
  HTMLDivElement,
  Omit<InfoSectionComponentProps, "variant" | "showDividers">
>(({ ...props }, ref) => (
  <InfoSection ref={ref} variant="compact" showDividers={false} {...props} />
));

CompactInfo.displayName = "CompactInfo";

export { InfoSection, infoSectionVariants, infoItemVariants };
