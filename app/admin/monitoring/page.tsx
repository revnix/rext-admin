"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Server } from "lucide-react";
import { useState } from "react";
import { ErrorLogsTable } from "@/components/admin/monitoring/error-logs-table";
import { SystemHealthCards } from "@/components/admin/monitoring/system-health-cards";
import { UsageCharts } from "@/components/admin/monitoring/usage-charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";

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
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["admin", "monitoring", "system-health"],
    queryFn: async () => {
      return apiClient
        .request<{ data: any }>("/api/v1/admin/monitoring/system-health")
        .then((res) => res.data);
    },
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch error logs
  const {
    data: errorLogsData,
    isLoading: errorLogsLoading,
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
      const params = new URLSearchParams({
        page: errorLogPage.toString(),
        per_page: "50",
      });

      if (errorLogFilters.severity)
        params.append("severity", errorLogFilters.severity);
      if (errorLogFilters.start_date)
        params.append("start_date", errorLogFilters.start_date);
      if (errorLogFilters.end_date)
        params.append("end_date", errorLogFilters.end_date);

      return apiClient
        .request<{ data: any }>(
          `/api/v1/admin/monitoring/error-logs?${params.toString()}`,
        )
        .then((res) => res.data);
    },
  });

  // Fetch usage stats
  const { data: usageStatsData, isLoading: usageStatsLoading } = useQuery({
    queryKey: ["admin", "monitoring", "usage-stats", usagePeriod],
    queryFn: async () => {
      return apiClient
        .request<{ data: any }>(
          `/api/v1/admin/monitoring/usage-stats?period=${usagePeriod}`,
        )
        .then((res) => res.data);
    },
  });

  // Fetch usage trends
  const { data: usageTrendsData, isLoading: usageTrendsLoading } = useQuery({
    queryKey: ["admin", "monitoring", "usage-trends"],
    queryFn: async () => {
      return apiClient
        .request<{ data: any }>(
          "/api/v1/admin/monitoring/usage-stats/trends?days=7",
        )
        .then((res) => res.data);
    },
  });

  const health = healthData?.data;
  const errorLogs = errorLogsData?.data || [];
  const errorLogsPagination = errorLogsData?.pagination;
  const usageStats = usageStatsData?.data;
  const usageTrends = usageTrendsData?.data?.trends || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor system health, errors, and platform usage
          </p>
        </div>
      </div>

      {/* System Health Cards */}
      {health && (
        <SystemHealthCards health={health} isLoading={healthLoading} />
      )}

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
          <div className="grid gap-6 md:grid-cols-2">
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
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span
                    className={`text-sm font-medium ${
                      health?.database?.status === "healthy"
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
                    {health?.database?.connection_count || 0} /{" "}
                    {health?.database?.max_connections || 100}
                  </span>
                </div>
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
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span
                    className={`text-sm font-medium ${
                      health?.api?.status === "healthy"
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

            {/* Cache Health */}
            <Card>
              <CardHeader>
                <CardTitle>Cache</CardTitle>
                <CardDescription>Redis cache metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {health?.cache?.status || "Not Configured"}
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
                        {health?.cache?.memory_used_mb || 0} MB
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Workers Health */}
            <Card>
              <CardHeader>
                <CardTitle>Background Workers</CardTitle>
                <CardDescription>Job queue and worker status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
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
            </Card>
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
  );
}
