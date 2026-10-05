"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { inSeriesOrder } from "@/lib/charts";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

interface EmailVolumeChartProps {
  data: TimelineData[];
  isLoading: boolean;
}

export function EmailVolumeChart({ data, isLoading }: EmailVolumeChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No data available
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    Sent: item.sent,
    Delivered: item.delivered,
    Opened: item.opened,
    Clicked: item.clicked,
    Failed: item.failed,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip itemSorter={inSeriesOrder} />
        <Legend itemSorter={null} />
        <Line
          type="monotone"
          dataKey="Sent"
          stroke="#667eea"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Delivered"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Opened"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Clicked"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Failed"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
