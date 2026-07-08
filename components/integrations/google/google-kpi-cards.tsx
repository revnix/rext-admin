"use client";

import {
  AlertTriangle,
  FileText,
  Gauge,
  MousePointerClick,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { StatsCards } from "@/components/stats-cards";
import type { DashboardKPIs } from "@/types/google-integration";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

const DASH = "—";

export function GoogleKpiCards({ kpis }: { kpis: DashboardKPIs }) {
  const stats = [
    {
      title: "Total Articles",
      value: formatNumber(kpis.total_articles),
      icon: FileText,
    },
    {
      title: "Indexed Pages",
      value: formatNumber(kpis.indexed_pages),
      icon: Search,
      description: `of ${formatNumber(kpis.total_articles)} articles`,
    },
    {
      title: "Organic Clicks",
      value: formatNumber(kpis.organic_clicks),
      icon: MousePointerClick,
    },
    {
      title: "Organic Impressions",
      value: formatNumber(kpis.organic_impressions),
      icon: Gauge,
    },
    {
      title: "Average Position",
      value:
        kpis.average_position !== null
          ? kpis.average_position.toFixed(1)
          : "Not enough data",
      icon: Trophy,
    },
    {
      title: "CTR",
      value: formatPercent(kpis.ctr, 2),
      icon: Target,
    },
    {
      title: "Organic Traffic Trend",
      value:
        kpis.organic_traffic_trend !== null
          ? `${kpis.organic_traffic_trend > 0 ? "+" : ""}${kpis.organic_traffic_trend.toFixed(1)}%`
          : "Not enough data",
      icon: TrendingUp,
      trend:
        kpis.organic_traffic_trend !== null
          ? {
              value: "vs. prior period",
              isPositive: kpis.organic_traffic_trend >= 0,
            }
          : undefined,
    },
    {
      title: "Total Opportunity Score",
      value: `${kpis.total_opportunity_score.toFixed(1)} / 100`,
      icon: Sparkles,
    },
    {
      title: "Articles Requiring Update",
      value: formatNumber(kpis.articles_requiring_update),
      icon: AlertTriangle,
      description:
        kpis.average_health_score !== null
          ? `Avg. health score: ${kpis.average_health_score.toFixed(1)}`
          : DASH,
    },
  ];

  return <StatsCards stats={stats} className="lg:grid-cols-3" />;
}
