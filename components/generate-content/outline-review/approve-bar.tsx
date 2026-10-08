import { Check, RefreshCw } from "lucide-react";
import { type ReactNode, useId } from "react";

import { Button } from "@/components/ui/button";
import { PhoneRunCost, RunCostTooltip } from "../run-cost";

/**
 * The outline's two answers: regenerate it with feedback, or approve it and
 * write the article. Each button's cost, and the balance it leaves, is in its
 * tooltip on hover or focus, not on the label (E13, FB2.11); a phone, with no
 * hover, shows the article's cost in a line beneath.
 * `start` sits at the bar's left end (the Brief's button on narrow screens).
 * With nothing to approve (`canApprove` false: an outline that came back empty, task 783), Approve
 * isn't offered and Regenerate is the one, primary action. `reason` says why the buttons wait,
 * while the first outline is still written.
 */
export function OutlineApproveBar({
  disabled,
  canApprove = true,
  reason,
  onRegenerate,
  onApprove,
  start,
}: {
  disabled: boolean;
  canApprove?: boolean;
  reason?: string;
  onRegenerate: () => void;
  onApprove: () => void;
  start?: ReactNode;
}) {
  const reasonId = useId();
  const describedBy = reason ? reasonId : undefined;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {start}
        {reason && (
          <p id={reasonId} className="text-caption text-muted-foreground">
            {reason}
          </p>
        )}
        <RunCostTooltip run="regenerate_outline">
          <Button
            variant={canApprove ? "outline" : "default"}
            onClick={onRegenerate}
            disabled={disabled}
            aria-describedby={describedBy}
          >
            <RefreshCw />
            Regenerate
          </Button>
        </RunCostTooltip>
        {canApprove && (
          <RunCostTooltip run="generate">
            <Button
              onClick={onApprove}
              disabled={disabled}
              aria-describedby={describedBy}
            >
              <Check />
              Approve and generate
            </Button>
          </RunCostTooltip>
        )}
      </div>
      <PhoneRunCost run={canApprove ? "generate" : "regenerate_outline"} />
    </div>
  );
}
