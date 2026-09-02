"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Server } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ErrorLogsTable } from "@/components/admin/monitoring/error-logs-table";
import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load UsageCharts component (uses recharts - heavy library ~400KB)
const UsageCharts = dynamic(
  () =>
    import("@/components/admin/monitoring/usage-charts").then(
      (mod) => mod.UsageCharts,
    ),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    ),
    ssr: false, // Charts don't need SSR
  },
);

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { buildUrl } from "@/lib/url-utils";

interface SystemHealthData {
  database: {
    status: string;
    response_time_ms: number;
    connection_count: number;
    connections_checked_in: number;
    connections_checked_out: number;
    pool_overflow: number;
    pool_size: number;
    max_overflow: number;
    max_connections: number;
  };
  cache: {
    status: string;
    enabled: boolean;
    keyspace_hits: number;
    keyspace_misses: number;
    hit_rate?: number;
    memory_used_mb?: number;
    memory_used_bytes: number;
    memory_max_mb: number;
    memory_used_percent: number;
    evicted_keys: number;
    expired_keys: number;
  };
  api: {
    status: string;
    requests_per_minute: number;
    avg_response_time_ms: number;
    error_rate: number;
  };
  workers: {
    status: string;
    active_jobs?: number;
    failed_jobs_24h?: number;
  };
  timestamp: string;
}

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

