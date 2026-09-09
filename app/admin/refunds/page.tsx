"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertCircle,
  DollarSign,
  ExternalLink,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { OrderPicker } from "@/components/admin/refunds/order-picker";
import { RefundRequestsTable } from "@/components/admin/refunds/refund-requests-table";
import type { RefundableOrder } from "@/lib/api-client/admin-refunds";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { Refund, RefundSummary } from "@/lib/api-client/admin-refunds";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount / 100); // amounts are in cents
};

// ============================================================================
// REFUND ROW COMPONENT
// ============================================================================

interface RefundRowProps {
  refund: Refund;
}

function RefundRow({ refund }: RefundRowProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{refund.user_email}</div>
          <div className="text-sm text-muted-foreground">
            {refund.user_name}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>Order: {refund.lemonsqueezy_order_id}</div>
          {refund.plan_name && (
            <div className="text-muted-foreground">{refund.plan_name}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">
          {formatCurrency(refund.refund_amount)}
        </div>
        {refund.is_partial && (
          <Badge variant="secondary" className="text-xs mt-1">
            Partial (of {formatCurrency(refund.original_amount)})
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {refund.reason ? (
          <span className="text-sm">{refund.reason}</span>
        ) : (
          <span className="text-sm text-muted-foreground">
            No reason provided
          </span>
        )}
      </TableCell>
      <TableCell>{getStatusBadge(refund.status)}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(parseISO(refund.created_at), { addSuffix: true })}
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// STATS CARDS
// ============================================================================

interface StatsCardsProps {
  summary: RefundSummary | null;
  loading: boolean;
}

function StatsCards({ summary, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {(
          [
            "stats-loading-1",
            "stats-loading-2",
            "stats-loading-3",
            "stats-loading-4",
          ] as const
        ).map((id) => (
          <Card key={id}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{summary.total_refunds}</div>
          <p className="text-sm text-muted-foreground">Total Refunds</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.total_amount)}
          </div>
          <p className="text-sm text-muted-foreground">Total Refunded</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">
            {summary.completed_refunds}
          </div>
          <p className="text-sm text-muted-foreground">Completed</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{summary.partial_refunds}</div>
          <p className="text-sm text-muted-foreground">Partial Refunds</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// CREATE REFUND DIALOG
// ============================================================================

/** Which refund the admin chose; null until they pick one. */
type RefundMode = "full" | "partial" | null;

interface CreateRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateRefundDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateRefundDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RefundableOrder | null>(
    null,
  );
  const [manualEntry, setManualEntry] = useState(false);
  // Which refund the admin chose. "full" returns the whole remaining balance
  // and needs no amount; "partial" returns the amount typed below.
  const [mode, setMode] = useState<RefundMode>(null);
  // Typed confirmation on the bypass. The queue has approve and process as two
  // separate gates; this path has none, so it asks for one deliberate act.
  const [confirmText, setConfirmText] = useState("");
  const [formData, setFormData] = useState({
    order_id: "",
    subscription_id: "",
    amount: "",
    reason: "",
  });

  const resetState = () => {
    setStep(1);
    setSelectedOrder(null);
    setManualEntry(false);
    setMode(null);
    setConfirmText("");
    setFormData({
      order_id: "",
      subscription_id: "",
      amount: "",
      reason: "",
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const queryId =
    selectedOrder?.lemonsqueezy_order_id ||
    formData.order_id.trim() ||
    formData.subscription_id.trim();

  // Every amount below comes from the order the server returned. When an id is
  // typed by hand there is no order to read, so the amount is left to the
  // server, which reads the order back from LemonSqueezy anyway.
  const paidCents = selectedOrder?.total ?? null;
  const refundedCents = selectedOrder?.refunded_amount ?? null;
  const remainingCents = selectedOrder?.refundable_amount ?? null;
  const canRefund = remainingCents === null || remainingCents > 0;

  const parsedDollars =
    formData.amount.trim() !== "" ? parseFloat(formData.amount) : null;
  const partialCents =
    parsedDollars !== null && !Number.isNaN(parsedDollars)
      ? Math.round(parsedDollars * 100)
      : null;

  // A full refund is the remaining balance, which on an order that has already
  // been partially refunded is less than what was originally paid.
  const refundCents =
    mode === "partial" ? (partialCents ?? 0) : (remainingCents ?? 0);

  // Partial only if it leaves something behind. Asking for the whole remaining
  // balance closes the order out, whichever button was pressed.
  const isPartial =
    mode === "partial" &&
    (remainingCents === null || refundCents < remainingCents);

  const balanceAfter =
    remainingCents !== null ? Math.max(0, remainingCents - refundCents) : null;

  const startRefund = async (next: Exclude<RefundMode, null>) => {
    if (!queryId) {
      toast.error("Select an order, or enter an Order or Subscription ID");
      return;
    }

    setMode(next);

    if (next === "partial") {
      // The amount field is only meaningful for a partial refund, so the
      // review step waits until it has been filled in.
      return;
    }

    await goToReview();
  };

  const goToReview = async () => {
    // A manually entered id has no order attached, so look it up to show the
    // admin the real amounts before they confirm.
    if (!selectedOrder && queryId) {
      setSearching(true);
      try {
        const res = await apiClient.adminRefunds.searchOrders({
          search: queryId,
          per_page: 5,
        });
        if (res.data && res.data.length > 0) {
          setSelectedOrder(res.data[0]);
        }
      } catch (_err) {
        // Ignore lookup failure: the server validates the refund regardless.
      } finally {
        setSearching(false);
      }
    }

    setStep(2);
  };

  const handleReviewPartial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (partialCents === null || partialCents <= 0) {
      toast.error("Refund amount must be greater than $0");
      return;
    }

    if (remainingCents !== null && partialCents > remainingCents) {
      toast.error(
        `Refund cannot exceed the ${formatCurrency(remainingCents)} still refundable`,
      );
      return;
    }

    await goToReview();
  };

  const handleConfirmApprove = async () => {
    setLoading(true);

    try {
      const payload: {
        reason?: string;
        order_id?: string;
        subscription_id?: string;
        amount?: number;
      } = {
        reason: formData.reason || undefined,
      };

      if (formData.order_id) {
        payload.order_id = formData.order_id.trim();
      } else if (formData.subscription_id) {
        payload.subscription_id = formData.subscription_id.trim();
      } else if (selectedOrder) {
        payload.order_id = selectedOrder.lemonsqueezy_order_id;
      }

      // Omitting the amount tells the server "the whole remaining balance",
      // which it computes from LemonSqueezy rather than trusting this screen.
      if (mode === "partial" && partialCents) {
        payload.amount = partialCents;
      }

      await apiClient.adminRefunds.create(payload);

      toast.success("Refund issued successfully");

      handleOpenChange(false);
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process refund";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90dvh] flex flex-col overflow-hidden">
        {step === 1 ? (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-destructive">
                Immediate refund — bypasses review
              </DialogTitle>
              <DialogDescription>
                This pays out without a refund request, an approval or a record
                of who asked for it. For a customer&apos;s refund, log a request
                instead and approve it. Use this for fraud, chargebacks and
                other cases that cannot wait.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-1 min-h-0 flex-col gap-4 py-4">
              <div className="flex flex-1 min-h-0 flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Order to refund</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => {
                      setManualEntry((v) => !v);
                      setSelectedOrder(null);
                      setMode(null);
                    }}
                  >
                    {manualEntry ? "Search orders" : "Enter ID manually"}
                  </button>
                </div>

                {manualEntry ? (
                  <>
                    <Input
                      id="order_id"
                      value={formData.order_id}
                      onChange={(e) =>
                        setFormData({ ...formData, order_id: e.target.value })
                      }
                      placeholder="LemonSqueezy Order ID, e.g. 9372759"
                    />
                    <Label htmlFor="subscription_id" className="mt-2">
                      Or Subscription ID
                    </Label>
                    <Input
                      id="subscription_id"
                      value={formData.subscription_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subscription_id: e.target.value,
                        })
                      }
                      placeholder="UUID"
                    />
                  </>
                ) : (
                  <OrderPicker
                    selected={selectedOrder}
                    onSelect={(order) => {
                      setSelectedOrder(order);
                      setMode(null);
                      setFormData((prev) => ({ ...prev, amount: "" }));
                    }}
                  />
                )}
              </div>

              {/* What this order is worth. Straight from the API — the dialog
                  never works these out for itself. */}
              {selectedOrder && (
                <div className="shrink-0 rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid amount:</span>
                    <span className="font-medium">
                      {formatCurrency(paidCents ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Refunded amount:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(refundedCents ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Remaining refundable:
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(remainingCents ?? 0)}
                    </span>
                  </div>
                </div>
              )}

              <div className="shrink-0 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="flex-1"
                  variant={mode === "full" ? "default" : "outline"}
                  disabled={!queryId || !canRefund || searching}
                  onClick={() => startRefund("full")}
                >
                  Full Refund
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  variant={mode === "partial" ? "default" : "outline"}
                  disabled={!queryId || !canRefund || searching}
                  onClick={() => startRefund("partial")}
                >
                  Partial Refund
                </Button>
              </div>

              {!canRefund && (
                <p className="shrink-0 text-xs text-muted-foreground">
                  This order has been fully refunded — there is no balance left
                  to return.
                </p>
              )}

              {mode === "partial" && (
                <form
                  onSubmit={handleReviewPartial}
                  className="shrink-0 grid gap-2"
                >
                  <Label htmlFor="amount">
                    Refund amount ($)
                    {remainingCents !== null
                      ? ` — up to ${formatCurrency(remainingCents)}`
                      : ""}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="e.g. 25 or 10.50"
                  />
                  <Button type="submit" disabled={searching} className="mt-1">
                    {searching ? "Loading order…" : "Review Refund Details"}
                  </Button>
                </form>
              )}

              <div className="shrink-0 grid gap-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Customer requested refund via email"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-destructive">
                Confirm immediate payout
              </DialogTitle>
              <DialogDescription>
                Please review the refund calculations carefully before
                processing.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-3">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Refund Type:</span>
                  <Badge
                    variant={isPartial ? "secondary" : "default"}
                    className={!isPartial ? "bg-green-600 text-white" : ""}
                  >
                    {isPartial ? "Partial Refund" : "Full Refund"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Order / Subscription ID:
                  </span>
                  <span className="font-mono text-xs font-medium">
                    {queryId}
                  </span>
                </div>
                {selectedOrder && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">
                        {selectedOrder.user_email || "Customer"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Product Plan:
                      </span>
                      <span className="font-medium">
                        {selectedOrder.product_name || "Subscription"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Paid amount:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(paidCents ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Already refunded:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(refundedCents ?? 0)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-primary font-semibold text-base pt-2 border-t">
                  <span>Refund Amount:</span>
                  <span>
                    {selectedOrder
                      ? formatCurrency(refundCents)
                      : "Full remaining balance"}
                  </span>
                </div>
                {balanceAfter !== null && (
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Remaining refundable after this refund:</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(balanceAfter)}
                    </span>
                  </div>
                )}
                {formData.reason && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Reason:{" "}
                    </span>
                    {formData.reason}
                  </div>
                )}
              </div>

              <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Confirm Payout Execution</p>
                  <p className="text-xs mt-0.5 opacity-90">
                    This issues an immediate payout
                    {selectedOrder ? ` of ${formatCurrency(refundCents)}` : ""}{" "}
                    via LemonSqueezy back to the customer&apos;s payment method,
                    with no approval step and no refund request behind it.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-immediate">
                  Type <span className="font-mono font-semibold">CONFIRM</span>{" "}
                  to enable the payout
                </Label>
                <Input
                  id="confirm-immediate"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="CONFIRM"
                  autoComplete="off"
                />
              </div>
            </div>

            <DialogFooter className="shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setConfirmText("");
                  setStep(1);
                }}
                disabled={loading}
              >
                Back to Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmApprove}
                disabled={loading || confirmText.trim() !== "CONFIRM"}
              >
                {loading ? "Processing Payout..." : "Issue refund now"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RefundManagementPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([]);
  const [summary, setSummary] = useState<RefundSummary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    total_pages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch refunds
  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.adminRefunds.list({
        page: pagination.page,
        per_page: 50,
      });

      setRefunds(response.refunds);
      setFilteredRefunds(response.refunds);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (_error) {
      toast.error("Failed to load refund data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page]);

  // Filter refunds based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredRefunds(refunds);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = refunds.filter(
      (refund) =>
        refund.user_email?.toLowerCase().includes(query) ||
        refund.lemonsqueezy_order_id.toLowerCase().includes(query) ||
        refund.plan_name?.toLowerCase().includes(query) ||
        refund.user_name?.toLowerCase().includes(query),
    );
    setFilteredRefunds(filtered);
  }, [searchQuery, refunds]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  return (
    <AdminGuard superAdminOnly={true}>
      <PageLayout
        title="Refund Management"
        description="View refund history and process new refunds"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() =>
                window.open("https://app.lemonsqueezy.com/", "_blank")
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              LemonSqueezy
            </Button>
            {/* The bypass. Normal refunds go through Refund Requests: log,
                approve, then process. This pays out on the spot, so it is
                styled as the exception it is. */}
            <Button
              variant="destructive"
              onClick={() => setShowCreateDialog(true)}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Immediate refund
            </Button>
            <Button onClick={fetchRefunds} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        }
      >
        {/* Info Banner */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Refund Processing
                </h3>
                <p className="text-sm text-blue-800">
                  Refunds run through Refund Requests below: log what the
                  customer asked for, approve it, then process the payout.
                  Immediate refund skips all three and pays out on the spot —
                  keep it for fraud and chargebacks. Refunds issued from the{" "}
                  <a
                    href="https://app.lemonsqueezy.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    LemonSqueezy Dashboard
                  </a>{" "}
                  appear here automatically via webhooks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <StatsCards summary={summary} loading={loading} />

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label
                  htmlFor="search-refunds"
                  className="text-sm font-medium mb-2 block"
                >
                  Search by Email, Order ID, Name, or Plan
                </Label>
                <Input
                  id="search-refunds"
                  placeholder="Search refunds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer refund requests awaiting review */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Refund Requests</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customer-initiated requests. Approving one records the decision;
              use Process refund to issue the payout.
            </p>
          </CardHeader>
          <CardContent>
            <RefundRequestsTable />
          </CardContent>
        </Card>

        {/* Refunds Table */}
        <Card>
          <CardHeader>
            <CardTitle>Refund History</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {filteredRefunds.length} of {pagination.total} refunds
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {(
                  [
                    "refund-table-1",
                    "refund-table-2",
                    "refund-table-3",
                    "refund-table-4",
                    "refund-table-5",
                  ] as const
                ).map((id) => (
                  <Skeleton key={id} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredRefunds.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No refunds found matching your search"
                    : "No refunds found"}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order/Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.map((refund) => (
                      <RefundRow key={refund.id} refund={refund} />
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.total_pages} (
                      {pagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.page - 1,
                          })
                        }
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.page + 1,
                          })
                        }
                        disabled={pagination.page === pagination.total_pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Refund Dialog */}
        <CreateRefundDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={fetchRefunds}
        />
      </PageLayout>
    </AdminGuard>
  );
}
