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

import { useQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { FieldController } from "@/components/forms/field-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { apiClient } from "@/lib/api-client";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { subscriptionQueries } from "@/lib/query-keys";
import { log } from "@/lib/logger";
import {
  REFUND_REASON_MAX,
  refundRequestSchema,
} from "@/schemas/refund-schemas";
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
      <RefundRequestDialog
        order={order}
        open={open}
        onOpenChange={setOpen}
        onSubmitted={onSubmitted}
      />
    </>
  );
}

/**
 * The request itself (plans/app/F-billing.md F7): the whole remaining payment, as the refund rule
 * has no partial refunds, and the reason. The rule's numbers come from the plan catalogue.
 */
function RefundRequestDialog({
  order,
  open,
  onOpenChange,
  onSubmitted,
}: {
  order: OrderRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}) {
  const { data: catalog } = useQuery(subscriptionQueries.catalog());
  const rule = catalog?.refund;
  const remaining = order.refundable_amount ?? order.total ?? 0;
  const form = useZodForm(refundRequestSchema, {
    defaultValues: { reason: "" },
  });
  const { isSubmitting } = form.formState;

  const close = (next: boolean) => {
    if (!next) form.reset({ reason: "" });
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(async ({ reason }) => {
    try {
      await apiClient.subscriptions.requestRefund({
        lemonsqueezy_order_id: order.lemonsqueezy_order_id,
        reason,
      });
      toast.success("Refund requested", {
        description: "We'll email you once it has been reviewed.",
      });
      close(false);
      onSubmitted?.();
    } catch (error) {
      log.error("Failed to submit refund request", error);
      toast.error("The request wasn't sent", {
        description:
          error instanceof Error && error.message
            ? error.message
            : "Try again in a moment.",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a refund</DialogTitle>
          <DialogDescription>
            {rule
              ? `Within ${rule.window_days} days of a payment, the whole payment comes back if fewer than ${rule.credit_limit} credits were used since it.`
              : "The whole payment comes back under the refund rule."}{" "}
            Our team reviews the request; nothing is refunded before that.
          </DialogDescription>
        </DialogHeader>

        <dl className="flex flex-col gap-1 rounded-md border border-border p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">
              {order.product_name ?? "Payment"}
              {order.ordered_at && `, ${dateFormat.short(order.ordered_at)}`}
            </dt>
            <dd className="num">{formatAmount(order.total, order.currency)}</dd>
          </div>
          {order.refunded_amount > 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Refunded so far</dt>
              <dd className="num">
                {formatAmount(order.refunded_amount, order.currency)}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-1 font-medium">
            <dt>You'd get back</dt>
            <dd className="num">{formatAmount(remaining, order.currency)}</dd>
          </div>
        </dl>

        <form
          id="refund-request"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          <FieldController
            control={form.control}
            name="reason"
            label="Why are you asking for a refund?"
            required
            maxLength={REFUND_REASON_MAX}
          >
            {(field) => (
              <Textarea
                {...field}
                rows={4}
                placeholder="What didn't work for you"
              />
            )}
          </FieldController>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => close(false)}
            disabled={isSubmitting}
          >
            Keep payment
          </Button>
          <Button type="submit" form="refund-request" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Request refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
