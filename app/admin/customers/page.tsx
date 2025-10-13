"use client";

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { CustomerDetailDrawer } from "@/components/admin/customers/customer-detail-drawer";
import { CustomerListTable } from "@/components/admin/customers/customer-list-table";
import { ListPage } from "@/components/layouts/list-page";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

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
    <ListPage
      title="Customer Management"
      description="Manage users, subscriptions, and customer support"
      actions={
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
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
    </ListPage>
  );
}
