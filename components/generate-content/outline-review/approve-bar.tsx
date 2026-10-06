import { Check, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RunBalance, RunCostLabel, RunCostTooltip } from "../run-cost";

/**
 * The outline's two answers: regenerate it with feedback, or approve it and
 * write the article, with the article's cost and the balance it leaves (E13).
 */
export function OutlineApproveBar({
  disabled,
  onRegenerate,
  onApprove,
}: {
  disabled: boolean;
  onRegenerate: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-3">
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
