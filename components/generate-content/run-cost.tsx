"use client";

import { useQuery } from "@tanstack/react-query";
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
import { subscriptionQueries } from "@/lib/query-keys";
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
 * The stages a step's Continue takes on its own (E25): the titles, when the keyword is kept, and
 * the outline, after the title. The backend charges them there (keyword_recomendation.py,
 * generation/outline.py).
 */
export type StepStage = "title_generation" | "generate_outline";

/**
 * A step's Continue with its stage's cost in a tooltip (FB2.11, rext-control#692): the stage and
 * its credits, from the plan catalogue, and the balance it leaves when the plan meters credits.
 * Costs stay off the buttons' labels. Nothing extra until the catalogue loads, or if it doesn't
 * list the stage.
 */
export function StageCostTooltip({
  stage,
  children,
}: {
  stage: StepStage;
  children: ReactElement;
}) {
  const { data } = useQuery(subscriptionQueries.catalog());
  const balance = useWorkspaceCredits();
  const cost = data?.credits.stages.find((item) => item.key === stage)?.credits;
  if (cost === undefined) return children;
  const metered = balance ? balance.articles_remaining !== null : false;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <span className="grid grid-cols-[1fr_auto] gap-x-4">
          <span>{stageName(stage)}</span>
          <span className="num text-right">{formatCount(cost)}</span>
        </span>
        {balance && metered && (
          <span className="mt-1.5 block">
            {`Balance after: ${formatCredits(Math.max(balance.current_credits - cost, 0))}`}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
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
