"use client";

import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLog {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  workspace_id?: string | null;
  ip_address?: string | null;
  status?: string | null;
  created_at: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

interface AuditLogsTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export function AuditLogsTable({
  logs,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: AuditLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) status = "unknown";
    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive";
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      success: { variant: "default", icon: CheckCircle },
      failed: { variant: "destructive", icon: XCircle },
      partial: { variant: "secondary", icon: AlertCircle },
    };

    const { variant, icon: Icon } = config[status] || config.partial;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      impersonate: "bg-orange-100 text-orange-800",
    };

    const actionType = action.split(".").pop() || "";
    const color = colors[actionType] || "bg-gray-100 text-gray-800";

    return (
      <Badge className={color} variant="outline">
        {action}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => `audit-skeleton-${i}`).map(
          (key) => (
            <Skeleton key={key} className="h-12 w-full" />
          ),
        )}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Eye className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>No audit logs found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDate(log.created_at)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {log.full_name || "System"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.user_email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{log.resource_type}</div>
                    {log.resource_id && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {log.resource_id.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(log.status)}</TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">
                  {log.ip_address || "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                {formatDate(selectedLog.created_at)} •{" "}
                {selectedLog.user_email || "System"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Action</div>
                  <div className="mt-1">
                    {getActionBadge(selectedLog.action)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="mt-1">
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Resource Type</div>
                  <p className="mt-1 text-sm">{selectedLog.resource_type}</p>
                </div>
                <div>
                  <div className="text-sm font-medium">Resource ID</div>
                  <p className="mt-1 text-sm font-mono text-muted-foreground">
                    {selectedLog.resource_id || "N/A"}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium">IP Address</div>
                  <p className="mt-1 text-sm font-mono">
                    {selectedLog.ip_address || "N/A"}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium">Workspace ID</div>
                  <p className="mt-1 text-sm font-mono text-muted-foreground">
                    {selectedLog.workspace_id || "N/A"}
                  </p>
                </div>
              </div>

              {selectedLog.metadata &&
                Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <div className="text-sm font-medium">Metadata</div>
                    <pre className="mt-1 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

              {selectedLog.old_values &&
                Object.keys(selectedLog.old_values).length > 0 && (
                  <div>
                    <div className="text-sm font-medium">Old Values</div>
                    <pre className="mt-1 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

              {selectedLog.new_values &&
                Object.keys(selectedLog.new_values).length > 0 && (
                  <div>
                    <div className="text-sm font-medium">New Values</div>
                    <pre className="mt-1 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
