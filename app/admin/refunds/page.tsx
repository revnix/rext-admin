"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertCircle,
  DollarSign,
  ExternalLink,
  Filter,
  Plus,
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_id: "",
    subscription_id: "",
    amount: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        payload.order_id = formData.order_id;
      } else if (formData.subscription_id) {
        payload.subscription_id = formData.subscription_id;
      } else {
        toast.error("Please provide either Order ID or Subscription ID");
        setLoading(false);
        return;
      }

      if (formData.amount) {
        payload.amount = parseInt(formData.amount, 10);
      }

      await apiClient.adminRefunds.create(payload);

      toast.success("Refund created successfully");

      onOpenChange(false);
      setFormData({
        order_id: "",
        subscription_id: "",
        amount: "",
        reason: "",
      });
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create refund";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Refund</DialogTitle>
          <DialogDescription>
            Process a refund via LemonSqueezy API. Provide either an Order ID or
            Subscription ID.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="order_id">LemonSqueezy Order ID</Label>
              <Input
                id="order_id"
                value={formData.order_id}
                onChange={(e) =>
                  setFormData({ ...formData, order_id: e.target.value })
                }
                placeholder="e.g., 123456"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subscription_id">Or Subscription ID</Label>
              <Input
                id="subscription_id"
                value={formData.subscription_id}
                onChange={(e) =>
                  setFormData({ ...formData, subscription_id: e.target.value })
                }
                placeholder="UUID"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">
                Amount (cents) - Optional for partial refund
              </Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="Leave empty for full refund"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Customer requested refund"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Create Refund"}
            </Button>
          </DialogFooter>
        </form>
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
          <>
            <Button
              variant="outline"
              onClick={() =>
                window.open("https://app.lemonsqueezy.com/", "_blank")
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              LemonSqueezy
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Refund
            </Button>
            <Button onClick={fetchRefunds} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </>
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
                  You can process refunds directly from this page or via the{" "}
                  <a
                    href="https://app.lemonsqueezy.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    LemonSqueezy Dashboard
                  </a>
                  . Refunds processed via LemonSqueezy will automatically appear
                  here via webhooks.
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
