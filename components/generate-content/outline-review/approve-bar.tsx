import { Check, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { RunBalance, RunCostLabel, RunCostTooltip } from "../run-cost";

/**
 * The outline's two answers: regenerate it with feedback, or approve it and
 * write the article, with the article's cost and the balance it leaves (E13).
 * `start` sits at the bar's left end (the Brief's button on narrow screens).
 */
export function OutlineApproveBar({
  disabled,
  onRegenerate,
  onApprove,
  start,
}: {
  disabled: boolean;
  onRegenerate: () => void;
  onApprove: () => void;
  start?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {start}
        <Button variant="outline" onClick={onRegenerate} disabled={disabled}>
          <RefreshCw />
          Regenerate
        </Button>
        <RunCostTooltip run="generate">
          <Button onClick={onApprove} disabled={disabled}>
            <Check />
            Approve and generate
            <RunCostLabel run="generate" showBalance />
          </Button>
        </RunCostTooltip>
      </div>
      <RunBalance run="generate" />
    </div>
  );
}
