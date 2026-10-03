"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { CircleDollarSign } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspaceOptional } from "@/providers/workspace-provider";
import { Coins } from "lucide-react";

interface CreditBalanceWidgetProps {
  className?: string;
  /** "pill" is the compact header badge; "row" is a full-width row for menus. */
  variant?: "pill" | "row";
}

export function CreditBalanceWidget({
  className,
  variant = "pill",
}: CreditBalanceWidgetProps) {
  // WorkspaceProvider only mounts on /w/<slug>/ pages — elsewhere (account
  // pages) we show the signed-in user's own credits instead of the workspace owner's.
  const onWorkspacePage = useWorkspaceOptional() !== null;
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const { credits, fetchCredits } = useSubscriptionStore();
  const workspaceId = onWorkspacePage ? currentWorkspace?.id : undefined;

  useEffect(() => {
    // Wait for the real workspace id — the provider briefly sets id: "" while loading
    if (onWorkspacePage && !workspaceId) return;
    // The store single-flights and TTL-throttles this call per credits scope,
    // so remounts on navigation are served from the recent fetch.
    fetchCredits(workspaceId).catch(() => {});
  }, [onWorkspacePage, workspaceId, fetchCredits]);

  if (!credits) return null;

  if (variant === "row") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-md bg-muted/40 px-2.5 py-2",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-foreground" />
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
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 mr-1 sm:mr-2 rounded-full border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-default",
              className,
            )}
          >
            <CircleDollarSign className="h-4 w-4 text-foreground" />
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
              "z-50 w-64 rounded-md border border-border bg-popover p-3 text-popover-foreground",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-full py-0.5">
                  <CircleDollarSign className="h-3.5 w-3.5 text-foreground" />
                  <span className="text-xs font-medium">Credits</span>
                </div>
                {credits.plan_name && (
                  <span className="text-xs font-medium text-[#0061FF] dark:text-brand-300">
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
