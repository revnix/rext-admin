import { Check, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { PhoneRunCost, RunCostTooltip } from "../run-cost";

/**
 * The outline's two answers: regenerate it with feedback, or approve it and
 * write the article. Each button's cost, and the balance it leaves, is in its
 * tooltip on hover or focus, not on the label (E13, FB2.11); a phone, with no
 * hover, shows the article's cost in a line beneath.
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
        <RunCostTooltip run="regenerate_outline">
          <Button variant="outline" onClick={onRegenerate} disabled={disabled}>
            <RefreshCw />
            Regenerate
          </Button>
        </RunCostTooltip>
        <RunCostTooltip run="generate">
          <Button onClick={onApprove} disabled={disabled}>
            <Check />
            Approve and generate
          </Button>
        </RunCostTooltip>
      </div>
      <PhoneRunCost run="generate" />
    </div>
  );
}
