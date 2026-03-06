"use client";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/types/data-table";

interface Subscription extends Record<string, unknown> {
  subscription_id: string;
  user_email_masked: string;
  user_name: string;
  plan_name: string;
  status: string;
  start_date: string | null;
  formatted_date: string;
}

interface RecentSubscriptionsTableProps {
  subscriptions: Array<{
    subscription_id: string;
    user_email_masked: string;
    user_name: string;
    plan_name: string;
    status: string;
    start_date: string | null;
  }>;
}

export function RecentSubscriptionsTable({
  subscriptions,
}: RecentSubscriptionsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      active: "default",
      trial: "secondary",
      cancelled: "destructive",
      expired: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Transform data for DataTable
  const tableData: Subscription[] = subscriptions.map((sub) => ({
    ...sub,
    id: sub.subscription_id,
    formatted_date: formatDate(sub.start_date),
  }));

  // Define columns
  const columns: Column<Subscription>[] = [
    {
      key: "user_name",
      header: "User",
      width: "200px",
      cell: (value) => <span className="font-medium">{value as string}</span>,
      searchable: true,
    },
    {
      key: "user_email_masked",
      header: "Email",
      width: "250px",
      searchable: true,
    },
    {
      key: "plan_name",
      header: "Plan",
      width: "150px",
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (value) => getStatusBadge(value as string),
    },
    {
      key: "formatted_date",
      header: "Start Date",
      width: "150px",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tableData}
      emptyTitle="No recent subscriptions"
      emptyDescription="No subscription activations found"
      showSearch={false}
      pageSize={10}
      pageSizeOptions={[10]}
      tableId="recent-subscriptions"
    />
  );
}
