"use client";

/**
 * Refund Requests Queue
 *
 * The admin side of customer-initiated refunds: review a request, then approve
 * (which issues the refund immediately) or reject with a note the customer
 * sees.
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { RefundRequestRow } from "@/lib/api-client/admin-refunds";
import { log } from "@/lib/logger";

type Decision = "approve" | "reject";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

function statusBadge(status: RefundRequestRow["status"]) {
  const map = {
    pending: { variant: "secondary" as const, label: "Pending" },
    approved: { variant: "default" as const, label: "Approved" },
    rejected: { variant: "destructive" as const, label: "Rejected" },
  };
  const config = map[status] ?? map.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RefundRequestsTable() {
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

  useEffect(() => {
    load();
  }, [load]);

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
        toast.success("Refund approved and issued");
      } else {
        await apiClient.adminRefunds.rejectRequest(
          active.id,
          note || undefined,
        );
        toast.success("Refund request rejected");
      }
      setActive(null);
      await load();
    } catch (error) {
      log.error(`Failed to ${decision} refund request`, error);
      // A failed approval leaves the request pending, so it can be retried.
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

  if (requests.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No refund requests yet. They appear here when a customer asks for a
        refund from their billing page.
      </p>
    );
  }

  return (
    <>
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
                {statusBadge(request.status)}
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
                  Approve &amp; refund
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
                ? "Approve and refund"
                : "Reject this request"}
            </DialogTitle>
            <DialogDescription>
              {decision === "approve"
                ? `This refunds ${
                    active
                      ? formatAmount(active.requested_amount, active.currency)
                      : ""
                  } to ${active?.user_email ?? "the customer"} immediately. It cannot be undone.`
                : "No money moves. Your note is shown to the customer, so explain the decision."}
            </DialogDescription>
          </DialogHeader>

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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActive(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant={decision === "approve" ? "default" : "destructive"}
              onClick={submitDecision}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {decision === "approve" ? "Approve & refund" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
