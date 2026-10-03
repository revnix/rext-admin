"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PlanDistributionChartProps {
  data: Array<{
    plan_name: string;
    plan_display_name: string;
    subscription_count: number;
    revenue_monthly: number;
    revenue_yearly: number;
    percentage: number;
  }>;
}

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  const safeData = Array.isArray(data) ? data : [];

  const chartData = safeData.map((plan) => ({
    id: plan.plan_name,
    name: plan.plan_display_name || plan.plan_name,
    value: plan.subscription_count,
    revenue: plan.revenue_monthly,
    percentage: plan.percentage,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(
                value: number,
                _name: string,
                props: { payload?: { percentage: number; name: string } },
              ) => {
                if (!props.payload) return [String(value), ""];
                return [
                  `${value} subscriptions (${props.payload.percentage.toFixed(1)}%)`,
                  props.payload.name,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1">
        <div className="space-y-4">
          <h4 className="font-semibold">Revenue Breakdown</h4>
          {safeData.map((plan, index) => (
            <div
              key={plan.plan_name}
              className="flex items-center justify-between p-3 rounded-md border"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <p className="font-medium">
                    {plan.plan_display_name || plan.plan_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.subscription_count} subscriptions (
                    {(Number.isFinite(plan.percentage)
                      ? plan.percentage
                      : 0
                    ).toFixed(1)}
                    %)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatCurrency(plan.revenue_monthly)}/mo
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(plan.revenue_yearly)}/yr
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
