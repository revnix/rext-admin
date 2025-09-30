"use client";

import {
  BarChart3,
  Clock,
  FileText,
  Layers,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { buildKnowledgeAnalyticsSummary } from "@/lib/knowledge-analytics";
import {
  useFileKnowledgeStore,
  useTextKnowledgeStore,
  useWebKnowledgeStore,
} from "@/stores/knowledge-store";
import type {
  KnowledgeTypeMetric,
  UnifiedKnowledgeItem,
} from "@/types/knowledge";
import type { Workspace } from "@/types/workspace";

const _ANALYTICS_SKELETON_KEYS = [
  "analytics-skeleton-1",
  "analytics-skeleton-2",
  "analytics-skeleton-3",
  "analytics-skeleton-4",
] as const;

interface KnowledgeAnalyticsProps {
  workspaceId: string;
  workspace?: Workspace;
}

const formatPercent = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }
  return `${Math.round(value * 100)}%`;
};

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString();
};

const renderTypeBadge = (metric: KnowledgeTypeMetric) => {
  const variantByType: Record<string, "default" | "secondary" | "outline"> = {
    web: "default",
    file: "secondary",
    text: "outline",
  };

  return (
    <Badge
      key={`type-${metric.type}`}
      variant={variantByType[metric.type] ?? "default"}
      className="capitalize"
    >
      {metric.type} · {formatPercent(metric.percentage)}
    </Badge>
  );
};

const renderRecentItem = (item: UnifiedKnowledgeItem) => {
  const createdDate = new Date(item.createdAt);
  const formattedDate = Number.isNaN(createdDate.getTime())
    ? "Unknown"
    : createdDate.toLocaleDateString();
  const subtitle = item.subtitle || item.url;

  return (
    <div
      key={`recent-${item.id}`}
      className="border rounded-lg p-3 flex flex-col gap-1 bg-muted/30"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium line-clamp-1">{item.title}</span>
        <Badge variant="secondary" className="capitalize">
          {item.type}
        </Badge>
      </div>
      {subtitle && (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {subtitle}
        </span>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formattedDate}</span>
        {item.status && <span className="capitalize">{item.status}</span>}
      </div>
    </div>
  );
};

export function KnowledgeAnalytics({
  workspaceId,
  workspace,
}: KnowledgeAnalyticsProps) {
  // Use separate selectors to avoid creating new objects on every render
  const webItems = useWebKnowledgeStore((state) => state.items);
  const webIsLoading = useWebKnowledgeStore((state) => state.isLoading);
  const fileItems = useFileKnowledgeStore((state) => state.items);
  const fileIsLoading = useFileKnowledgeStore((state) => state.isLoading);
  const textItems = useTextKnowledgeStore((state) => state.items);
  const textIsLoading = useTextKnowledgeStore((state) => state.isLoading);

  const isLoading = webIsLoading || fileIsLoading || textIsLoading;

  // Use store items if available, otherwise fallback to workspace data
  const finalWebItems =
    webItems.length > 0 ? webItems : (workspace?.websites ?? []);
  const finalFileItems =
    fileItems.length > 0 ? fileItems : (workspace?.knowledge_files ?? []);
  const finalTextItems =
    textItems.length > 0 ? textItems : (workspace?.text_knowledge ?? []);

  const analytics = useMemo(
    () =>
      buildKnowledgeAnalyticsSummary({
        workspaceId,
        webItems: finalWebItems,
        fileItems: finalFileItems,
        textItems: finalTextItems,
      }),
    [workspaceId, finalWebItems, finalFileItems, finalTextItems],
  );

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, _index) => (
          <Card key={`analytics-skeleton-${crypto.randomUUID()}`}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (analytics.totals.totalItems === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center space-y-3">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-medium">No knowledge analytics yet</h3>
            <p className="text-sm text-muted-foreground">
              Add web, file, or text knowledge to unlock workspace insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentItems = analytics.recentItems;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Knowledge Totals
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-2xl font-semibold">
                {analytics.totals.totalItems.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-semibold">
                {formatPercent(analytics.totals.completionRate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-medium">
                {analytics.totals.completedItems.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-lg font-medium">
                {analytics.totals.inProgressItems.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-medium">
                {analytics.totals.failedItems.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Word Count</p>
            <p className="text-lg font-semibold">
              {formatNumber(analytics.totals.totalWordCount)}
            </p>
            {analytics.totals.averageWordCount && (
              <p className="text-xs text-muted-foreground mt-1">
                Avg. {analytics.totals.averageWordCount.toLocaleString()} words
                per item
              </p>
            )}
            {analytics.totals.totalCharCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(analytics.totals.totalCharCount)} total characters
              </p>
            )}
          </div>
          {analytics.updatedAt && (
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(analytics.updatedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Status Breakdown
          </CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.statusMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Statuses will appear once processing begins.
            </p>
          ) : (
            analytics.statusMetrics.map((metric) => (
              <div key={`status-${metric.status}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground">
                    {metric.status}
                  </span>
                  <span>{formatPercent(metric.percentage)}</span>
                </div>
                <Progress value={metric.percentage * 100} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Knowledge Types
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {analytics.typeMetrics.map(renderTypeBadge)}
          </div>
          <div className="grid gap-2">
            {analytics.typeMetrics.map((metric) => (
              <div key={`type-row-${metric.type}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground">
                    {metric.type}
                  </span>
                  <span>{metric.count.toLocaleString()} items</span>
                </div>
                <Progress value={metric.percentage * 100} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Recent Knowledge Activity
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {recentItems.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>No recent knowledge updates</span>
            </div>
          ) : (
            recentItems.map(renderRecentItem)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
