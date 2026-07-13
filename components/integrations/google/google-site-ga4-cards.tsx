"use client";

import {
  Activity,
  Clock,
  Eye,
  LogOut,
  MousePointer2,
  Users,
} from "lucide-react";
import { StatsCards } from "@/components/stats-cards";
import type { SiteGA4Summary } from "@/types/google-integration";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

const NOT_ENOUGH_DATA = "Not enough data";

/**
 * Site-wide GA4 totals (whole property, straight from Google) — complements
 * the GSC-based KPI cards above with engagement metrics.
 */
export function GoogleSiteGa4Cards({ ga4 }: { ga4: SiteGA4Summary }) {
  const stats = [
    {
      title: "Sessions",
      value: formatNumber(ga4.sessions),
      icon: MousePointer2,
    },
    {
      title: "Active Users",
      value: formatNumber(ga4.active_users),
      icon: Users,
    },
    {
      title: "Page Views",
      value: formatNumber(ga4.screen_page_views),
      icon: Eye,
    },
    {
      title: "Engagement Rate",
      value:
        ga4.engagement_rate !== null
          ? formatPercent(ga4.engagement_rate)
          : NOT_ENOUGH_DATA,
      icon: Activity,
    },
    {
      title: "Avg. Session Duration",
      value:
        ga4.average_session_duration !== null
          ? formatDuration(ga4.average_session_duration)
          : NOT_ENOUGH_DATA,
      icon: Clock,
    },
    {
      title: "Bounce Rate",
      value:
        ga4.bounce_rate !== null
          ? formatPercent(ga4.bounce_rate)
          : NOT_ENOUGH_DATA,
      icon: LogOut,
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Site Analytics (GA4)
      </h3>
      <StatsCards stats={stats} className="lg:grid-cols-3" />
    </div>
  );
}
