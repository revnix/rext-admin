"use client";

/**
 * Refund Requests Queue
 *
 * Customers ask for refunds by email, so an admin logs the request here and it
 * enters this queue. From there: approve or reject it with a note the customer
 * sees, then process the approved one. Approving moves no money — issuing the
 * refund is a second, deliberate "Process refund" action, so a mis-click on
 * the queue cannot charge anything back.
 *
 * Pending requests sort first, server-side, so the queue stays actionable.
 *
 * @module components/admin/refunds/refund-requests-table
 */

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { OrderPicker } from "@/components/admin/refunds/order-picker";
import { apiClient } from "@/lib/api-client";
import type {
  RefundableOrder,
  RefundRequestRow,
} from "@/lib/api-client/admin-refunds";
import { log } from "@/lib/logger";

type Decision = "approve" | "reject" | "process";

/** What the customer asked for; null until the admin picks one. */
type RefundMode = "full" | "partial" | null;

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

function statusBadge(request: RefundRequestRow) {
  // An approved request that has been paid out reads as "Refunded"; one still
  // waiting for the admin to run it reads as "Awaiting payout", because the
  // two are very different states for the customer.
  if (request.status === "approved") {
    return request.awaiting_processing ? (
      <Badge variant="outline">Approved · awaiting payout</Badge>
    ) : (
      <Badge variant="default">Refunded</Badge>
    );
  }

  const map = {
    pending: { variant: "secondary" as const, label: "Pending" },
    rejected: { variant: "destructive" as const, label: "Rejected" },
  } as const;
  const config = map[request.status as "pending" | "rejected"] ?? map.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Files a refund a customer asked for by email.
 *
 * The order is picked from the same search the refund dialog uses, so the
 * request is always attached to a real order — and to the customer who placed
 * it, which the server takes from the order rather than from this form.
 */
function LogRequestDialog({ onLogged }: { onLogged: () => void }) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<RefundableOrder | null>(null);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<RefundMode>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setOpen(false);
    setOrder(null);
    setReason("");
    setMode(null);
    setAmount("");
  };

  const partialCents =
    amount.trim() === "" ? null : Math.round(Number.parseFloat(amount) * 100);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) {
      toast.error("Select the order the customer wants refunded");
      return;
    }
    if (!mode) {
      toast.error("Choose a full or partial refund");
      return;
    }
    if (!reason.trim()) {
      toast.error("Add the reason the customer gave");
      return;
    }

    if (mode === "partial") {
      if (
        partialCents === null ||
        Number.isNaN(partialCents) ||
        partialCents <= 0
      ) {
        toast.error("Requested amount must be greater than $0");
        return;
      }
      if (partialCents > order.refundable_amount) {
        toast.error(
          `Only ${formatAmount(order.refundable_amount, order.currency)} is still refundable`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await apiClient.adminRefunds.createRequest({
        lemonsqueezy_order_id: order.lemonsqueezy_order_id,
        reason: reason.trim(),
        // A full request omits the amount: the server resolves it to whatever
        // is still refundable at the moment it is processed, which is the only
        // number that can be right by then.
        requested_amount:
          mode === "partial" && partialCents ? partialCents : undefined,
      });
      toast.success("Refund request logged", {
        description: "Approve it, then process the refund.",
      });
      close();
      onLogged();
    } catch (error) {
      log.error("Failed to log refund request", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to log refund request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Log refund request
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Log a refund request</DialogTitle>
            <DialogDescription>
              Record a refund a customer asked for by email. This moves no money
              — it puts the request in the queue for approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Order the customer wants refunded</Label>
              <OrderPicker
                selected={order}
                onSelect={(next) => {
                  setOrder(next);
                  setMode(null);
                  setAmount("");
                }}
              />
            </div>

            {order && (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">
                    {order.user_email ?? "unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid amount:</span>
                  <span className="font-medium">
                    {formatAmount(order.total, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Refunded amount:
                  </span>
                  <span className="font-medium">
                    {formatAmount(order.refunded_amount, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Remaining refundable:
                  </span>
                  <span className="font-semibold">
                    {formatAmount(order.refundable_amount, order.currency)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>What is being requested</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="flex-1"
                  variant={mode === "full" ? "default" : "outline"}
                  disabled={!order || order.refundable_amount <= 0}
                  onClick={() => {
                    setMode("full");
                    setAmount("");
                  }}
                >
                  Full Refund
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  variant={mode === "partial" ? "default" : "outline"}
                  disabled={!order || order.refundable_amount <= 0}
                  onClick={() => setMode("partial")}
                >
                  Partial Refund
                </Button>
              </div>
              {mode === "full" && order && (
                <p className="text-xs text-muted-foreground">
                  Requests the whole remaining balance —{" "}
                  {formatAmount(order.refundable_amount, order.currency)} as
                  things stand.
                </p>
              )}
            </div>

            {mode === "partial" && (
              <div className="grid gap-2">
                <Label htmlFor="requested-amount">
                  Requested amount ($)
                  {order
                    ? ` — up to ${formatAmount(order.refundable_amount, order.currency)}`
                    : ""}
                </Label>
                <Input
                  id="requested-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 25 or 10.50"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="request-reason">Customer&apos;s reason</Label>
              <Textarea
                id="request-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="What the customer said in their email"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={close}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Log request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface RefundRequestsTableProps {
  refreshKey?: number;
}

export function RefundRequestsTable({
  refreshKey,
}: RefundRequestsTableProps = {}) {
  const [requests, setRequests] = useState<RefundRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<RefundRequestRow | null>(null);
  const [decision, setDecision] = useState<Decision>("approve");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.adminRefunds.listRequests({
        per_page: 50,
      });
      setRequests(response.data ?? []);
    } catch (error) {
      log.error("Failed to load refund requests", error);
      toast.error("Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger load on refreshKey prop changes
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const [undoing, setUndoing] = useState<string | null>(null);

  const undoApproval = async (request: RefundRequestRow) => {
    setUndoing(request.id);
    try {
      await apiClient.adminRefunds.unapproveRequest(request.id);
      toast.success("Approval undone", {
        description: "The request is pending again. The customer was not told.",
      });
      await load();
    } catch (error) {
      log.error("Failed to undo approval", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to undo approval",
      );
    } finally {
      setUndoing(null);
    }
  };

  const openDecision = (request: RefundRequestRow, next: Decision) => {
    setActive(request);
    setDecision(next);
    setNote("");
  };

  const submitDecision = async () => {
    if (!active) return;

    setSubmitting(true);
    try {
      if (decision === "approve") {
        await apiClient.adminRefunds.approveRequest(
          active.id,
          note || undefined,
        );
        toast.success("Refund request approved", {
          description: "Use Process refund to issue the payout.",
        });
      } else if (decision === "process") {
        await apiClient.adminRefunds.processRequest(active.id);
        toast.success("Refund issued");
      } else {
        await apiClient.adminRefunds.rejectRequest(
          active.id,
          note || undefined,
        );
        toast.success(
          active.status === "approved"
            ? "Approval reversed — no payout will be made"
            : "Refund request rejected",
        );
      }
      setActive(null);
      await load();
    } catch (error) {
      log.error(`Failed to ${decision} refund request`, error);
      // A failed approval leaves the request pending and a failed payout
      // leaves it approved, so either can simply be retried.
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${decision} request`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading requests…
      </div>
    );
  }

  // The log button lives outside the empty check on purpose: the queue starts
  // empty, and logging the first emailed request is exactly what an admin
  // needs to do from that state.
  if (requests.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <LogRequestDialog onLogged={load} />
        </div>
        <p className="p-8 text-center text-sm text-muted-foreground">
          No refund requests yet. Log one here when a customer emails support
          asking for a refund.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LogRequestDialog onLogged={load} />
      </div>

      <div className="divide-y rounded-md border">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {request.product_name ?? "Order"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatAmount(request.requested_amount, request.currency)}
                </span>
                {statusBadge(request)}
              </div>

              <p className="text-sm text-muted-foreground truncate">
                {request.user_email ?? "unknown customer"}
              </p>

              <p className="text-sm">
                <span className="text-muted-foreground">Reason: </span>
                {request.reason}
              </p>

              <p className="text-xs text-muted-foreground font-mono">
                Order {request.lemonsqueezy_order_id} ·{" "}
                {new Date(request.created_at).toLocaleDateString()}
              </p>

              {request.refunded_amount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatAmount(request.refunded_amount, request.currency)}{" "}
                  refunded ·{" "}
                  {formatAmount(request.refundable_amount, request.currency)}{" "}
                  still refundable
                </p>
              )}

              {request.admin_note && (
                <p className="text-xs text-muted-foreground">
                  Note: {request.admin_note}
                </p>
              )}
            </div>

            {request.status === "pending" && (
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDecision(request, "reject")}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => openDecision(request, "approve")}
                >
                  Approve
                </Button>
              </div>
            )}

            {request.awaiting_processing && (
              <div className="flex shrink-0 gap-2">
                {/* An approval that has not been paid out is still
                    reversible, so both ways back sit next to the way forward:
                    undo it as a mistake, or decide against it outright. */}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={undoing === request.id}
                  onClick={() => undoApproval(request)}
                >
                  {undoing === request.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Undo approval
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDecision(request, "reject")}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => openDecision(request, "process")}
                >
                  Process refund
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={() => setActive(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {decision === "approve"
                ? "Approve this request"
                : decision === "process"
                  ? "Process this refund"
                  : active?.status === "approved"
                    ? "Reverse this approval"
                    : "Reject this request"}
            </DialogTitle>
            <DialogDescription>
              {decision === "approve"
                ? "This records your decision only. No money moves until you process the refund."
                : decision === "process"
                  ? `This refunds ${
                      active
                        ? formatAmount(active.requested_amount, active.currency)
                        : ""
                    } to ${active?.user_email ?? "the customer"} via LemonSqueezy. It cannot be undone.`
                  : active?.status === "approved"
                    ? "No money has moved yet, so this approval can still be taken back. The customer may already have been told it was approved — your note is shown to them, so explain what changed."
                    : "No money moves. Your note is shown to the customer, so explain the decision."}
            </DialogDescription>
          </DialogHeader>

          {decision !== "process" && (
            <div className="grid gap-2 py-2">
              <Label htmlFor="admin-note">
                Note to customer {decision === "approve" ? "(optional)" : ""}
              </Label>
              <Textarea
                id="admin-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={
                  decision === "approve"
                    ? "Anything you want the customer to know"
                    : "Why this request was declined"
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActive(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant={decision === "reject" ? "destructive" : "default"}
              onClick={submitDecision}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {decision === "approve"
                ? "Approve request"
                : decision === "process"
                  ? "Process refund"
                  : active?.status === "approved"
                    ? "Reverse approval"
                    : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
