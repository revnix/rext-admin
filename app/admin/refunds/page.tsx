"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ListPage } from "@/components/layouts";
import { AdminGuard } from "@/components/permission/admin-guard";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createDataTableColumnHelper,
  DataTable,
} from "@/components/ui/data-table";
import { RefundRequestsTable } from "@/components/admin/refunds/refund-requests-table";
import { Skeleton } from "@/components/ui/skeleton";
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

const REFUND_STATUS: Record<
  string,
  { label: string; variant: BadgeProps["variant"] }
> = {
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
  pending: { label: "Pending", variant: "warning" },
};

const getStatusBadge = (status: string) => {
  const known = REFUND_STATUS[status];
  return (
    <Badge variant={known?.variant ?? "neutral"}>
      {known?.label ?? status}
    </Badge>
  );
};

const column = createDataTableColumnHelper<Refund>();

const historyColumns = column.columns([
  column.accessor((r) => `${r.user_email ?? ""} ${r.user_name ?? ""}`, {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {row.original.user_email || "Unknown customer"}
        </p>
        {row.original.user_name && (
          <p className="truncate text-muted-foreground">
            {row.original.user_name}
          </p>
        )}
      </div>
    ),
  }),
  column.accessor((r) => `${r.lemonsqueezy_order_id} ${r.plan_name ?? ""}`, {
    id: "order",
    header: "Order / plan",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="num font-mono">#{row.original.lemonsqueezy_order_id}</p>
        {row.original.plan_name && (
          <p className="truncate text-muted-foreground">
            {row.original.plan_name}
          </p>
        )}
      </div>
    ),
  }),
  column.accessor("refund_amount", {
    header: "Amount",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5">
        {row.original.is_partial && <Badge variant="neutral">Partial</Badge>}
        <span className="font-medium text-foreground">
          {formatCurrency(row.original.refund_amount)}
        </span>
      </span>
    ),
    enableGlobalFilter: false,
  }),
  column.accessor((r) => r.reason ?? "", {
    id: "reason",
    header: "Reason",
    cell: ({ getValue }) => (
      <span className="line-clamp-2 text-muted-foreground">
        {getValue() || "No reason given"}
      </span>
    ),
    enableSorting: false,
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => getStatusBadge(getValue()),
    filterFn: "arrHas",
    enableGlobalFilter: false,
  }),
  column.accessor((r) => (r.is_partial ? "partial" : "full"), {
    id: "type",
    header: "Type",
    filterFn: "arrHas",
    enableGlobalFilter: false,
  }),
  column.accessor((r) => Date.parse(r.created_at) || 0, {
    id: "created_at",
    header: "Created",
    meta: { align: "end" },
    cell: ({ row }) =>
      formatDistanceToNow(parseISO(row.original.created_at), {
        addSuffix: true,
      }),
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
]);

const HISTORY_FACETS = [
  {
    column: "status",
    title: "Status",
    options: Object.entries(REFUND_STATUS).map(([value, { label }]) => ({
      value,
      label,
    })),
  },
  {
    column: "type",
    title: "Type",
    options: [
      { value: "full", label: "Full refunds" },
      { value: "partial", label: "Partial refunds" },
    ],
  },
];

// The type is a facet; as a column it would only repeat the amount's "Partial".
const HISTORY_HIDDEN = ["type"];

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
              caption="Refund history"
              columns={historyColumns}
              data={refunds}
              getRowId={(refund) => refund.id}
              getRowLabel={(refund) =>
                refund.user_email || `order ${refund.lemonsqueezy_order_id}`
              }
              isLoading={loading}
              surface="plain"
              search={{ placeholder: "Search by customer, order or reason" }}
              facets={HISTORY_FACETS}
              hiddenColumns={HISTORY_HIDDEN}
              pageSizeOptions={[10, 25, 50, 100]}
              emptyState={
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No refunds yet.
                </p>
              }
              renderCard={(refund) => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium text-foreground">
                      {refund.user_email || "Unknown customer"}
                    </p>
                    <span className="num font-medium text-foreground">
                      {formatCurrency(refund.refund_amount)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    {getStatusBadge(refund.status)}
                    <span className="num">#{refund.lemonsqueezy_order_id}</span>
                    {refund.is_partial && <span>Partial</span>}
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </ListPage>
    </AdminGuard>
  );
}
