"use client";

/**
 * Refund Requests Queue Component
 *
 * Customers ask for refunds, which enter this queue.
 * Approving moves no money — issuing the refund is a second, deliberate "Process refund" action.
 *
 * @module components/admin/refunds/refund-requests-table
 */

import { Loader2, RotateCcw, CheckCircle2, XCircle, Play } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { apiClient } from "@/lib/api-client";
import type { RefundRequestRow } from "@/lib/api-client/admin-refunds";
import { log } from "@/lib/logger";
import type { Column } from "@/types/data-table";

type Decision = "approve" | "reject" | "process";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

function statusBadge(request: RefundRequestRow) {
  if (request.status === "approved") {
    return request.awaiting_processing ? (
      <Badge variant="outline" className="text-amber-600 border-amber-600">
        Approved · awaiting payout
      </Badge>
    ) : (
      <Badge variant="default" className="bg-green-600">
        Refunded
      </Badge>
    );
  }

  const map = {
    pending: { variant: "secondary" as const, label: "Pending" },
    rejected: { variant: "destructive" as const, label: "Rejected" },
  } as const;
  const config = map[request.status as "pending" | "rejected"] ?? map.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
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
  const [undoing, setUndoing] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.adminRefunds.listRequests({
        per_page: 100,
      });
      setRequests(response.data ?? []);
    } catch (error) {
      log.error("Failed to load refund requests", error);
      toast.error("Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is a parent-driven reload trigger.
  useEffect(() => {
    load();
  }, [load, refreshKey]);

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
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${decision} request`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const tableData = useMemo(() => {
    return requests
      .filter((req) => {
        if (statusFilter === "pending") return req.status === "pending";
        if (statusFilter === "approved")
          return req.status === "approved" && req.awaiting_processing;
        if (statusFilter === "refunded")
          return req.status === "approved" && !req.awaiting_processing;
        if (statusFilter === "rejected") return req.status === "rejected";
        return true;
      })
      .map((req) => ({
        ...req,
      }));
  }, [requests, statusFilter]);

  const columns: Column<RefundRequestRow & Record<string, unknown>>[] = [
    {
      key: "user_email",
      header: "Customer",
      width: "220px",
      cell: (_val, row) => (
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {row.user_email || "Unknown Customer"}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
            <span className="font-medium text-foreground">Reason:</span>{" "}
            {row.reason}
          </p>
        </div>
      ),
      searchable: true,
    },
    {
      key: "lemonsqueezy_order_id",
      header: "Order / Product",
      width: "200px",
      cell: (_val, row) => (
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {row.product_name || "Order"}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            #{row.lemonsqueezy_order_id}
          </p>
        </div>
      ),
      searchable: true,
    },
    {
      key: "requested_amount",
      header: "Amount",
      width: "150px",
      cell: (_val, row) => (
        <div>
          <div className="font-semibold text-sm">
            {formatAmount(row.requested_amount, row.currency)}
          </div>
          {row.refunded_amount > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {formatAmount(row.refunded_amount, row.currency)} refunded
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "180px",
      cell: (_val, row) => statusBadge(row),
    },
    {
      key: "created_at",
      header: "Created",
      width: "120px",
      cell: (_val, row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "220px",
      cell: (_val, row) => (
        <div className="flex items-center gap-2">
          {row.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => openDecision(row, "reject")}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => openDecision(row, "approve")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
            </>
          )}
          {row.awaiting_processing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                disabled={undoing === row.id}
                onClick={() => undoApproval(row)}
              >
                {undoing === row.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                )}
                Undo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => openDecision(row, "reject")}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => openDecision(row, "process")}
              >
                <Play className="h-3.5 w-3.5 mr-1 fill-current" />
                Process
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={tableData}
        isLoading={loading}
        mobileCards
        searchPlaceholder="Search requests by email, order ID or reason..."
        pageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        tableId="admin-refund-requests"
        emptyTitle="No refund requests found"
        emptyDescription="No customer-initiated refund requests match your selected filters."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Awaiting Payout</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {statusFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        }
      />

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
