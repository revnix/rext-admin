"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  type AuditLog,
  AuditLogsTable,
} from "@/components/admin/audit/audit-logs-table";
import { ListPage } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDataTableUrlState } from "@/components/ui/data-table";
import { Notice } from "@/components/ui/notice";
import { usePermission } from "@/hooks/use-permission";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api-client";
import { AUDIT_PERMISSIONS } from "@/lib/permissions";
import {
  ADMIN_AUDIT_LOGS_FACETS,
  adminAuditLogsParams,
} from "@/lib/search-params/admin-audit-logs";

const NO_LOGS: AuditLog[] = [];

export default function AuditLogsPage() {
  // The search, the filters and the page live in the URL; the server applies them.
  const tableState = useDataTableUrlState(adminAuditLogsParams, {
    facets: ADMIN_AUDIT_LOGS_FACETS,
  });
  const { pageIndex, pageSize } = tableState.pagination;
  const debouncedSearch = useDebounce(tableState.globalFilter, 300);
  const facetValue = (id: string) => {
    const value = tableState.columnFilters.find((f) => f.id === id)?.value;
    return Array.isArray(value) ? (value[0] as string | undefined) : undefined;
  };
  const actionArea = facetValue("action");
  const resourceTypeFilter = facetValue("resource");
  const canReadAuditLogs = usePermission(AUDIT_PERMISSIONS.READ);

  // The list and its export ask with the same filters; the backend matches
  // an action by its prefix, so the user area is "user.".
  const filters = {
    user_email: debouncedSearch || undefined,
    action: actionArea ? `${actionArea}.` : undefined,
    resource_type: resourceTypeFilter,
  };

  // Fetch audit logs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "audit-logs",
      pageIndex,
      pageSize,
      debouncedSearch,
      actionArea,
      resourceTypeFilter,
    ],
    queryFn: () =>
      apiClient.auditLogs.getAllLogs({
        offset: pageIndex * pageSize,
        limit: pageSize,
        ...filters,
      }),
    enabled: canReadAuditLogs,
  });

  if (error) {
    return (
      <ListPage
        title="Audit Logs"
        description="View and export all admin actions and system events"
      >
        <Notice
          tone="danger"
          title="Failed to load audit logs"
          action={
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          Audit log data could not be loaded. Please check your connection and
          try again.
        </Notice>
      </ListPage>
    );
  }

  const logs: AuditLog[] = data?.logs ?? NO_LOGS;
  const total = data?.total || 0;

  const handleExport = async (format: "csv" | "json") => {
    try {
      const blob = await apiClient.auditLogs.downloadLogs({
        format,
        ...filters,
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
    <ListPage
      title="Audit Logs"
      description="View and export all admin actions and system events"
      actions={
        <PermissionGuard permission={AUDIT_PERMISSIONS.EXPORT}>
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
      <PermissionGuard
        permission={AUDIT_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view audit logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded-md">
                  audit.read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Audit Trail ({total.toLocaleString()} entries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogsTable
              logs={logs}
              total={total}
              isLoading={isLoading}
              state={tableState}
            />
          </CardContent>
        </Card>
      </PermissionGuard>
    </ListPage>
  );
}
