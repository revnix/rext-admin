"use client";

import {
  BarChart,
  BookOpen,
  FileText,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Workspace } from "@/types/workspace";

interface WorkspaceStatsGridProps {
  workspace: Workspace | null;
}

export function WorkspaceStatsGrid({ workspace }: WorkspaceStatsGridProps) {
  // Calculate stats from workspace data
  const topicsCount = workspace?.topics_count ?? 0;
  const contentCount = workspace?.content_count ?? 0;
  const membersCount = workspace?.members_count ?? 0;
  const knowledgeCount =
    (workspace?.websites?.length ?? 0) +
    (workspace?.knowledge_files?.length ?? 0) +
    (workspace?.text_knowledge?.length ?? 0);

  const stats = [
    {
      title: "Total Topics",
      value: topicsCount,
      icon: BarChart,
      color: "text-blue-600",
    },
    {
      title: "Active Flows",
      value: "--", // Placeholder for future implementation
      icon: Zap,
      color: "text-yellow-600",
    },
    {
      title: "Content Items",
      value: contentCount,
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "Team Members",
      value: membersCount,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Knowledge Items",
      value: knowledgeCount,
      icon: BookOpen,
      color: "text-indigo-600",
    },
    {
      title: "Total Engagement",
      value: "--", // Placeholder for future implementation
      icon: TrendingUp,
      color: "text-pink-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof stat.value === "number" ? stat.value : stat.value}
            </div>
            {typeof stat.value === "number" && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.value === 0 ? "Get started" : "Total count"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
