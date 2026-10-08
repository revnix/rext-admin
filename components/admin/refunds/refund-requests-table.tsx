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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
} from "@/components/ui/data-table";
import { apiClient } from "@/lib/api-client";
import type { RefundRequestRow } from "@/lib/api-client/admin-refunds";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { log } from "@/lib/logger";
import { PlanChangeNotice } from "./plan-change-notice";

type Decision = "approve" | "reject" | "process";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

/** Where a request stands: an approval waits for its payout until it is processed. */
function stageOf(request: RefundRequestRow) {
  if (request.status === "approved") {
    return request.awaiting_processing ? "awaiting" : "refunded";
  }
  return request.status === "rejected" ? "rejected" : "pending";
}

const STAGES: Record<
  string,
  { label: string; variant: BadgeProps["variant"] }
> = {
  pending: { label: "Pending", variant: "warning" },
  awaiting: { label: "Approved · awaiting payout", variant: "warning" },
  refunded: { label: "Refunded", variant: "success" },
  rejected: { label: "Rejected", variant: "neutral" },
};

function StageBadge({ request }: { request: RefundRequestRow }) {
  const stage = STAGES[stageOf(request)];
  return <Badge variant={stage.variant}>{stage.label}</Badge>;
}

const column = createDataTableColumnHelper<RefundRequestRow>();

const columns = column.columns([
  column.accessor((r) => `${r.user_email ?? ""} ${r.reason ?? ""}`, {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {row.original.user_email || "Unknown customer"}
        </p>
        <p className="line-clamp-2 text-muted-foreground">
          Reason: {row.original.reason || "none given"}
        </p>
      </div>
    ),
  }),
  column.accessor((r) => `${r.product_name ?? ""} ${r.lemonsqueezy_order_id}`, {
    id: "order",
    header: "Order / product",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {row.original.product_name || "Order"}
        </p>
        <p className="num truncate font-mono text-muted-foreground">
          #{row.original.lemonsqueezy_order_id}
        </p>
      </div>
    ),
  }),
  column.accessor("requested_amount", {
    header: "Amount",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">
          {formatAmount(row.original.requested_amount, row.original.currency)}
        </p>
        {row.original.refunded_amount > 0 && (
          <p className="text-muted-foreground">
            {formatAmount(row.original.refunded_amount, row.original.currency)}{" "}
            refunded
          </p>
        )}
      </div>
    ),
    enableGlobalFilter: false,
  }),
  column.accessor(stageOf, {
    id: "stage",
    header: "Status",
    cell: ({ row }) => <StageBadge request={row.original} />,
    filterFn: "arrHas",
    enableGlobalFilter: false,
  }),
  column.accessor((r) => Date.parse(r.created_at) || 0, {
    id: "created_at",
    header: "Created",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => dateFormat.short(row.original.created_at),
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
]);

const STAGE_FACET = [
  {
    column: "stage",
    title: "Status",
    options: Object.entries(STAGES).map(([value, { label }]) => ({
      value,
      label,
    })),
  },
];

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

  // The queue's next steps: decide a pending request; for an approved one, issue the payout or undo.
  const rowActions = (request: RefundRequestRow): DataTableRowAction[] => {
    if (request.status === "pending") {
      return [
        {
          label: "Approve",
          icon: CheckCircle2,
          onSelect: () => openDecision(request, "approve"),
        },
        {
          label: "Reject",
          icon: XCircle,
          destructive: true,
          onSelect: () => openDecision(request, "reject"),
        },
      ];
    }
    if (request.awaiting_processing) {
      return [
        {
          label: "Process refund",
          icon: Play,
          onSelect: () => openDecision(request, "process"),
        },
        {
          label: "Undo approval",
          icon: RotateCcw,
          disabled: undoing === request.id ? "Undoing…" : false,
          onSelect: () => void undoApproval(request),
        },
        {
          label: "Reject",
          icon: XCircle,
          destructive: true,
          onSelect: () => openDecision(request, "reject"),
        },
      ];
    }
    return [];
  };

  return (
    <div className="space-y-4">
      <DataTable
        caption="Refund requests"
        columns={columns}
        data={requests}
        getRowId={(request) => request.id}
        getRowLabel={(request) =>
          request.user_email || `order ${request.lemonsqueezy_order_id}`
        }
        isLoading={loading}
        surface="plain"
        search={{ placeholder: "Search by email, order or reason" }}
        facets={STAGE_FACET}
        rowActions={rowActions}
        pageSizeOptions={[10, 25, 50]}
        emptyState={
          <p className="py-8 text-center text-sm text-muted-foreground">
            No refund requests from customers yet.
          </p>
        }
        renderCard={(request, { actions }) => (
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-medium text-foreground">
                  {request.user_email || "Unknown customer"}
                </p>
                <span className="num font-medium text-foreground">
                  {formatAmount(request.requested_amount, request.currency)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <StageBadge request={request} />
                <span className="num">#{request.lemonsqueezy_order_id}</span>
              </div>
            </div>
            {actions}
          </div>
        )}
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

          {/* Before the decision and before the money moves: the payment this refund leaves out. */}
          {(decision === "approve" || decision === "process") && (
            <PlanChangeNotice
              // Its own height: on a phone the dialog fills the screen and stretches its rows.
              className="self-start"
              charges={active?.plan_change_charges}
              // The request takes all that is left of the order: the plan ends with it.
              full={
                active !== null &&
                active.requested_amount >= active.refundable_amount
              }
            />
          )}

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
