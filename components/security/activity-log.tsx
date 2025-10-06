"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  MapPin,
  Monitor,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import type { AuditLogFilters } from "@/types/audit-log";
import {
  AuditActions,
  AuditResourceTypes,
  getActionDisplayName,
  getActionVariant,
} from "@/types/audit-log";

const ITEMS_PER_PAGE = 20;

export function ActivityLog() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit logs
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () =>
      apiClient.auditLogs.getMyLogs({
        action: filters.action,
        start_date: filters.date_from,
        end_date: filters.date_to,
        limit: filters.limit,
        offset: filters.offset,
      }),
    refetchInterval: 60000, // Refresh every minute
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

  const hasActiveFilters =
    filters.action ||
    filters.resource_type ||
    filters.date_from ||
    filters.date_to;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Failed to load activity log: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const logs = data?.logs || [];
  const currentPage = Math.floor((filters.offset || 0) / ITEMS_PER_PAGE) + 1;
  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Recent account activity and security events
            </CardDescription>
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <>
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    htmlFor="action-filter"
                    className="text-sm font-medium"
                  >
                    Action Type
                  </label>
                  <Select
                    value={filters.action || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("action", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      <Separator className="my-1" />
                      <SelectItem value={AuditActions.AUTH_LOGIN}>
                        Login
                      </SelectItem>
                      <SelectItem value={AuditActions.AUTH_LOGOUT}>
                        Logout
                      </SelectItem>
                      <SelectItem value={AuditActions.AUTH_PASSWORD_CHANGE}>
                        Password Changed
                      </SelectItem>
                      <SelectItem value={AuditActions.AUTH_PASSWORD_RESET}>
                        Password Reset
                      </SelectItem>
                      <Separator className="my-1" />
                      <SelectItem value={AuditActions.USER_UPDATE}>
                        Profile Updated
                      </SelectItem>
                      <SelectItem value={AuditActions.USER_DEACTIVATE}>
                        Account Deactivated
                      </SelectItem>
                      <Separator className="my-1" />
                      <SelectItem value={AuditActions.WORKSPACE_CREATE}>
                        Workspace Created
                      </SelectItem>
                      <SelectItem value={AuditActions.WORKSPACE_UPDATE}>
                        Workspace Updated
                      </SelectItem>
                      <SelectItem value={AuditActions.INVITATION_CREATE}>
                        Invitation Sent
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="resource-filter"
                    className="text-sm font-medium"
                  >
                    Resource Type
                  </label>
                  <Select
                    value={filters.resource_type || "all"}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "resource_type",
                        value === "all" ? "" : value,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All resources</SelectItem>
                      <Separator className="my-1" />
                      <SelectItem value={AuditResourceTypes.USER}>
                        User
                      </SelectItem>
                      <SelectItem value={AuditResourceTypes.WORKSPACE}>
                        Workspace
                      </SelectItem>
                      <SelectItem value={AuditResourceTypes.INVITATION}>
                        Invitation
                      </SelectItem>
                      <SelectItem value={AuditResourceTypes.SUBSCRIPTION}>
                        Subscription
                      </SelectItem>
                      <SelectItem value={AuditResourceTypes.SESSION}>
                        Session
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {data?.total || 0} results found
                  </p>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-3 w-3" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Activity List */}
        {logs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No activity found matching your filters"
                : "No activity recorded yet"}
            </p>
          </div>
        ) : (
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
                  data?.total || 0,
                )}{" "}
                of {data?.total || 0} activities
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
                  disabled={!data?.has_more}
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
  );
}
