"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { useState } from "react";
import { CustomerDetailDrawer } from "@/components/admin/customers/customer-detail-drawer";
import { CustomerFilters } from "@/components/admin/customers/customer-filters";
import { CustomerListTable } from "@/components/admin/customers/customer-list-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api-client";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const debouncedSearch = useDebounce(search, 300);

  // Fetch customers
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "admin",
      "customers",
      page,
      perPage,
      debouncedSearch,
      status,
      planId,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (status) params.append("status", status);
      if (planId) params.append("plan_id", planId);

      return apiClient.request<{
        data: any[];
        pagination: any;
      }>(`/api/v1/admin/customers?${params.toString()}`);
    },
  });

  const customers = data?.data || [];
  const pagination = data?.pagination;

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleCloseDrawer = () => {
    setSelectedCustomerId(null);
    refetch(); // Refresh list after drawer closes
  };

  const handleExport = async () => {};

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage users, subscriptions, and customer support
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find customers by name, email, subscription status, or plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <CustomerFilters
            status={status}
            planId={planId}
            onStatusChange={setStatus}
            onPlanIdChange={setPlanId}
          />
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({pagination?.total || 0})</CardTitle>
          <CardDescription>
            {pagination &&
              `Page ${pagination.page} of ${pagination.total_pages}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerListTable
            customers={customers}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={setPage}
            onCustomerClick={handleCustomerClick}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
            }}
          />
        </CardContent>
      </Card>

      {/* Customer Detail Drawer */}
      {selectedCustomerId && (
        <CustomerDetailDrawer
          customerId={selectedCustomerId}
          open={!!selectedCustomerId}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  );
}
