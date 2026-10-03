"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Send, Users, UsersRound } from "lucide-react";
import type { DashboardStats } from "@/lib/api-client/dashboard";
import type { LucideIcon } from "lucide-react";

interface MetricsCardsProps {
  dashboardStats?: DashboardStats;
  isLoading?: boolean;
}

export function MetricsCards({
  dashboardStats,
  isLoading: _isLoading = false,
}: MetricsCardsProps) {
  // Use real API data from dashboard stats
  const totalPersonas = dashboardStats?.personas ?? 0;
  const totalArticles = dashboardStats?.content.total ?? 0;
  const publishedArticles = dashboardStats?.content.published ?? 0;
  const totalMembers = dashboardStats?.members ?? 0;

  const metrics: {
    label: string;
    value: number;
    caption: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Total Personas",
      value: totalPersonas,
      caption: "Audience profiles in this workspace",
      icon: Users,
    },
    {
      label: "Total Articles",
      value: totalArticles,
      caption: "Drafts and published content",
      icon: FileText,
    },
    {
      label: "Total Published",
      value: publishedArticles,
      caption: "Live on your connected site",
      icon: Send,
    },
    {
      label: "Total Members",
      value: totalMembers,
      caption: "People with workspace access",
      icon: UsersRound,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label}>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </h3>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                  {metric.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metric.caption}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
