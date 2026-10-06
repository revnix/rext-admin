import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        // A word in a quiet badge (design/app-language.md §2 and §6): neutral by default, a status tint
        // only when the word is a status worth noticing. 700 text on the 50 tint, the 200 step as the
        // edge. Text only: no icon inside.
        neutral: "border-border bg-surface-inset text-foreground",
        success: "border-success-200 bg-success-50 text-success-700",
        warning: "border-warning-200 bg-warning-50 text-warning-700",
        danger: "border-danger-200 bg-danger-50 text-danger-700",
        info: "border-info-200 bg-info-50 text-info-700",
        // shadcn's names, for the older call sites: the same quiet badges, never a filled chip.
        default: "border-border bg-surface-inset text-foreground",
        secondary: "border-border bg-surface-inset text-foreground",
        outline: "border-border bg-surface-inset text-foreground",
        destructive: "border-danger-200 bg-danger-50 text-danger-700",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
