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
import type { AuditLogFilters } from "@/types/audit-log";
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
    queryKey: ["audit-logs", filters],
    queryFn: () =>
      apiClient.auditLogs.getMyLogs({
        action: filters.action,
        start_date: filters.date_from,
        end_date: filters.date_to,
        limit: filters.limit,
        offset: filters.offset,
      }),
    refetchInterval: 60000,
  });

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      offset: 0, // Reset to first page when filtering
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

  const logs = auditData?.logs || [];
  const currentPage = Math.floor((filters.offset || 0) / ITEMS_PER_PAGE) + 1;
  const totalPages = Math.ceil((auditData?.total || 0) / ITEMS_PER_PAGE);

  return (
    <Tabs defaultValue="all" className="space-y-6">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="logins">Login History</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <DownloadAuditLog filters={filters} />
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </div>

      {/* All Activity Tab */}
      <TabsContent value="all" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Complete history of account activity and security events
            </CardDescription>
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
                  resultsCount={auditData?.total}
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
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  Failed to load activity log: {auditError.message}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!auditLoading && !auditError && logs.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center">
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
                    className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-full bg-muted p-2 mt-0.5">
                          <Monitor className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
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

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(log.created_at as any)}
                            </span>
                            {log.ip_address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {log.ip_address}
                              </span>
                            )}
                          </div>

                          {log.user_agent && (
                            <p className="text-xs text-muted-foreground truncate">
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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(filters.offset || 0) + 1} to{" "}
                    {Math.min(
                      (filters.offset || 0) + ITEMS_PER_PAGE,
                      auditData?.total || 0,
                    )}{" "}
                    of {auditData?.total || 0} activities
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange("prev")}
                      disabled={(filters.offset || 0) === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
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
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Login History
            </CardTitle>
            <CardDescription>
              Recent successful and failed login attempts
            </CardDescription>
          </CardHeader>

          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : historyError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  Failed to load login history: {historyError.message}
                </p>
              </div>
            ) : loginHistory ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <LogIn className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Total Logins
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      {loginHistory.total_count}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Last Login
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {loginHistory.history[0]?.created_at
                        ? formatTimestamp(
                            loginHistory.history[0]?.created_at as any,
                          )
                        : "Never"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Failed Attempts
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      {loginHistory.history.filter((h) => !h.success).length}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Recent Login Events */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Login Activity</p>
                  {loginHistory.history.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        No login history available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {loginHistory.history.map((event) => (
                        <div
                          key={event.created_at}
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-full p-2 ${
                                event.success
                                  ? "bg-green-100 dark:bg-green-950"
                                  : "bg-red-100 dark:bg-red-950"
                              }`}
                            >
                              {event.success ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
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
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatLoginEventTime(
                                    event.created_at as any,
                                  )}
                                </span>
                                {event.ip_address && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.ip_address}
                                  </span>
                                )}
                              </div>
                              {event.browser && (
                                <p className="text-xs text-muted-foreground truncate max-w-md">
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
