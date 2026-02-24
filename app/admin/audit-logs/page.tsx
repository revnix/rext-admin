"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuditLogsTable } from "@/components/admin/audit/audit-logs-table";
import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
import { CanAccess } from "@/components/permissions/can-access";
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
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api-client";
import { ADMIN_PERMISSIONS } from "@/lib/permissions";
import { buildUrl } from "@/lib/url-utils";
import { authenticatedFetch } from "@/lib/auth-utils";
import { useSession } from "next-auth/react";

export default function AuditLogsPage() {
  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Audit Logs" },
  ];

  const [page, setPage] = useState(0);
  const [perPage] = useState(50);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string | null>(
    null,
  );
  const { data: session } = useSession();
  const debouncedSearch = useDebounce(search, 300);

  // Fetch audit logs
  const { data, isLoading, refetch } = useQuery({
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

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const handleExport = async (format: "csv" | "json") => {
    try {
      const endpoint = buildUrl(`/api/v1/audit/logs/export/download`, {
        format,
        user_email: debouncedSearch || undefined,
        action: actionFilter || undefined,
        resource_type: resourceTypeFilter || undefined,
      });

      const response = await authenticatedFetch(endpoint, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_logs_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Audit logs exported as ${format.toUpperCase()}`);
    } catch (_error) {
      toast.error("Failed to export audit logs");
    }
  };

  return (
    <PageLayout
      title="Audit Logs"
      description="View and export all admin actions and system events"
      breadcrumbs={breadcrumbs}
      actions={
        <CanAccess permission={ADMIN_PERMISSIONS.AUDIT_READ}>
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")}>
            <FileText className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </CanAccess>
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
              logs={logs}
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
