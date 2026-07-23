"use client";

import { useSubscriptionStore } from "@/stores/subscription-store";
import { Coins } from "lucide-react";
import { useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CreditBalanceWidgetProps {
  className?: string;
  /** "pill" is the compact header badge; "row" is a full-width row for menus. */
  variant?: "pill" | "row";
}

export function CreditBalanceWidget({
  className,
  variant = "pill",
}: CreditBalanceWidgetProps) {
  const { credits, fetchCredits } = useSubscriptionStore();

  useEffect(() => {
    if (!credits) {
      fetchCredits().catch(() => {});
    }
  }, [credits, fetchCredits]);

  if (!credits) return null;

  if (variant === "row") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-2.5 py-2",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">
            {credits.current_credits.toLocaleString()} credits
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {credits.articles_remaining !== null
            ? `~${credits.articles_remaining} articles`
            : "Unlimited"}
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 mr-1 sm:mr-2 rounded-full border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-default",
              className,
            )}
          >
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">
              {credits.current_credits.toLocaleString()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent align="end" className="w-64 p-3">
          <div className="space-y-2">
            <div className="font-medium text-sm flex items-center justify-between">
              <span>Available Credits</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {credits.articles_remaining !== null
                ? `Enough for ~${credits.articles_remaining} articles`
                : "Unlimited articles"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
