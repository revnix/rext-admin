"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuditLogsTable } from "@/components/admin/audit/audit-logs-table";
import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorPage } from "@/components/ui/error-states";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api-client";
import { ADMIN_PERMISSIONS } from "@/lib/permissions";

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [perPage] = useState(50);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string | null>(
    null,
  );
  const debouncedSearch = useDebounce(search, 300);

  // Fetch audit logs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "audit-logs",
      page,
      perPage,
      debouncedSearch,
      actionFilter,
      resourceTypeFilter,
    ],
    queryFn: async () => {
      return apiClient.auditLogs.getAllLogs({
        offset: page * perPage,
        limit: perPage,
        user_email: debouncedSearch || undefined,
        action: actionFilter || undefined,
        resource_type: resourceTypeFilter || undefined,
      });
    },
  });

  if (error) {
    return (
      <ErrorPage
        title="Failed to load audit logs"
        message="Audit log data could not be loaded. Please check your connection and try again."
        retry={() => void refetch()}
      />
    );
  }

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const handleExport = async (format: "csv" | "json") => {
    try {
      const blob = await apiClient.auditLogs.downloadLogs({
        format,
        user_email: debouncedSearch || undefined,
        action: actionFilter || undefined,
        resource_type: resourceTypeFilter || undefined,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_logs_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Audit logs exported as ${format.toUpperCase()}`);
    } catch (_error) {
      toast.error("Failed to export audit logs");
    }
  };

  return (
    <PageLayout
      title="Audit Logs"
      description="View and export all admin actions and system events"
      actions={
        <PermissionGuard permission={ADMIN_PERMISSIONS.AUDIT_READ}>
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")}>
            <FileText className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </PermissionGuard>
      }
    >
      <AdminGuard>
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find specific audit log entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search by email */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-4">
              <Select
                value={actionFilter || "all"}
                onValueChange={(value) =>
                  setActionFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user.">User Actions</SelectItem>
                  <SelectItem value="workspace.">Workspace Actions</SelectItem>
                  <SelectItem value="content.">Content Actions</SelectItem>
                  <SelectItem value="subscription.">
                    Subscription Actions
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={resourceTypeFilter || "all"}
                onValueChange={(value) =>
                  setResourceTypeFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="workspace">Workspace</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                </SelectContent>
              </Select>

              {(actionFilter || resourceTypeFilter || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActionFilter(null);
                    setResourceTypeFilter(null);
                    setSearch("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Audit Trail ({total.toLocaleString()} entries)
            </CardTitle>
            <CardDescription>
              {totalPages > 0 && `Page ${page + 1} of ${totalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogsTable
              logs={logs as any}
              isLoading={isLoading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onRefresh={refetch}
            />
          </CardContent>
        </Card>
      </AdminGuard>
    </PageLayout>
  );
}
