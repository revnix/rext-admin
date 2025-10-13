"use client";

import { Activity, FileText, Layers, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageChartsProps {
  stats?: {
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
  };
  trends: Array<{
    date: string;
    content_created: number;
    active_users: number;
    workspaces_created: number;
  }>;
  period: "24_hours" | "7_days" | "30_days";
  isLoading: boolean;
  onPeriodChange: (period: string) => void;
}

export function UsageCharts({
  stats,
  trends,
  period,
  isLoading,
  onPeriodChange,
}: UsageChartsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => `usage-skeleton-${i}`).map(
            (key) => (
              <Skeleton key={key} className="h-32" />
            ),
          )}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const kpis = [
    {
      title: "Active Users",
      value: stats?.user_activity.active_users || 0,
      description: `${stats?.user_activity.new_users || 0} new users`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Content Created",
      value: stats?.content_generation.total || 0,
      description: `${stats?.content_generation.successful || 0} successful`,
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "API Calls",
      value: stats?.api_calls.total || 0,
      description: "Total requests",
      icon: Activity,
      color: "text-purple-600",
    },
    {
      title: "Workspaces",
      value: stats?.user_activity.new_workspaces || 0,
      description: "New workspaces",
      icon: Layers,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end gap-2">
        <Button
          variant={period === "24_hours" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("24_hours")}
        >
          24 Hours
        </Button>
        <Button
          variant={period === "7_days" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("7_days")}
        >
          7 Days
        </Button>
        <Button
          variant={period === "30_days" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("30_days")}
        >
          30 Days
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpi.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends (Last 7 Days)</CardTitle>
          <CardDescription>Daily activity breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="content_created"
                stroke="#10b981"
                strokeWidth={2}
                name="Content Created"
              />
              <Line
                type="monotone"
                dataKey="active_users"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Active Users"
              />
              <Line
                type="monotone"
                dataKey="workspaces_created"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Workspaces"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Endpoints */}
      {stats?.api_calls.by_endpoint &&
        stats.api_calls.by_endpoint.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top API Endpoints</CardTitle>
              <CardDescription>Most frequently used endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.api_calls.by_endpoint}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="endpoint"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

      {/* Content Generation Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Generation</CardTitle>
            <CardDescription>Success vs failure rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">
                {stats?.content_generation.total || 0}
              </span>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Successful
                </span>
                <span className="text-sm font-medium text-green-600">
                  {stats?.content_generation.successful || 0}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600"
                  style={{
                    width: `${((stats?.content_generation.successful || 0) / (stats?.content_generation.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Failed</span>
                <span className="text-sm font-medium text-red-600">
                  {stats?.content_generation.failed || 0}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600"
                  style={{
                    width: `${((stats?.content_generation.failed || 0) / (stats?.content_generation.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Session and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Active Users
              </span>
              <span className="text-sm font-medium">
                {stats?.user_activity.active_users || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">New Users</span>
              <span className="text-sm font-medium">
                {stats?.user_activity.new_users || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Total Sessions
              </span>
              <span className="text-sm font-medium">
                {stats?.user_activity.sessions || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                New Workspaces
              </span>
              <span className="text-sm font-medium">
                {stats?.user_activity.new_workspaces || 0}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm font-medium">Avg Sessions/User</span>
              <span className="text-sm font-bold">
                {(
                  (stats?.user_activity.sessions || 0) /
                  (stats?.user_activity.active_users || 1)
                ).toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
