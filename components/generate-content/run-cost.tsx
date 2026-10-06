"use client";

import type { ReactElement } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspaceCredits } from "@/hooks/use-credit-gate";
import {
  formatCount,
  formatCredits,
  shortfall,
  stageName,
} from "@/lib/billing/credits";
import type { BilledRun, CreditBalance, RunCost } from "@/types/subscription";

/** The run's cost, and whether the plan meters it (an unlimited plan has no balance to show). */
function useRunCost(run: BilledRun | null): {
  credits: CreditBalance;
  cost: RunCost;
  metered: boolean;
} | null {
  const credits = useWorkspaceCredits();
  const cost = run ? credits?.runs?.[run] : undefined;
  if (!credits || !cost) return null;
  return { credits, cost, metered: credits.articles_remaining !== null };
}

/**
 * What a billed button adds to its label: "· 12 credits", and with `showBalance` "· balance
 * after 4,528" from 640 px up (beneath, `RunBalance` says it). Nothing until the costs load.
 */
export function RunCostLabel({
  run,
  showBalance = false,
}: {
  run: BilledRun;
  showBalance?: boolean;
}) {
  const view = useRunCost(run);
  if (!view) return null;
  const { cost, metered } = view;
  return (
    <span className="num font-normal">
      · {formatCredits(cost.cost)}
      {showBalance && metered && cost.balance_after !== null && (
        <span className="hidden sm:inline">
          {" "}
          · balance after {formatCount(cost.balance_after)}
        </span>
      )}
    </span>
  );
}

/** The balance after the run, as a line under the button on a phone, where the label has no room. */
export function RunBalance({ run }: { run: BilledRun }) {
  const view = useRunCost(run);
  if (!view?.metered || view.cost.balance_after === null) return null;
  return (
    <p className="num text-right text-xs text-muted-foreground sm:hidden">
      Balance after: {formatCredits(view.cost.balance_after)}
    </p>
  );
}

/**
 * The button with its run's breakdown in a tooltip: each stage the run bills and its credits,
 * the total, and the balance it leaves (or what it needs, when the balance is short).
 */
export function RunCostTooltip({
  run,
  children,
}: {
  /** null: the button starts no billed run, so it has no tooltip. */
  run: BilledRun | null;
  children: ReactElement;
}) {
  const view = useRunCost(run);
  if (!run || !view) return children;
  const { credits, cost, metered } = view;
  const short = shortfall(run, credits);
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <span className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
          {cost.stages.map((stage) => (
            <span key={stage.key} className="contents">
              <span>{stageName(stage.key)}</span>
              <span className="num text-right">
                {formatCount(stage.credits)}
              </span>
            </span>
          ))}
          {cost.stages.length > 1 && (
            <span className="contents font-medium">
              <span>Total</span>
              <span className="num text-right">{formatCount(cost.cost)}</span>
            </span>
          )}
        </span>
        {metered && (
          <span className="mt-1.5 block">
            {short ??
              `Balance after: ${formatCredits(cost.balance_after ?? 0)}`}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
