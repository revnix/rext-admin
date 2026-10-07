"use client";

import {
  AlertTriangle,
  Mail,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

interface EmailOverviewKPIsProps {
  data?: EmailOverview;
  isLoading: boolean;
}

export function EmailOverviewKPIs({ data, isLoading }: EmailOverviewKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton loader
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      title: "Total Sent",
      value: data.total_sent.toLocaleString(),
      subtitle: `${data.delivery_rate}% delivered`,
      icon: Mail,
      trend: data.delivery_rate >= 95 ? "positive" : "neutral",
    },
    {
      title: "Open Rate",
      value: `${data.open_rate}%`,
      subtitle: `${data.total_opened.toLocaleString()} opened`,
      icon: TrendingUp,
      trend:
        data.open_rate >= 25
          ? "positive"
          : data.open_rate >= 15
            ? "neutral"
            : "negative",
    },
    {
      title: "Click Rate",
      value: `${data.click_rate}%`,
      subtitle: `${data.total_clicked.toLocaleString()} clicked`,
      icon: MousePointerClick,
      trend:
        data.click_rate >= 5
          ? "positive"
          : data.click_rate >= 2
            ? "neutral"
            : "negative",
    },
    {
      title: "Bounce Rate",
      value: `${data.bounce_rate}%`,
      subtitle: `${data.total_bounced.toLocaleString()} bounced`,
      icon: AlertTriangle,
      trend:
        data.bounce_rate <= 2
          ? "positive"
          : data.bounce_rate <= 5
            ? "neutral"
            : "negative",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const trendColor =
          kpi.trend === "positive"
            ? "text-success-600"
            : kpi.trend === "negative"
              ? "text-danger-600"
              : "text-warning-600";

        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <Icon className={`h-4 w-4 ${trendColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
