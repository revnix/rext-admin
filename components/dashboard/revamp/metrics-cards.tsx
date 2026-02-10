"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/api-client/dashboard";

interface MetricsCardsProps {
  dashboardStats?: DashboardStats;
  isLoading?: boolean;
}

export function MetricsCards({
  dashboardStats,
  isLoading = false,  
}: MetricsCardsProps) {
  // Use real API data from dashboard stats
  const totalPersonas = dashboardStats?.personas ?? 0;
  const totalArticles = dashboardStats?.content.total ?? 0;
  const publishedArticles = dashboardStats?.content.published ?? 0;
  const totalMembers = dashboardStats?.members ?? 0;

  const metrics = [
    {
      label: "Total Personas",
      value: totalPersonas,
      change: "+9.5%",
      isPositive: true,
    },
    {
      label: "Total Articles",
      value: totalArticles,
      change: "-1.6%",
      isPositive: false,
    },
    {
      label: "Total Published",
      value: publishedArticles,
      change: "+3.5%",
      isPositive: true,
    },
    {
      label: "Total Members",
      value: totalMembers,
      change: "+1.2%",
      isPositive: true,
    },
  ];


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  {metric.label}
                </h3>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {metric.value}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
