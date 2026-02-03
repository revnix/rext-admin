"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";

interface MetricsCardsProps {
  workspace: Workspace | null;
  workspacesCount: number;
}

export function MetricsCards({
  workspace,
  workspacesCount,
}: MetricsCardsProps) {
  // Mock data for metrics not available in backend yet or to be calculated
  // We use existing data where possible
  const totalWorkspaces = workspacesCount || 0;
  const totalPersonas = 7; // Mock for now, will connect to persona list length if available
  const totalArticles = workspace?.content_count ?? 24;
  const publishedArticles = 12; // Mock
  const totalMembers =
    workspace?.members_count ?? workspace?.team_metrics?.total_members ?? 4;

  const metrics = [
    {
      label: "Total Workspaces",
      value: totalWorkspaces,
      change: "+2.5%",
      isPositive: true,
    },
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
      // Added 5th card as requested
      label: "Total Members",
      value: totalMembers,
      change: "+1.2%",
      isPositive: true,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => (
        <Card key={metric.label}>
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
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${metric.isPositive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                >
                  {metric.change}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
