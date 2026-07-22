"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { CircleDollarSign } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";

export function CreditBalanceWidget() {
  const { credits, fetchCredits } = useSubscriptionStore();

  useEffect(() => {
    if (!credits) {
      fetchCredits().catch(() => {});
    }
  }, [credits, fetchCredits]);

  if (!credits) return null;

  const usedPercent =
    credits.credits_per_month && credits.credits_per_month > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((credits.credits_per_month - credits.current_credits) /
                credits.credits_per_month) *
                100,
            ),
          ),
        )
      : null;

  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-full border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-default">
            <CircleDollarSign className="h-4 w-4 text-[#0061FF]" />
            <span className="text-sm font-medium">
              {credits.current_credits.toLocaleString()}
            </span>
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            align="end"
            sideOffset={6}
            className={cn(
              "z-50 w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-full py-0.5">
                  <CircleDollarSign className="h-3.5 w-3.5 text-[#0061FF]" />
                  <span className="text-xs font-medium">Credits</span>
                </div>
                {credits.plan_name && (
                  <span className="text-xs font-medium text-[#0061FF]">
                    {credits.plan_name}
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xl font-semibold tabular-nums">
                  {credits.current_credits.toLocaleString()}
                </span>
                {credits.credits_per_month !== null && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    of {credits.credits_per_month.toLocaleString()} total
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {credits.articles_remaining !== null
                  ? `≈ ${credits.articles_remaining.toLocaleString()} articles`
                  : "Unlimited articles"}
              </p>

              {usedPercent !== null && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#0061FF] to-[#4d8dff]"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {usedPercent}% used this cycle
                  </p>
                </div>
              )}
            </div>
            <TooltipPrimitive.Arrow className="fill-popover" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
