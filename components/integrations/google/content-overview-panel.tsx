"use client";

import { format, parseISO } from "date-fns";
import { Gauge, MousePointerClick, Target } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCards } from "@/components/stats-cards";
import { useGoogleContentPerformance } from "@/hooks/use-google-content";
import type { ContentSearchConsoleDailyMetric } from "@/types/google-integration";

function xAxisTick(date: string): string {
  try {
    return format(parseISO(date), "MMM d");
  } catch {
    return date;
  }
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

function formatPosition(value: number): string {
  return value.toFixed(1);
}

function sum(
  rows: ContentSearchConsoleDailyMetric[],
  key: "clicks" | "impressions",
): number {
  return rows.reduce((total, row) => total + (row[key] ?? 0), 0);
}

interface ContentOverviewPanelProps {
  workspaceId: string;
  contentId: string;
  lastUpdated?: string | null;
  days?: number;
}

/**
 * Overview section: organic traffic, CTR, impressions, and the position
 * trend chart for one article — sourced from the previously-unused
 * `/content/{id}/performance` endpoint (daily GSC metrics). Health Score
 * and Opportunity Score render as their own panels alongside this one.
 */
export function ContentOverviewPanel({
  workspaceId,
  contentId,
  lastUpdated,
  days = 90,
}: ContentOverviewPanelProps) {
  const { data, isLoading } = useGoogleContentPerformance(
    workspaceId,
    contentId,
    days,
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-[220px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const rows = data?.search_console ?? [];
  const hasData = rows.length > 0;
  const totalClicks = sum(rows, "clicks");
  const totalImpressions = sum(rows, "impressions");
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : null;

  const stats = [
    {
      title: "Organic Traffic",
      value: hasData ? formatCount(totalClicks) : "—",
      icon: MousePointerClick,
      description: `Clicks over last ${days} days`,
    },
    {
      title: "Impressions",
      value: hasData ? formatCount(totalImpressions) : "—",
      icon: Gauge,
      description: `Over last ${days} days`,
    },
    {
      title: "CTR",
      value: ctr !== null ? `${(ctr * 100).toFixed(2)}%` : "—",
      icon: Target,
      description: "Clicks / impressions",
    },
  ];

  const chartConfig = {
    position: { label: "Avg. Position", color: "var(--chart-3)" },
  } satisfies ChartConfig;

  const chartData = rows.map((row) => ({
    date: row.date,
    position: row.position,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Organic search performance for this article.
          </CardDescription>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated {new Date(lastUpdated).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <StatsCards stats={stats} className="md:grid-cols-3" />

        <div>
          <p className="mb-2 text-sm font-medium">
            Position Trend
            <span className="ml-1 font-normal text-muted-foreground">
              (lower is better)
            </span>
          </p>
          {hasData ? (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[220px] w-full"
            >
              <LineChart
                data={chartData}
                margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={xAxisTick}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={36}
                  tickFormatter={formatPosition}
                  reversed
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => xAxisTick(String(value))}
                      formatter={(value) => [
                        formatPosition(Number(value)),
                        "Avg. Position",
                      ]}
                    />
                  }
                />
                <Line
                  dataKey="position"
                  type="monotone"
                  stroke="var(--color-position)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No search performance data synced yet for this article.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
