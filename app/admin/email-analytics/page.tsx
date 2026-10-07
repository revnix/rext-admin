"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { workspaceQueries } from "@/lib/query-keys";
import { EmailFailuresTable } from "@/components/admin/email/email-failures-table";
import { EmailOverviewKPIs } from "@/components/admin/email/email-overview-kpis";
import { EmailPerformanceTable } from "@/components/admin/email/email-performance-table";
import { ListPage } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { AdminGuard } from "@/components/permission/admin-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";

// Lazy load EmailVolumeChart component (uses recharts - heavy library ~400KB)
const EmailVolumeChart = dynamic(
  () =>
    import("@/components/admin/email/email-volume-chart").then(
      (mod) => mod.EmailVolumeChart,
    ),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
);

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";

interface EmailOverview {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_complained: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  complaint_rate: number;
}

interface TemplateStats {
  template_type: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  open_rate: number;
  click_rate: number;
}

interface TimelineData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

interface EmailFailure {
  id: string;
  to: string;
  template_type: string;
  status: string;
  error_message: string;
  sent_at: string;
}

const NO_TEMPLATES: TemplateStats[] = [];
const NO_FAILURES: EmailFailure[] = [];

export default function EmailAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [period, setPeriod] = useState("daily");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Fetch workspaces list (for filter dropdown)
  const { data: workspaces } = useQuery({
    ...workspaceQueries.list(),
    select: (data) =>
      Array.isArray(data?.workspaces)
        ? (data.workspaces as Array<{ id: string; name: string }>)
        : [],
  });

  // Build query params with optional workspace filter
  const buildQueryParams = (baseParams: Record<string, string>) => {
    const params = new URLSearchParams(baseParams);
    if (workspaceId) {
      params.append("workspace_id", workspaceId);
    }
    return params.toString();
  };

  // Fetch overview stats
  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["email-analytics", "overview", dateRange, workspaceId],
    queryFn: async () => {
      const params = buildQueryParams({ date_range: dateRange });
      const response = await apiClient.request<EmailOverview>(
        `/api/v1/admin/email-analytics/overview?${params}`,
        { method: "GET" },
      );
      return response;
    },
  });

  // Fetch template performance
  const { data: templateData, isLoading: templateLoading } = useQuery({
    queryKey: ["email-analytics", "templates", dateRange, workspaceId],
    queryFn: async () => {
      const params = buildQueryParams({ date_range: dateRange });
      const response = await apiClient.request<{ templates: TemplateStats[] }>(
        `/api/v1/admin/email-analytics/by-template?${params}`,
        { method: "GET" },
      );
      return response.templates;
    },
  });

  // Fetch timeline
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ["email-analytics", "timeline", period, dateRange, workspaceId],
    queryFn: async () => {
      const params = buildQueryParams({ period, date_range: dateRange });
      const response = await apiClient.request<{ timeline: TimelineData[] }>(
        `/api/v1/admin/email-analytics/timeline?${params}`,
        { method: "GET" },
      );
      return response.timeline;
    },
  });

  // Fetch failures
  const { data: failuresData, isLoading: failuresLoading } = useQuery({
    queryKey: ["email-analytics", "failures", workspaceId],
    queryFn: async () => {
      const params = buildQueryParams({ limit: "100" });
      const response = await apiClient.request<{ failures: EmailFailure[] }>(
        `/api/v1/admin/email-analytics/failures?${params}`,
        { method: "GET" },
      );
      return response.failures;
    },
  });

  if (overviewError) {
    return (
      <ListPage
        title="Email Analytics"
        description="Monitor email delivery, engagement, and performance"
      >
        <Notice
          tone="danger"
          title="Failed to load email analytics"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refetchOverview()}
            >
              Try again
            </Button>
          }
        >
          Overview data could not be loaded. Please try again.
        </Notice>
      </ListPage>
    );
  }

  return (
    <AdminGuard>
      <ListPage
        title="Email Analytics"
        description="Monitor email delivery, engagement, and performance"
        actions={
          <>
            <Select
              value={workspaceId || "all"}
              onValueChange={(value) =>
                setWorkspaceId(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-[200px]" aria-label="Workspace">
                <SelectValue placeholder="All workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workspaces</SelectItem>
                {workspaces?.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]" aria-label="Date range">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      >
        <div className="space-y-4">
          {/* KPIs */}
          <EmailOverviewKPIs data={overviewData} isLoading={overviewLoading} />

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="templates">By Template</TabsTrigger>
              <TabsTrigger value="failures">Failures</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Volume Chart */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Email Volume Over Time</CardTitle>
                    <CardDescription>
                      Emails sent, opened, and clicked over time
                    </CardDescription>
                  </div>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[140px]" aria-label="Group by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="pl-2">
                  <EmailVolumeChart
                    data={timelineData || []}
                    isLoading={timelineLoading}
                  />
                </CardContent>
              </Card>

              {/* Email Health Score */}
              {/* <Card>
                <CardHeader>
                  <CardTitle>Email Health Score</CardTitle>
                  <CardDescription>
                    Overall email system health based on delivery, bounce, and
                    complaint rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewData && (
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Health Score
                          </span>
                          <span className="text-2xl font-bold">
                            {calculateHealthScore(overviewData)}%
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              calculateHealthScore(overviewData) >= 90
                                ? "bg-success-600"
                                : calculateHealthScore(overviewData) >= 70
                                  ? "bg-warning-600"
                                  : "bg-danger-600"
                            }`}
                            style={{
                              width: `${calculateHealthScore(overviewData)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card> */}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <EmailPerformanceTable
                data={templateData ?? NO_TEMPLATES}
                isLoading={templateLoading}
              />
            </TabsContent>

            <TabsContent value="failures" className="space-y-4">
              <EmailFailuresTable
                data={failuresData ?? NO_FAILURES}
                isLoading={failuresLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </ListPage>
    </AdminGuard>
  );
}
