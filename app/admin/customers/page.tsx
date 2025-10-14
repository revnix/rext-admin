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
import { apiClient } from "@/lib/api-client";
import { PERMISSIONS } from "@/lib/permissions";

export default function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Customer Management" },
  ];

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
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      return apiClient.request<{
        data: CustomerResponse[];
      }>(`/api/v1/admin/customers`);
    },
  });

  const customers = data?.data || [];

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleCloseDrawer = () => {
    setSelectedCustomerId(null);
    refetch(); // Refresh list after drawer closes
  };

  const handleExport = async () => {
    // TODO: Implement CSV export
  };

  return (
    <PageLayout
      title="Customer Management"
      description="Manage users, subscriptions, and customer support"
      breadcrumbs={breadcrumbs}
      actions={
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      }
    >
      <CanAccess
        permission={PERMISSIONS.USER_READ}
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
