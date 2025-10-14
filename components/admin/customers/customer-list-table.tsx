"use client";

import { Eye } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { Column, RowAction } from "@/types/data-table";

interface Customer {
  user_id: string;
  name: string;
  email: string;
  subscription: {
    plan_name: string;
    status: string;
    mrr: number;
  } | null;
  workspaces_count: number;
  is_active: boolean;
  created_at: string | null;
  last_active: string | null;
}

interface CustomerData extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  mrr: number;
  workspaces_count: number;
  created_at: string;
  last_active: string;
  account_status: string;
}

interface CustomerListTableProps {
  customers: Customer[];
  isLoading: boolean;
  onCustomerClick: (customerId: string) => void;
}

export function CustomerListTable({
  customers,
  isLoading,
  onCustomerClick,
}: CustomerListTableProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

  // Transform customers data for DataTable
  const tableData: CustomerData[] = customers.map((customer) => ({
    id: customer.user_id,
    name: customer.name,
    email: customer.email,
    plan: customer.subscription?.plan_name || "Free",
    status: customer.subscription?.status || "free",
    mrr: customer.subscription?.mrr || 0,
    workspaces_count: customer.workspaces_count,
    created_at: formatDate(customer.created_at),
    last_active: formatDate(customer.last_active),
    account_status: customer.is_active ? "active" : "inactive",
  }));

  // Define columns
  const columns: Column<CustomerData>[] = [
    {
      key: "name",
      header: "Name",
      width: "200px",
      cell: (value) => <span className="font-medium">{value as string}</span>,
      searchable: true,
    },
    {
      key: "email",
      header: "Email",
      width: "250px",
      cell: (value) => (
        <span className="text-muted-foreground">{value as string}</span>
      ),
      searchable: true,
    },
    {
      key: "plan",
      header: "Plan",
      width: "120px",
      cell: (value) => {
        const plan = value as string;
        return plan === "Free" ? (
          <span className="text-sm text-muted-foreground">{plan}</span>
        ) : (
          <span className="text-sm">{plan}</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (value) => {
        const status = value as string;
        return status === "free" ? (
          <Badge variant="outline">Free</Badge>
        ) : (
          getStatusBadge(status)
        );
      },
    },
    {
      key: "mrr",
      header: "MRR",
      width: "100px",
      cell: (value) => {
        const mrr = value as number;
        return mrr > 0 ? (
          <span className="font-medium text-right block">
            {formatCurrency(mrr)}
          </span>
        ) : (
          <span className="text-muted-foreground text-right block">-</span>
        );
      },
    },
    {
      key: "workspaces_count",
      header: "Workspaces",
      width: "100px",
      cell: (value) => (
        <div className="text-center">
          <Badge variant="secondary">{value as number}</Badge>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      width: "120px",
      cell: (value) => <span className="text-sm">{value as string}</span>,
    },
    {
      key: "last_active",
      header: "Last Active",
      width: "120px",
      cell: (value) => <span className="text-sm">{value as string}</span>,
    },
    {
      key: "account_status",
      header: "Account",
      width: "100px",
      cell: (value) => {
        const status = value as string;
        return (
          <div className="text-center">
            {status === "active" ? (
              <Badge variant="default" className="bg-green-600">
                Active
              </Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
        );
      },
    },
  ];

  // Define row actions
  const rowActions: RowAction<CustomerData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => onCustomerClick(row.id),
      primary: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tableData}
      isLoading={isLoading}
      rowActions={rowActions}
      onRowClick={(row) => onCustomerClick(row.id)}
      emptyTitle="No customers found"
      emptyDescription="No customers match your current filters. Try adjusting your search or filters."
      searchPlaceholder="Search by name or email..."
      searchFields={["name", "email"]}
      pageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      tableId="admin-customers"
    />
  );
}
