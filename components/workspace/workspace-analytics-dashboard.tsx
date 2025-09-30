"use client";

import {
  BarChart3,
  BookOpen,
  Clock,
  FileText,
  Globe,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { DetailCard } from "@/components/ui/detail-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Workspace } from "@/types/workspace";

interface WorkspaceAnalyticsDashboardProps {
  workspace: Workspace;
}

export function WorkspaceAnalyticsDashboard({
  workspace,
}: WorkspaceAnalyticsDashboardProps) {
  const analytics = workspace.analytics;

  if (!analytics) {
    return (
      <DetailCard variant="default" className="border-dashed">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg mb-2">No Analytics Available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Analytics will be available once you add content to this workspace.
          </p>
        </div>
      </DetailCard>
    );
  }

  const { knowledge_counts, content_metrics, team_metrics } = analytics;
  const hasKnowledge = knowledge_counts.total_knowledge_items > 0;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <SectionHeader
        title="Workspace Analytics"
        icon={<BarChart3 className="w-5 h-5" />}
        variant="spacious"
        description="Content metrics and team insights for this workspace"
      />

      {/* Main Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Knowledge Items */}
        <DetailCard
          variant="accent"
          gradient
          className="group hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <BookOpen className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Knowledge
                </p>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {knowledge_counts.total_knowledge_items}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {knowledge_counts.web_knowledge} web
                </span>
                <span className="flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  {knowledge_counts.files} files
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {knowledge_counts.text_knowledge} text
                </span>
              </div>
            </div>
          </div>
        </DetailCard>

        {/* Total Words */}
        <DetailCard
          variant="info"
          gradient
          className="group hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Words
                </p>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {content_metrics.total_words.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Avg. {content_metrics.avg_web_article_words.toLocaleString()}{" "}
                  per article
                </span>
              </div>
            </div>
          </div>
        </DetailCard>

        {/* Reading Time */}
        <DetailCard
          variant="default"
          className="group hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Reading Time
                </p>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {content_metrics.estimated_reading_time_minutes}
                <span className="text-base font-normal text-muted-foreground ml-1">
                  min
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                ~200 words per minute
              </p>
            </div>
          </div>
        </DetailCard>

        {/* Team Members */}
        <DetailCard
          variant="default"
          className="group hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Team Members
                </p>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {team_metrics.total_members}
              </p>
              <p className="text-xs text-muted-foreground">
                Active collaborators
              </p>
            </div>
          </div>
        </DetailCard>
      </div>

      {/* Content Breakdown */}
      {hasKnowledge && (
        <DetailCard variant="highlight">
          <SectionHeader
            title="Content Breakdown"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="compact"
            className="mb-4"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border-2 border-muted/50">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Web Content</span>
                </div>
                <span className="text-lg font-semibold">
                  {content_metrics.web_content_words.toLocaleString()}
                </span>
              </div>
              <div className="pl-3 text-xs text-muted-foreground">
                {knowledge_counts.web_knowledge} web sources •{" "}
                {content_metrics.avg_web_article_words.toLocaleString()} avg
                words
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border-2 border-muted/50">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-green-500" />
                  <span className="font-medium">File Content</span>
                </div>
                <span className="text-lg font-semibold">
                  {content_metrics.file_content_words.toLocaleString()}
                </span>
              </div>
              <div className="pl-3 text-xs text-muted-foreground">
                {knowledge_counts.files} files •{" "}
                {content_metrics.avg_file_words > 0
                  ? `${content_metrics.avg_file_words.toLocaleString()} avg words`
                  : "Processing..."}
              </div>
            </div>
          </div>
        </DetailCard>
      )}
    </div>
  );
}
