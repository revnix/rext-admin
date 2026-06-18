"use client";

import { useSubscriptionStore } from "@/stores/subscription-store";
import { Coins } from "lucide-react";
import { useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function CreditBalanceWidget() {
  const { credits, fetchCredits } = useSubscriptionStore();

  useEffect(() => {
    if (!credits) {
      fetchCredits().catch(console.error);
    }
  }, [credits, fetchCredits]);

  if (!credits) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-full border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-default">
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
