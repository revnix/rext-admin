"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";

interface ErrorLog {
  id: string;
  timestamp: string;
  severity: string;
  message: string;
  source?: string;
  user_id?: string;
  request_id?: string;
  stack_trace?: string;
  metadata?: Record<string, unknown>;
  resolved: boolean;
  resolved_at?: string;
}

interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface ErrorLogsTableProps {
  logs: ErrorLog[];
  pagination?: Pagination;
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  filters: {
    severity?: string;
    start_date?: string;
    end_date?: string;
  };
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: {
    severity?: string;
    start_date?: string;
    end_date?: string;
  }) => void;
  onRefresh: () => void;
}

export function ErrorLogsTable({
  logs,
  pagination,
  isLoading,
  isError = false,
  error,
  filters,
  onPageChange,
  onFiltersChange,
  onRefresh,
}: ErrorLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

  const resolveMutation = useMutation({
    mutationFn: async (logId: string) => {
      return await apiClient.request(
        `/api/v1/admin/monitoring/error-logs/${logId}/resolve`,
        {
          method: "PATCH",
        },
      );
    },
    onSuccess: () => {
      toast.success("Error marked as resolved");
      setSelectedLog(null);
      onRefresh();
    },
    onError: () => {
      toast.error("Failed to resolve error");
    },
  });

  const getSeverityBadge = (severity: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive";
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      critical: { variant: "destructive", icon: XCircle },
      error: { variant: "destructive", icon: AlertTriangle },
      warning: { variant: "secondary", icon: AlertTriangle },
    };

    const config = variants[severity] || {
      variant: "secondary",
      icon: AlertTriangle,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => `error-skeleton-${i}`).map(
          (key) => (
            <Skeleton key={key} className="h-12 w-full" />
          ),
        )}
      </div>
    );
  }

  if (isError) {
    const message =
      (error instanceof Error && error.message) ||
      "Unable to load error logs from the server.";
    return (
      <div className="rounded-md border">
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-destructive opacity-70" />
          <p className="font-medium text-foreground">
            Failed to load error logs
          </p>
          <p className="text-sm mb-4">{message}</p>
          <Button variant="outline" size="sm" onClick={() => onRefresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={filters.severity || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              severity: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
          </SelectContent>
        </Select>

        {Object.keys(filters).length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onFiltersChange({})}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border w-full overflow-x-auto">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600 opacity-50" />
            <p>No errors found</p>
            <p className="text-sm">System is running smoothly</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="max-w-sm">
                    <div className="truncate">{log.message}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {log.source || "N/A"}
                  </TableCell>
                  <TableCell>
                    {log.resolved ? (
                      <Badge
                        variant="outline"
                        className="gap-1 text-green-600 border-green-600"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline">Open</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.per_page + 1} to{" "}
            {Math.min(pagination.page * pagination.per_page, pagination.total)}{" "}
            of {pagination.total} errors
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

      {/* Error Detail Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Error Details</DialogTitle>
              <DialogDescription>
                {formatDate(selectedLog.timestamp)} •{" "}
                {selectedLog.source || "Unknown source"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Severity</div>
                <div className="mt-1">
                  {getSeverityBadge(selectedLog.severity)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Message</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedLog.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Timestamp</div>
                  <p className="mt-1 text-muted-foreground">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Status</div>
                  <p className="mt-1 text-muted-foreground">
                    {selectedLog.resolved
                      ? `Resolved${
                          selectedLog.resolved_at
                            ? ` · ${new Date(
                                selectedLog.resolved_at,
                              ).toLocaleString()}`
                            : ""
                        }`
                      : "Open"}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Source</div>
                  <p className="mt-1 text-muted-foreground font-mono break-all">
                    {selectedLog.source || "N/A"}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Request ID</div>
                  <p className="mt-1 text-muted-foreground font-mono break-all">
                    {selectedLog.request_id || "N/A"}
                  </p>
                </div>
                {selectedLog.user_id && (
                  <div>
                    <div className="font-medium">User ID</div>
                    <p className="mt-1 text-muted-foreground font-mono break-all">
                      {selectedLog.user_id}
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.stack_trace && (
                <div>
                  <div className="text-sm font-medium">Stack Trace</div>
                  <pre className="mt-1 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    {selectedLog.stack_trace}
                  </pre>
                </div>
              )}

              {selectedLog.metadata &&
                Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <div className="text-sm font-medium">Metadata</div>
                    <pre className="mt-1 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

              <div className="flex items-center gap-4 pt-4">
                {!selectedLog.resolved && (
                  <Button
                    onClick={() => resolveMutation.mutate(selectedLog.id)}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
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
