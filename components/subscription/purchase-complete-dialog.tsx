"use client";

/**
 * The dialog an in-page (overlay) Lemon Squeezy purchase ends on (F7a). Once the purchase shows it
 * names the plan and the new balance, the way /checkout/success does, from the same backend
 * answers; its buttons say what they do ("Close" never reads as cancelling the purchase).
 *
 * @module components/subscription/purchase-complete-dialog
 */

import { CheckCircle2, Loader2 } from "lucide-react";
import {
  bonusWords,
  monthlyCreditsLeft,
} from "@/components/billing/billing-format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreditBalance } from "@/types/subscription";

export type PurchaseStatus = "confirming" | "active" | "unconfirmed";

/** "1,000 of 1,000 credits." plus the bonus line, or what to expect while it loads. */
function balanceWords(
  credits: CreditBalance | null,
  creditsFailed: boolean,
): string {
  if (!credits) {
    return creditsFailed
      ? "Your balance didn't load; the header shows it in a moment."
      : "Loading your balance…";
  }
  const left = monthlyCreditsLeft(credits).toLocaleString();
  const total = credits.credits_per_month;
  const balance =
    total !== null
      ? `Your balance is ${left} of ${total.toLocaleString()} credits.`
      : `Your balance is ${left} credits.`;
  return [balance, bonusWords(credits)].filter(Boolean).join(" ");
}

export function PurchaseCompleteDialog({
  open,
  status,
  planName,
  credits,
  creditsFailed = false,
  onClose,
  onGoToDashboard,
}: {
  open: boolean;
  status: PurchaseStatus;
  /** The plan the purchase shows, once it shows. */
  planName: string | null;
  /** The new balance, read once the purchase shows. */
  credits: CreditBalance | null;
  creditsFailed?: boolean;
  onClose: () => void;
  onGoToDashboard: () => void;
}) {
  const title =
    status === "confirming"
      ? "Confirming your subscription"
      : status === "active"
        ? planName
          ? `You're on ${planName}`
          : "Subscription active"
        : "Payment received";
  const description =
    status === "confirming"
      ? "Your payment was received. We're waiting for the subscription to activate."
      : status === "active"
        ? balanceWords(credits, creditsFailed)
        : "Your payment was received, but activation could not be confirmed yet. Check your billing page in a moment.";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === "confirming" ? (
              <Loader2 className="h-5 w-5 animate-spin text-foreground" />
            ) : status === "active" ? (
              <CheckCircle2 className="h-5 w-5 text-success-600" />
            ) : null}
            {title}
          </DialogTitle>
          <DialogDescription className="num">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onGoToDashboard}>Go to dashboard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
