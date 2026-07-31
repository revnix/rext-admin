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
    change: string;
    isPositive: boolean;
    icon: LucideIcon;
  }[] = [
    {
      label: "Total Personas",
      value: totalPersonas,
      change: "+9.5%",
      isPositive: true,
      icon: Users,
    },
    {
      label: "Total Articles",
      value: totalArticles,
      change: "-1.6%",
      isPositive: false,
      icon: FileText,
    },
    {
      label: "Total Published",
      value: publishedArticles,
      change: "+3.5%",
      isPositive: true,
      icon: Send,
    },
    {
      label: "Total Members",
      value: totalMembers,
      change: "+1.2%",
      isPositive: true,
      icon: UsersRound,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-600)] dark:bg-[var(--color-brand-900)]/40 dark:text-[var(--color-brand-300)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {metric.label}
                  </h3>
                </div>
                <span className="pl-[52px] text-2xl font-bold text-foreground">
                  {metric.value}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
