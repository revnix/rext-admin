"use client";

import {
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionKPIsProps {
  stats: {
    total_subscriptions: number;
    active_subscriptions: number;
    trial_subscriptions: number;
    cancelled_subscriptions: number;
    expired_subscriptions?: number;
    suspended_subscriptions?: number;
    mrr: number;
    arr: number;
    churn_rate_monthly: number;
    trial_conversion_rate: number;
    average_ltv?: number | null;
  };
  growthMetrics?: {
    new_revenue_30d: number;
    growth_rate: number;
  };
}

export function SubscriptionKPIs({
  stats,
  growthMetrics,
}: SubscriptionKPIsProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value)) {
      return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value)) {
      return "N/A";
    }

    return `${value.toFixed(1)}%`;
  };

  const churnRate =
    stats.total_subscriptions > 0
      ? (stats.cancelled_subscriptions / stats.total_subscriptions) * 100
      : 0;

  const kpis = [
    {
      title: "Total Subscriptions",
      value: stats.total_subscriptions.toLocaleString(),
      icon: Users,
      description: `${stats.active_subscriptions} active`,
      color: "text-foreground",
    },
    {
      title: "Active Subscriptions",
      value: stats.active_subscriptions.toLocaleString(),
      icon: Users,
      description: `${stats.trial_subscriptions} trials`,
      color: "text-foreground",
    },
    {
      title: "MRR",
      value: formatCurrency(stats.mrr),
      icon: DollarSign,
      description: growthMetrics
        ? `${growthMetrics.growth_rate >= 0 ? "+" : ""}${formatPercent(
            growthMetrics.growth_rate,
          )}`
        : undefined,
      trend: growthMetrics
        ? growthMetrics.growth_rate >= 0
          ? "up"
          : "down"
        : undefined,
      color: "text-foreground",
    },
    {
      title: "ARR",
      value: formatCurrency(stats.arr),
      icon: DollarSign,
      description: "Annual recurring revenue",
      color: "text-foreground",
    },
    {
      title: "Avg Customer LTV",
      value: formatCurrency(stats.average_ltv),
      icon: DollarSign,
      description: "Average customer lifetime value",
      color: "text-foreground",
    },
    {
      title: "Churn Rate",
      value: formatPercent(churnRate),
      icon: Percent,
      description: "Last 30 days",
      color: stats.churn_rate_monthly > 5 ? "text-red-600" : "text-foreground",
      trend: "down",
    },
    {
      title: "Trial Conversion",
      value: formatPercent(stats.trial_conversion_rate),
      icon: Percent,
      description: "Trial to paid",
      color: "text-foreground",
    },
    {
      title: "Trial Subscriptions",
      value: stats.trial_subscriptions.toLocaleString(),
      icon: Users,
      description: "Currently trialing",
      color: "text-foreground",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

        const TrendIcon =
          kpi.trend === "up"
            ? TrendingUp
            : kpi.trend === "down"
              ? TrendingDown
              : null;

        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>

              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>

              {kpi.description && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {TrendIcon && (
                    <TrendIcon
                      className={`h-3 w-3 ${
                        kpi.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    />
                  )}

                  {kpi.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