interface ErrorLogData {
  items: ErrorLog[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

interface UsageStatsData {
  period: string;
  api_calls: {
    total: number;
    by_endpoint: Array<{ endpoint: string; count: number }>;
  };
  content_generation: {
    total: number;
    successful: number;
    failed: number;
  };
  user_activity: {
    active_users: number;
    new_users: number;
    new_workspaces: number;
    sessions: number;
  };
}

interface UsageTrendsData {
  trends: Array<{
    date: string;
    content_created: number;
    active_users: number;
    workspaces_created: number;
  }>;
}

export default function MonitoringPage() {
  const [errorLogPage, setErrorLogPage] = useState(1);
  const [errorLogFilters, setErrorLogFilters] = useState<{
    severity?: string;
    start_date?: string;
    end_date?: string;
  }>({});
  const [usagePeriod, setUsagePeriod] = useState<
    "24_hours" | "7_days" | "30_days"
  >("24_hours");

  // Fetch system health
  const { data: healthData } = useQuery({
    queryKey: ["admin", "monitoring", "system-health"],
    queryFn: async () => {
      return apiClient.request<SystemHealthData>(
        "/api/v1/admin/monitoring/system-health",
      );
    },
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch error logs
  const {
    data: errorLogsData,
    isLoading: errorLogsLoading,
    isError: errorLogsIsError,
    error: errorLogsError,
    refetch: refetchErrorLogs,
  } = useQuery({
    queryKey: [
      "admin",
      "monitoring",
      "error-logs",
      errorLogPage,
      errorLogFilters,
    ],
    queryFn: async () => {
      const url = buildUrl("/api/v1/admin/monitoring/error-logs", {
        page: errorLogPage.toString(),
        per_page: "50",
        severity: errorLogFilters.severity || undefined,
        start_date: errorLogFilters.start_date || undefined,
        end_date: errorLogFilters.end_date || undefined,
        include_stack_trace: "true",
      });
      return apiClient.request<ErrorLogData>(url);
    },
  });

  // Fetch usage stats
  const { data: usageStatsData, isLoading: usageStatsLoading } = useQuery({
    queryKey: ["admin", "monitoring", "usage-stats", usagePeriod],
    queryFn: async () => {
      return apiClient.request<UsageStatsData>(
        `/api/v1/admin/monitoring/usage-stats?period=${usagePeriod}`,
      );
    },
  });

  // Fetch usage trends
  const { data: usageTrendsData, isLoading: usageTrendsLoading } = useQuery({
    queryKey: ["admin", "monitoring", "usage-trends"],
    queryFn: async () => {
      return apiClient.request<UsageTrendsData>(
        "/api/v1/admin/monitoring/usage-stats/trends?days=7",
      );
    },
  });

  // if (healthError) {
  //   return (
  //     <ErrorPage
  //       title="Failed to load system health"
  //       message="System monitoring data is currently unavailable."
  //       retry={() => void refetchHealth()}
  //     />
  //   );
  // }

  const health = healthData;
  const errorLogs = (errorLogsData as ErrorLogData | undefined)?.items || [];
  const errorLogsPagination = (errorLogsData as ErrorLogData | undefined)
    ?.pagination;
  const usageStats = usageStatsData;
  const usageTrends =
    (usageTrendsData as UsageTrendsData | undefined)?.trends || [];

  return (
    <PageLayout
      title="System Monitoring"
      description="Monitor system health, errors, and platform usage"
    >
      <AdminGuard>
        <div className="space-y-8">
          {/* System Health Cards */}
          {/* {health && (
            <SystemHealthCards health={health} isLoading={healthLoading} />
          )} */}

          {/* Tabs for detailed monitoring */}
          <Tabs defaultValue="health" className="space-y-6">
            <TabsList>
              <TabsTrigger value="health">
                <Server className="h-4 w-4 mr-2" />
                System Health
              </TabsTrigger>
              <TabsTrigger value="errors">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Error Logs
              </TabsTrigger>
              <TabsTrigger value="usage">
                <BarChart3 className="h-4 w-4 mr-2" />
                Usage Statistics
              </TabsTrigger>
            </TabsList>

            {/* System Health Tab */}
            <TabsContent value="health" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Database Health */}
                <Card>
                  <CardHeader>
                    <CardTitle>Database</CardTitle>
                    <CardDescription>
                      PostgreSQL connection and performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <span
                        className={`text-sm font-medium ${health?.database?.status === "healthy"
                            ? "text-green-600"
                            : "text-red-600"
                          }`}
                      >
                        {health?.database?.status || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Response Time
                      </span>
                      <span className="text-sm font-medium">
                        {health?.database?.response_time_ms || 0}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Connections
                      </span>
                      <span className="text-sm font-medium">
                        {health?.database?.connection_count ?? 0} /{" "}
                        {health?.database?.max_connections ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Checked In
                      </span>
                      <span className="text-sm font-medium">
                        {health?.database?.connections_checked_in ?? 0} /{" "}
                        {health?.database?.connection_count ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Checked Out
                      </span>
                      <span className="text-sm font-medium">
                        {health?.database?.connections_checked_out ?? 0} /{" "}
                        {health?.database?.connection_count ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Pool Size
                      </span>
                      <span className="text-sm font-medium">
                        {health?.database?.pool_size ?? 0} /{" "}
                        {health?.database?.max_connections ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Overflow
                      </span>
                      <span className="text-sm font-medium">
                        {health?.database?.pool_overflow ?? 0} /{" "}
                        {health?.database?.max_overflow ?? 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Cache Health */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cache</CardTitle>
                    <CardDescription>Redis cache metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>

                      <span
                        className={`text-sm font-medium ${health?.database?.status === "healthy"
                            ? "text-green-600"
                            : "text-red-600"
                          }`}
                      >
                        {health?.cache?.status || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Enabled
                      </span>
                      <span className="text-sm font-medium">
                        {health?.cache?.enabled ? "Yes" : "No"}
                      </span>
                    </div>
                    {health?.cache?.status !== "not_configured" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Hit Rate
                          </span>
                          <span className="text-sm font-medium">
                            {health?.cache?.hit_rate || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Memory Used
                          </span>
                          <span className="text-sm font-medium">
                            {health?.cache?.memory_used_mb ?? 0} /{" "}
                            {health?.cache?.memory_max_mb ?? 0} MB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Cache Hits / Misses
                          </span>
                          <span className="text-sm font-medium">
                            {health?.cache?.keyspace_hits ?? 0} /{" "}
                            {health?.cache?.keyspace_misses ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Memory Used %
                          </span>
                          <span className="text-sm font-medium">
                            {health?.cache?.memory_used_percent ?? 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Memory Used (bytes)
                          </span>
                          <span className="text-sm font-medium">
                            {health?.cache?.memory_used_bytes ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Evicted / Expired
                          </span>
                          <span className="text-sm font-medium">
                            {health?.cache?.evicted_keys ?? 0} /{" "}
                            {health?.cache?.expired_keys ?? 0}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>


                {/* API Health */}
                <Card>
                  <CardHeader>
                    <CardTitle>API</CardTitle>
                    <CardDescription>API performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <span
                        className={`text-sm font-medium ${health?.api?.status === "healthy"
                            ? "text-green-600"
                            : "text-red-600"
                          }`}
                      >
                        {health?.api?.status || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Requests/min
                      </span>
                      <span className="text-sm font-medium">
                        {health?.api?.requests_per_minute || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Avg Response
                      </span>
                      <span className="text-sm font-medium">
                        {health?.api?.avg_response_time_ms || 0}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Error Rate
                      </span>
                      <span className="text-sm font-medium">
                        {health?.api?.error_rate || 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Workers Health */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle>Background Workers</CardTitle>
                    <CardDescription>
                      Job queue and worker status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {health?.workers?.status || "Not Configured"}
                      </span>
                    </div>
                    {health?.workers?.status !== "not_configured" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Active Jobs
                          </span>
                          <span className="text-sm font-medium">
                            {health?.workers?.active_jobs || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Failed (24h)
                          </span>
                          <span className="text-sm font-medium">
                            {health?.workers?.failed_jobs_24h || 0}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card> */}
              </div>
            </TabsContent>

            {/* Error Logs Tab */}
            <TabsContent value="errors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Error Logs</CardTitle>
                  <CardDescription>
                    Application errors, warnings, and critical issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorLogsTable
                    logs={errorLogs}
                    pagination={errorLogsPagination}
                    isLoading={errorLogsLoading}
                    isError={errorLogsIsError}
                    error={errorLogsError}
                    filters={errorLogFilters}
                    onPageChange={setErrorLogPage}
                    onFiltersChange={setErrorLogFilters}
                    onRefresh={refetchErrorLogs}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage Statistics Tab */}
            <TabsContent value="usage" className="space-y-6">
              <UsageCharts
                stats={usageStats}
                trends={usageTrends}
                period={usagePeriod}
                isLoading={usageStatsLoading || usageTrendsLoading}
                onPeriodChange={(p) => setUsagePeriod(p as typeof usagePeriod)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AdminGuard>
    </PageLayout>
  );
}
