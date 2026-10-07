"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReceiptDialog } from "@/components/subscription/receipt-dialog";
import { RefundRequestButton } from "@/components/subscription/refund-request-button";
import { Badge } from "@/components/ui/badge";
import {
  createDataTableColumnHelper,
  DataTable,
  UNKNOWN,
  useDataTableUrlState,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { subscriptionQueries } from "@/lib/query-keys";
import { invoiceListParams } from "@/lib/search-params/invoices";
import type { OrderRow } from "@/types/subscription";
import { formatAmount } from "./billing-format";

const STATUS: Record<
  string,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  paid: { label: "Paid", tone: "success" },
  partial_refund: { label: "Partly refunded", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
};

function StatusCell({ order }: { order: OrderRow }) {
  const status = STATUS[order.status] ?? {
    label: order.status,
    tone: "neutral" as const,
  };
  return (
    <span className="flex flex-col items-start gap-1">
      <Badge variant={status.tone}>{status.label}</Badge>
      {order.refunded_amount > 0 && order.status !== "refunded" && (
        <span className="num text-muted-foreground">
          {formatAmount(order.refunded_amount, order.currency)} refunded
        </span>
      )}
    </span>
  );
}

function Actions({ order }: { order: OrderRow }) {
  const queryClient = useQueryClient();
  // A request changes the row's refund state: read the orders again.
  const refresh = () =>
    void queryClient.invalidateQueries({
      queryKey: subscriptionQueries.orders().queryKey,
    });
  return (
    <span className="flex flex-wrap items-center justify-end gap-2">
      <ReceiptDialog order={order} />
      <RefundRequestButton order={order} onSubmitted={refresh} />
    </span>
  );
}

const paidAt = (order: OrderRow) =>
  Date.parse(order.ordered_at ?? order.created_at) || 0;

const column = createDataTableColumnHelper<OrderRow>();
const columns = column.columns([
  column.accessor(paidAt, {
    id: "date",
    header: "Date",
    cell: ({ row }) =>
      dateFormat.short(row.original.ordered_at ?? row.original.created_at) ||
      UNKNOWN,
    sortFn: "basic",
    enableHiding: false,
  }),
  column.accessor((row) => row.product_name ?? "", {
    id: "item",
    header: "Item",
    cell: ({ getValue }) => getValue() || "Rext AI plan",
    sortFn: "text",
  }),
  column.accessor((row) => row.total, {
    id: "amount",
    header: "Amount",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => formatAmount(row.original.total, row.original.currency),
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
  column.accessor((row) => row.status, {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusCell order={row.original} />,
    enableGlobalFilter: false,
  }),
  column.display({
    id: "actions",
    header: () => <span className="sr-only">Receipt and refund</span>,
    meta: { align: "end" },
    cell: ({ row }) => <Actions order={row.original} />,
  }),
]);

/**
 * Account settings, Invoices (plans/app/F-billing.md F5): every payment, newest first, with its
 * receipt (printable, and downloadable as a PDF) and the refund request under the refund rule. A
 * refund shows on its payment's row; the money moves through Lemon Squeezy.
 */
export function InvoicesTable() {
  const state = useDataTableUrlState(invoiceListParams);
  const orders = useQuery(subscriptionQueries.orders());

  return (
    <DataTable
      caption="Invoices"
      columns={columns}
      data={orders.data?.orders ?? []}
      getRowId={(row) => row.id}
      getRowLabel={(row) =>
        `${row.product_name ?? "Payment"}, ${dateFormat.short(row.ordered_at ?? row.created_at)}`
      }
      state={state}
      isLoading={orders.isPending}
      error={
        orders.isError ? (
          <Notice tone="danger" title="Your invoices didn't load">
            Refresh the page to try again.
          </Notice>
        ) : undefined
      }
      emptyState={
        <EmptyState
          title="No invoices yet"
          description="Each payment shows here with its receipt."
          action={{ label: "See the plans", href: "/pricing" }}
        />
      }
      pageSizeOptions={[25, 50]}
      renderCard={(order) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">
                {order.product_name ?? "Rext AI plan"}
              </span>
              <span className="text-muted-foreground">
                {dateFormat.short(order.ordered_at ?? order.created_at)}
              </span>
            </span>
            <span className="num shrink-0 font-medium">
              {formatAmount(order.total, order.currency)}
            </span>
          </div>
          <StatusCell order={order} />
          <Actions order={order} />
        </div>
      )}
    />
  );
}
