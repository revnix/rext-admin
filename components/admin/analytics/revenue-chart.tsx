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
import { Button } from "@/components/ui/button";

interface RevenueChartProps {
  data: Array<{
    month: string;
    mrr: number;
    new_revenue: number;
    churned_revenue: number;
    net_revenue: number;
  }>;
  period: "3_months" | "6_months" | "12_months";
  onPeriodChange: (period: string) => void;
}

export function RevenueChart({
  data,
  period,
  onPeriodChange,
}: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(1)}k`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant={period === "3_months" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("3_months")}
        >
          3 Months
        </Button>
        <Button
          variant={period === "6_months" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("6_months")}
        >
          6 Months
        </Button>
        <Button
          variant={period === "12_months" ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange("12_months")}
        >
          12 Months
        </Button>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip
            itemSorter={inSeriesOrder}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend itemSorter={null} />
          <Line
            type="monotone"
            dataKey="mrr"
            stroke="var(--primary)"
            strokeWidth={2}
            name="MRR"
          />
          <Line
            type="monotone"
            dataKey="new_revenue"
            stroke="var(--success-600)"
            strokeWidth={2}
            name="New Revenue"
          />
          <Line
            type="monotone"
            dataKey="churned_revenue"
            stroke="var(--danger-600)"
            strokeWidth={2}
            name="Churned Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
