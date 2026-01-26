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
  const membersCount =
    workspace?.members_count ?? workspace?.team_metrics?.total_members ?? 0;
  const knowledgeCount =
    workspace?.knowledge_stats?.total ??
    workspace?.knowledge_counts?.total_knowledge_items ??
    (workspace?.websites?.length ?? 0) +
      (workspace?.knowledge_files?.length ?? 0) +
      (workspace?.text_knowledge?.length ?? 0);
  const totalWords = workspace?.content_metrics?.total_words ?? 0;

  const stats = [
    {
      title: "Knowledge Items",
      value: knowledgeCount,
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Total Words",
      value: totalWords.toLocaleString(),
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
      title: "Web Knowledge",
      value:
        workspace?.knowledge_stats?.web_knowledge ??
        workspace?.websites?.length ??
        0,
      icon: BarChart,
      color: "text-indigo-600",
    },
    {
      title: "Files",
      value:
        workspace?.knowledge_stats?.files ??
        workspace?.knowledge_files?.length ??
        0,
      icon: Zap,
      color: "text-yellow-600",
    },
    {
      title: "Text Knowledge",
      value:
        workspace?.knowledge_stats?.text_knowledge ??
        workspace?.text_knowledge?.length ??
        0,
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
