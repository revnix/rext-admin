"use client";

/**
 * Refund Request Button
 *
 * Lets a customer ask an admin to refund one order. It creates a *request* —
 * no money moves until an admin approves it.
 *
 * Eligibility is decided server-side and arrives on the order as
 * `can_request_refund`, so this never re-derives the rules and cannot drift
 * from what the API will accept. When an order already has a request, the
 * button is replaced by that request's state.
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
  const [submitting, setSubmitting] = useState(false);

  // An existing request replaces the button — its state is the useful thing
  // to show, and re-requesting is refused anyway.
  if (order.refund_request_status === "pending") {
    return <Badge variant="secondary">Refund requested</Badge>;
  }

  if (order.refund_request_status === "approved") {
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

  if (!order.can_request_refund) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please tell us why you're requesting a refund");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.subscriptions.requestRefund({
        lemonsqueezy_order_id: order.lemonsqueezy_order_id,
        reason: reason.trim(),
      });

      toast.success("Refund request submitted", {
        description: "We'll email you once it has been reviewed.",
      });
      setOpen(false);
      setReason("");
      onSubmitted?.();
    } catch (error) {
      log.error("Failed to submit refund request", error);
      // The API's messages are written for the customer, so show them as-is.
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
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Request refund
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Request a refund</DialogTitle>
            <DialogDescription>
              This sends a request to our team. Nothing is refunded until it is
              approved.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-2">
              <div className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {order.product_name ?? "Order"}
                  </span>
                  <span>{formatAmount(order.total, order.currency)}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {order.lemonsqueezy_order_id}
                  {order.ordered_at
                    ? ` · ${new Date(order.ordered_at).toLocaleDateString()}`
                    : ""}
                </p>
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
