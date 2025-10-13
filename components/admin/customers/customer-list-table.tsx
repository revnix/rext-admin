"use client";

import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface CustomerListTableProps {
  customers: Customer[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onCustomerClick: (customerId: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string, order: "asc" | "desc") => void;
}

export function CustomerListTable({
  customers,
  pagination,
  isLoading,
  onPageChange,
  onCustomerClick,
  sortBy,
  sortOrder,
  onSort,
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      onSort(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "desc");
    }
  };

  const SortButton = ({ field, label }: { field: string; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 -ml-3"
    >
      {label}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No customers found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="display_name" label="Name" />
              </TableHead>
              <TableHead>
                <SortButton field="email" label="Email" />
              </TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="text-center">Workspaces</TableHead>
              <TableHead>
                <SortButton field="created_at" label="Created" />
              </TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-center">Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.user_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onCustomerClick(customer.user_id)}
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.email}
                </TableCell>
                <TableCell>
                  {customer.subscription ? (
                    <span className="text-sm">
                      {customer.subscription.plan_name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Free</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.subscription ? (
                    getStatusBadge(customer.subscription.status)
                  ) : (
                    <Badge variant="outline">Free</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {customer.subscription ? (
                    <span className="font-medium">
                      {formatCurrency(customer.subscription.mrr)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{customer.workspaces_count}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(customer.created_at)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(customer.last_active)}
                </TableCell>
                <TableCell className="text-center">
                  {customer.is_active ? (
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.per_page + 1} to{" "}
            {Math.min(pagination.page * pagination.per_page, pagination.total)}{" "}
            of {pagination.total} customers
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {pagination.page} of {pagination.total_pages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
