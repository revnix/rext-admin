"use client";

/**
 * Refund Request Button
 *
 * Lets a customer ask an admin to refund an order. Creates a pending request —
 * no money moves until an admin approves and processes it.
 *
 * Eligibility is decided server-side and arrives on the order as
 * `can_request_refund`. When an order has an active request, the button
 * is replaced by that request's status badge.
 *
 * @module components/subscription/refund-request-button
 */

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import type { OrderRow } from "@/types/subscription";

interface RefundRequestButtonProps {
  order: OrderRow;
  /** Called after a request is submitted, so the list can refresh. */
  onSubmitted?: () => void;
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

export function RefundRequestButton({
  order,
  onSubmitted,
}: RefundRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Eligibility is the server's answer, and it is checked before any status
  // badge. Deciding by status first hid the button whenever an earlier request
  // had been approved and paid — so a customer refunded $25 of $100 could
  // never ask for the remaining $75, however much balance was left.
  //
  // Badges therefore only describe orders that cannot be acted on.
  const refundable = order.refundable_amount ?? 0;

  if (!order.can_request_refund) {
    if (order.refund_request_status === "pending") {
      return <Badge variant="secondary">Refund requested</Badge>;
    }

    // Approved but not yet paid out. Once it is paid the balance is gone, so
    // the fully-refunded badge below takes over.
    if (order.refund_request_status === "approved" && refundable > 0) {
      return <Badge variant="secondary">Refund approved</Badge>;
    }

    if (refundable <= 0 && order.refunded_amount > 0) {
      return <Badge variant="outline">Refunded</Badge>;
    }

    if (order.refund_request_status === "rejected") {
      return (
        <div className="text-right">
          <Badge variant="outline">Refund declined</Badge>
          {order.refund_admin_note && (
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              {order.refund_admin_note}
            </p>
          )}
        </div>
      );
    }

    // Nothing else fits, but the server may still have a reason worth saying —
    // most often that the refund window has closed. Silently dropping the
    // control is what makes that look like a bug.
    if (order.refund_ineligible_reason) {
      return (
        <p className="text-xs text-muted-foreground max-w-[240px] text-right">
          {order.refund_ineligible_reason}
        </p>
      );
    }

    return null;
  }

  const remaining = order.refundable_amount ?? order.total ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please tell us why you're requesting a refund");
      return;
    }

    // Empty means "everything still refundable", which the server works out at
    // the moment it is processed rather than from this screen.
    const dollars = amount.trim() === "" ? null : Number.parseFloat(amount);
    if (dollars !== null && (Number.isNaN(dollars) || dollars <= 0)) {
      toast.error("Refund amount must be greater than $0");
      return;
    }

    const cents = dollars === null ? undefined : Math.round(dollars * 100);
    if (cents !== undefined && cents > remaining) {
      toast.error(
        `You can request up to ${formatAmount(remaining, order.currency)}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.subscriptions.requestRefund({
        lemonsqueezy_order_id: order.lemonsqueezy_order_id,
        reason: reason.trim(),
        requested_amount: cents,
      });

      toast.success("Refund request submitted", {
        description: "We'll email you once it has been reviewed.",
      });
      setOpen(false);
      setReason("");
      setAmount("");
      onSubmitted?.();
    } catch (error) {
      log.error("Failed to submit refund request", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit refund request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {order.refund_request_status === "rejected" && (
          <Badge variant="outline" className="text-xs">
            Declined previously
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Request refund
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Request a refund</DialogTitle>
            <DialogDescription>
              This sends a request to our team. Nothing is refunded until an
              admin reviews and processes it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-2">
              <div className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {order.product_name ?? "Order"}
                  </span>
                  <span className="font-semibold">
                    {formatAmount(order.total, order.currency)}
                  </span>
                </div>

                {order.refunded_amount > 0 && (
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Refunded so far:</span>
                    <span>
                      {formatAmount(order.refunded_amount, order.currency)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground pt-1 border-t">
                  <span>Refundable Balance:</span>
                  <span>{formatAmount(remaining, order.currency)}</span>
                </div>

                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Order: {order.lemonsqueezy_order_id}
                  {order.ordered_at
                    ? ` · ${new Date(order.ordered_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="refund-amount">
                  How much are you asking for? — leave empty for the full{" "}
                  {formatAmount(remaining, order.currency)}
                </Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`e.g. 25 (up to ${formatAmount(remaining, order.currency)})`}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="refund-reason">
                  Why are you requesting a refund?
                </Label>
                <Textarea
                  id="refund-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us what went wrong"
                  rows={4}
                  maxLength={2000}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !reason.trim()}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
