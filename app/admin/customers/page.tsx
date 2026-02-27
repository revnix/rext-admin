"use client";

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { CustomerDetailDrawer } from "@/components/admin/customers/customer-detail-drawer";
import { CustomerListTable } from "@/components/admin/customers/customer-list-table";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorPage } from "@/components/ui/error-states";
import { apiClient } from "@/lib/api-client";
import { USER_PERMISSIONS } from "@/lib/permissions";

export default function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  interface CustomerResponse {
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

  // Fetch all customers (filtering/pagination handled by DataTable)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      return apiClient.request<{
        data: CustomerResponse[];
      }>(`/api/v1/admin/customers`);
    },
  });

  if (error) {
    return (
      <ErrorPage
        title="Failed to load customers"
        message="Customer data is currently unavailable. Please try again later."
        retry={() => void refetch()}
      />
    );
  }

  const customers = data?.data || [];

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleCloseDrawer = () => {
    setSelectedCustomerId(null);
    refetch(); // Refresh list after drawer closes
  };

  const handleExport = async () => {
    if (!customers || customers.length === 0) {
      return;
    }

    // Prepare CSV headers
    const headers = [
      "ID",
      "Username",
      "Email",
      "Status",
      "Subscription",
      "Created At",
    ];

    // Convert customers to CSV rows
    const rows = customers.map((customer) => [
      customer.user_id,
      customer.name || "",
      customer.email || "",
      customer.is_active ? "active" : "inactive",
      customer.subscription?.plan_name || "free",
      customer.created_at
        ? new Date(customer.created_at).toISOString().split("T")[0]
        : "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `customers-export-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageLayout
      title="Customer Management"
      description="Manage users, subscriptions, and customer support"
      actions={
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      }
    >
      <CanAccess
        permission={USER_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view customer management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">user.read</code>
              </p>
            </CardContent>
          </Card>
        }
      >
        {/* Customer List */}
        <CustomerListTable
          customers={customers}
          isLoading={isLoading}
          onCustomerClick={handleCustomerClick}
        />

        {/* Customer Detail Drawer */}
        {selectedCustomerId && (
          <CustomerDetailDrawer
            customerId={selectedCustomerId}
            open={!!selectedCustomerId}
            onClose={handleCloseDrawer}
          />
        )}
      </CanAccess>
    </PageLayout>
  );
}
