"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress, Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleHealthScore } from "@/hooks/use-google-content";
import type { ContentHealthScoreComponents } from "@/types/google-integration";

const COMPONENT_LABELS: Record<keyof ContentHealthScoreComponents, string> = {
  technical_seo: "Technical SEO",
  seo_optimization: "SEO Optimization",
  content_quality: "Content Quality",
  topical_coverage: "Topical Coverage",
  freshness: "Freshness",
  user_engagement: "User Engagement",
};

function scoreColorClass(value: number): string {
  if (value >= 70) return "text-green-500";
  if (value >= 40) return "text-yellow-500";
  return "text-red-500";
}

function ComponentRow({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={value === null ? "text-muted-foreground" : "font-medium"}
        >
          {value === null ? "N/A" : `${value.toFixed(0)} / 100`}
        </span>
      </div>
      <Progress
        value={value ?? 0}
        className={value === null ? "opacity-30" : undefined}
      />
    </div>
  );
}

interface ContentHealthScorePanelProps {
  workspaceId: string;
  contentId: string;
}

/**
 * Module 3: the 6-component Content Health Score breakdown. The overall
 * number itself is rendered separately via DetailPageWrapper's built-in
 * score card (sidebarConfig) — this panel is the component-level detail.
 */
export function ContentHealthScorePanel({
  workspaceId,
  contentId,
}: ContentHealthScorePanelProps) {
  const { data, isLoading } = useGoogleHealthScore(workspaceId, contentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Health Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Health Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.capped_due_to_indexing && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not indexed by Google</AlertTitle>
            <AlertDescription>
              This page isn&apos;t confirmed indexed, which caps the overall
              score regardless of everything else below — a great article nobody
              can find in search delivers no value. Fix indexing first.
            </AlertDescription>
          </Alert>
        )}

        {data.overall === null ? (
          <p className="text-sm text-muted-foreground">
            Not enough data yet to compute a score for this article.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <CircularProgress
              value={data.overall}
              size="lg"
              className={scoreColorClass(data.overall)}
            />
            <div>
              <p className="text-2xl font-bold">
                {data.overall.toFixed(1)} / 100
              </p>
              <p className="text-sm text-muted-foreground">
                Overall health score
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-2">
          {(
            Object.keys(
              COMPONENT_LABELS,
            ) as (keyof ContentHealthScoreComponents)[]
          ).map((key) => (
            <ComponentRow
              key={key}
              label={COMPONENT_LABELS[key]}
              value={data.components[key]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
