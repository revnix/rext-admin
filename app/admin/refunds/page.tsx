"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { AlertCircle, ExternalLink, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ListPage } from "@/components/layouts";
import { AdminGuard } from "@/components/permission/admin-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { RefundRequestsTable } from "@/components/admin/refunds/refund-requests-table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import type { Refund, RefundSummary } from "@/lib/api-client/admin-refunds";
import type { Column } from "@/types/data-table";

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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

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
          <div className="text-2xl font-bold">
            {formatCurrency(summary.total_amount)}
          </div>
          <p className="text-sm text-muted-foreground">Total Refunded</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{summary.completed_refunds}</div>
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
// MAIN COMPONENT
// ============================================================================

export default function RefundManagementPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [summary, setSummary] = useState<RefundSummary | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters for Refund History
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch refunds
  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.adminRefunds.list({
        page: 1,
        per_page: 200,
      });

      setRefunds(response.refunds);
      setSummary(response.summary);
    } catch (_error) {
      toast.error("Failed to load refund data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  // Filtered dataset for DataTable
  const tableData = useMemo(() => {
    return refunds
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (typeFilter === "full" && r.is_partial) return false;
        if (typeFilter === "partial" && !r.is_partial) return false;
        return true;
      })
      .map((r) => ({ ...r }));
  }, [refunds, statusFilter, typeFilter]);

  const historyColumns: Column<Refund & Record<string, unknown>>[] = [
    {
      key: "user_email",
      header: "Customer",
      width: "220px",
      cell: (_val, row) => (
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {row.user_email || "Unknown Customer"}
          </p>
          {row.user_name && (
            <p className="text-xs text-muted-foreground truncate">
              {row.user_name}
            </p>
          )}
        </div>
      ),
      searchable: true,
    },
    {
      key: "lemonsqueezy_order_id",
      header: "Order / Plan",
      width: "200px",
      cell: (_val, row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium font-mono">
            #{row.lemonsqueezy_order_id}
          </p>
          {row.plan_name && (
            <p className="text-xs text-muted-foreground truncate">
              {row.plan_name}
            </p>
          )}
        </div>
      ),
      searchable: true,
    },
    {
      key: "refund_amount",
      header: "Amount",
      width: "160px",
      cell: (_val, row) => (
        <div>
          <span className="font-semibold text-sm">
            {formatCurrency(row.refund_amount)}
          </span>
          {row.is_partial && (
            <Badge variant="secondary" className="ml-1.5 font-normal">
              Partial
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      width: "220px",
      cell: (_val, row) => (
        <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
          {row.reason || "No reason provided"}
        </span>
      ),
      searchable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "130px",
      cell: (_val, row) => getStatusBadge(row.status),
    },
    {
      key: "created_at",
      header: "Created",
      width: "140px",
      cell: (_val, row) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(parseISO(row.created_at), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <AdminGuard superAdminOnly={true}>
      <ListPage
        title="Refund Management"
        description="View refund history and process customer refund requests"
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
            <Button
              onClick={() => {
                // Bump the table's refreshKey only on explicit refresh —
                // bumping inside fetchRefunds re-triggered the table's load
                // effect on the initial mount and double-fetched the list.
                setRefreshKey((prev) => prev + 1);
                fetchRefunds();
              }}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        }
      >
        {/* Info Banner */}
        <Card className="mb-6 border-border bg-muted/40">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Refund Processing Workflow
                </h3>
                <p className="text-sm text-foreground">
                  Refunds run through Refund Requests below. Approving a request
                  records the decision; use Process refund to issue the payout.
                  Refunds issued directly from the{" "}
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

        {/* Customer refund requests awaiting review */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Refund Requests</CardTitle>
            <CardDescription>
              Customer-initiated requests. Approving one records the decision;
              use Process refund to issue the payout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RefundRequestsTable refreshKey={refreshKey} />
          </CardContent>
        </Card>

        {/* Refunds History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Refund History</CardTitle>
            <CardDescription>
              Completed and processed refunds history across all workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={historyColumns}
              data={tableData}
              isLoading={loading}
              mobileCards
              searchPlaceholder="Search history by customer email, order ID or reason..."
              pageSize={10}
              pageSizeOptions={[10, 25, 50, 100]}
              tableId="admin-refund-history"
              emptyTitle="No refunds found"
              emptyDescription="No refund history matches your search or selected filters."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <div className="w-[150px]">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="h-9 text-xs bg-card">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Filter */}
                  <div className="w-[150px]">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-9 text-xs bg-card">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="full">Full Refunds</SelectItem>
                        <SelectItem value="partial">Partial Refunds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Filters */}
                  {(statusFilter !== "all" || typeFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setTypeFilter("all");
                      }}
                      className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              }
            />
          </CardContent>
        </Card>
      </ListPage>
    </AdminGuard>
  );
}
