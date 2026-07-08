"use client";

import { format, parseISO } from "date-fns";
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
import type { DashboardCharts, TrendPoint } from "@/types/google-integration";

function xAxisTick(date: string): string {
  try {
    return format(parseISO(date), "MMM d");
  } catch {
    return date;
  }
}

interface TrendChartCardProps {
  title: string;
  description: string;
  data: TrendPoint[];
  dataKey: string;
  color: string;
  valueFormatter?: (value: number) => string;
}

/**
 * One single-series trend line — colors are assigned in a fixed order
 * across the 4 charts (chart-1..chart-4), each chart is its own card with
 * its own title, so no legend is needed for a single series. Hover shows
 * the exact value via ChartTooltipContent (the "relief" the dataviz
 * validator flags as required for the warmer chart-2/chart-3 tones).
 */
function TrendChartCard({
  title,
  description,
  data,
  dataKey,
  color,
  valueFormatter,
}: TrendChartCardProps) {
  const chartConfig = {
    [dataKey]: { label: title, color },
  } satisfies ChartConfig;

  const chartData = data.map((point) => ({
    date: point.date,
    [dataKey]: point.value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
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
              width={44}
              tickFormatter={valueFormatter}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => xAxisTick(String(value))}
                  formatter={(value) => [
                    valueFormatter
                      ? valueFormatter(Number(value))
                      : String(value),
                    title,
                  ]}
                />
              }
            />
            <Line
              dataKey={dataKey}
              type="monotone"
              stroke={`var(--color-${dataKey})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const formatCount = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
const formatPosition = (value: number) => value.toFixed(1);
const formatCtr = (value: number) => `${(value * 100).toFixed(1)}%`;

export function GoogleTrendCharts({ charts }: { charts: DashboardCharts }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TrendChartCard
        title="Click Trend"
        description="Daily organic clicks"
        data={charts.click_trend}
        dataKey="clicks"
        color="var(--chart-1)"
        valueFormatter={formatCount}
      />
      <TrendChartCard
        title="Impression Trend"
        description="Daily organic impressions"
        data={charts.impression_trend}
        dataKey="impressions"
        color="var(--chart-2)"
        valueFormatter={formatCount}
      />
      <TrendChartCard
        title="Position Trend"
        description="Average SERP position (lower is better)"
        data={charts.position_trend}
        dataKey="position"
        color="var(--chart-3)"
        valueFormatter={formatPosition}
      />
      <TrendChartCard
        title="CTR Trend"
        description="Daily click-through rate"
        data={charts.ctr_trend}
        dataKey="ctr"
        color="var(--chart-4)"
        valueFormatter={formatCtr}
      />
    </div>
  );
}
