"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  History,
  Loader2,
  LogIn,
  MapPin,
  Monitor,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { ActivityFilter } from "@/components/security/activity-filter";
import { DownloadAuditLog } from "@/components/security/download-audit-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissionUser } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type { AuditLogFilters, AuditLog } from "@/types/audit-log";
import { getActionDisplayName, getActionVariant } from "@/types/audit-log";

const ITEMS_PER_PAGE = 20;

export function UnifiedActivity() {
  const user = usePermissionUser();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });

  // Fetch login history
  const {
    data: loginHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ["login-history", user?.id],
    queryFn: () => apiClient.security.getLoginHistory(),
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  // Fetch audit logs
  const {
    data: auditData,
    isLoading: auditLoading,
    error: auditError,
  } = useQuery({
    queryKey: [
      "audit-logs",
      filters.action ?? null,
      filters.status ?? null,
      filters.resource_type ?? null,
      filters.date_from ?? null,
      filters.date_to ?? null,
      filters.limit ?? null,
      filters.offset ?? null,
    ],
    queryFn: () =>
      apiClient.auditLogs.getMyLogs({
        action: filters.action,
        status: filters.status,
        resource_type: filters.resource_type,
        date_from: filters.date_from,
        date_to: filters.date_to,
        limit: filters.limit,
        offset: filters.offset,
      }),
    refetchInterval: 60000,
  });

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      offset: 0,
    }));
  };

  const clearFilters = () => {
    setFilters({
      limit: ITEMS_PER_PAGE,
      offset: 0,
    });
  };

  const handlePageChange = (direction: "prev" | "next") => {
    setFilters((prev) => ({
      ...prev,
      offset:
        direction === "next"
          ? (prev.offset || 0) + ITEMS_PER_PAGE
          : Math.max(0, (prev.offset || 0) - ITEMS_PER_PAGE),
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)} days ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLoginEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasActiveFilters = !!(
    filters.action ||
    filters.resource_type ||
    filters.status ||
    filters.date_from ||
    filters.date_to
  );

  let logs = (auditData?.logs as unknown as AuditLog[]) || [];
  logs = logs.filter((log) => log.resource_type !== "notification_preferences");

  if (filters.action && filters.action !== "all") {
    logs = logs.filter((log) => log.action === filters.action);
  }
  if (filters.resource_type && filters.resource_type !== "all") {
    logs = logs.filter((log) => log.resource_type === filters.resource_type);
  }
  if (filters.status && filters.status !== "all") {
    logs = logs.filter(
      (log) => log.status?.toLowerCase() === filters.status?.toLowerCase(),
    );
  }
  if (filters.date_from) {
    const fromDate = new Date(filters.date_from).getTime();
    logs = logs.filter((log) => new Date(log.created_at).getTime() >= fromDate);
  }
  if (filters.date_to) {
    const toDate = new Date(filters.date_to).getTime() + 86400000;
    logs = logs.filter((log) => new Date(log.created_at).getTime() < toDate);
  }

  const finalTotal = auditData?.total || 0;

  const currentPage = Math.floor((filters.offset || 0) / ITEMS_PER_PAGE) + 1;
  const totalPages = Math.ceil(finalTotal / ITEMS_PER_PAGE);

  return (
    <Tabs defaultValue="all" className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <TabsList className="w-full md:w-auto justify-start overflow-x-auto flex-nowrap shrink-0">
          <TabsTrigger value="all" className="min-w-fit">
            All Activity
          </TabsTrigger>
          <TabsTrigger value="logins" className="min-w-fit">
            Login History
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap items-center gap-2">
          <DownloadAuditLog filters={filters} />
        </div>
      </div>

      {/* All Activity Tab */}
      <TabsContent value="all" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  Complete history of account activity and security events
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            {showFilters && (
              <>
                <ActivityFilter
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                  resultsCount={finalTotal}
                />
                <Separator />
              </>
            )}

            {/* Loading State */}
            {auditLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {auditError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  Failed to load activity log: {auditError.message}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!auditLoading && !auditError && logs.length === 0 && (
              <div className="rounded-md border border-dashed p-8 text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "No activity found matching your filters"
                    : "No activity recorded yet"}
                </p>
              </div>
            )}

            {/* Activity List */}
            {!auditLoading && !auditError && logs.length > 0 && (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-md border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 min-w-0">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 flex-1">
                        <div className="rounded-full bg-muted p-2 mt-0.5">
                          <Monitor className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex justify-center sm:justify-start items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">
                              {getActionDisplayName(log.action)}
                            </p>
                            <Badge
                              variant={getActionVariant(log.action)}
                              className="text-xs"
                            >
                              {log.resource_type}
                            </Badge>
                            {log.status === "failed" && (
                              <Badge variant="destructive" className="text-xs">
                                Failed
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(log.created_at)}
                            </span>
                            {log.ip_address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {log.ip_address}
                              </span>
                            )}
                          </div>

                          {log.user_agent && (
                            <p className="text-xs text-center sm:text-start text-muted-foreground break-all line-clamp-2 mt-1">
                              {log.user_agent}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {logs.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground text-center md:text-left">
                    Showing {(filters.offset || 0) + 1} to{" "}
                    {Math.min(
                      (filters.offset || 0) + ITEMS_PER_PAGE,
                      finalTotal,
                    )}{" "}
                    of {finalTotal} activities
                  </p>
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto order-0 sm:order-0"
                      onClick={() => handlePageChange("prev")}
                      disabled={(filters.offset || 0) === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground order-2 sm:order-1">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto order-1 sm:order-2"
                      onClick={() => handlePageChange("next")}
                      disabled={!auditData?.has_more}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Login History Tab */}
      <TabsContent value="logins" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-center sm:justify-start items-center gap-2">
              <History className="h-5 w-5" />
              Login History
            </CardTitle>
            <CardDescription className="text-center sm:text-start">
              Recent successful and failed login attempts
            </CardDescription>
          </CardHeader>

          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : historyError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  Failed to load login history: {historyError.message}
                </p>
              </div>
            ) : loginHistory ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="flex justify-center sm:justify-start items-center gap-2 mb-1">
                      <LogIn className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Total Logins
                      </p>
                    </div>
                    <p className="text-2xl text-center sm:text-start font-bold">
                      {loginHistory.total_count}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex justify-center sm:justify-start items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Last Login
                      </p>
                    </div>
                    <p className="text-sm text-center sm:text-start font-medium">
                      {(loginHistory.history ?? [])[0]?.created_at
                        ? formatTimestamp(
                            (loginHistory.history ?? [])[0]?.created_at,
                          )
                        : "Never"}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex justify-center sm:justify-start items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Failed Attempts
                      </p>
                    </div>
                    <p className="text-2xl text-center sm:text-start font-bold">
                      {
                        (loginHistory.history ?? []).filter((h) => !h.success)
                          .length
                      }
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Recent Login Events */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Login Activity</p>
                  {(loginHistory.history ?? []).length === 0 ? (
                    <div className="rounded-md border border-dashed p-8 text-center">
                      <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        No login history available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(loginHistory.history ?? []).map((event) => (
                        <div
                          key={event.created_at}
                          className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <div className="p-2">
                              {event.success ? (
                                <TrendingUp className="h-4 w-4 text-success-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-danger-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex justify-center sm:justify-start items-center gap-2">
                                <p className="text-sm font-medium">
                                  {event.success
                                    ? "Successful Login"
                                    : "Failed Login Attempt"}
                                </p>
                                <Badge
                                  variant={
                                    event.success ? "default" : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {event.success ? "Success" : "Failed"}
                                </Badge>
                              </div>
                              <div className="flex justify-center sm:justify-start mt-2 sm:mt-0 items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatLoginEventTime(event.created_at)}
                                </span>
                                {event.ip_address && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.ip_address}
                                  </span>
                                )}
                              </div>
                              {event.browser && (
                                <p className="text-xs text-muted-foreground break-all line-clamp-2 mt-1">
                                  {event.browser}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
