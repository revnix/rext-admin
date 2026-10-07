"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  createDataTableColumnHelper,
  DataTable,
  UNKNOWN,
} from "@/components/ui/data-table";
import { dateFormat } from "@/lib/formatters/date-formatters";

interface RecentSubscription {
  subscription_id: string;
  user_email_masked: string;
  user_name: string;
  plan_name: string;
  status: string;
  start_date: string | null;
}

interface RecentSubscriptionsTableProps {
  subscriptions: RecentSubscription[];
}

const STATUS_TINT: Readonly<Record<string, BadgeProps["variant"]>> = {
  active: "success",
  trial: "info",
  cancelled: "danger",
};

const column = createDataTableColumnHelper<RecentSubscription>();

const columns = column.columns([
  column.accessor("user_name", {
    header: "User",
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue()}</span>
    ),
  }),
  column.accessor("user_email_masked", { header: "Email" }),
  column.accessor("plan_name", { header: "Plan" }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge variant={STATUS_TINT[status] ?? "neutral"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  }),
  column.accessor((sub) => Date.parse(sub.start_date ?? "") || 0, {
    id: "start_date",
    header: "Start date",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => dateFormat.short(row.original.start_date) || UNKNOWN,
    sortFn: "basic",
  }),
]);

/** The latest activations, inside the subscriptions page's card. */
export function RecentSubscriptionsTable({
  subscriptions,
}: RecentSubscriptionsTableProps) {
  return (
    <DataTable
      caption="Recent subscriptions"
      columns={columns}
      data={subscriptions}
      getRowId={(sub) => sub.subscription_id}
      getRowLabel={(sub) => sub.user_name}
      surface="plain"
      density="compact"
      pageSizeOptions={[10]}
      emptyState={
        <p className="py-8 text-center text-sm text-muted-foreground">
          No subscription activations yet.
        </p>
      }
    />
  );
}
