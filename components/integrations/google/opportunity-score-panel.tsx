"use client";

import { AlertTriangle, ArrowRight, Clock, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleOpportunityScore } from "@/hooks/use-google-content";
import type { OpportunityPriorityLevel } from "@/types/google-integration";

const PRIORITY_VARIANT: Record<
  OpportunityPriorityLevel,
  "destructive" | "default" | "secondary" | "outline"
> = {
  Critical: "destructive",
  High: "default",
  Medium: "secondary",
  Low: "outline",
};

function scoreColorClass(value: number): string {
  if (value >= 65) return "text-green-500";
  if (value >= 40) return "text-yellow-500";
  return "text-red-500";
}

function formatNumber(value: number | null): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat("en-US").format(Math.round(value));
}

interface OpportunityScorePanelProps {
  workspaceId: string;
  contentId: string;
  days?: number;
}

/** Module 4: opportunity score + modeled outputs for one article. */
export function OpportunityScorePanel({
  workspaceId,
  contentId,
  days = 28,
}: OpportunityScorePanelProps) {
  const { data, isLoading } = useGoogleOpportunityScore(
    workspaceId,
    contentId,
    days,
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Opportunity Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Opportunity Score</CardTitle>
        {data.priority_level && (
          <Badge variant={PRIORITY_VARIANT[data.priority_level]}>
            {data.priority_level} Priority
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {data.capped_due_to_indexing && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not indexed by Google</AlertTitle>
            <AlertDescription>
              This page isn&apos;t confirmed indexed, which caps the opportunity
              score — get it indexed before investing in optimization.
            </AlertDescription>
          </Alert>
        )}

        {data.score === null ? (
          <p className="text-sm text-muted-foreground">
            Not enough synced search data yet to compute an opportunity score.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <CircularProgress
              value={data.score}
              size="lg"
              className={scoreColorClass(data.score)}
            />
            <div>
              <p className="text-2xl font-bold">
                {data.score.toFixed(1)} / 100
              </p>
              <p className="text-sm text-muted-foreground">Opportunity score</p>
            </div>
          </div>
        )}

        {data.target_query && (
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-muted-foreground" />
              Target keyword
            </div>
            <p className="mt-1 text-sm">
              <span className="font-medium">
                &ldquo;{data.target_query}&rdquo;
              </span>
              {data.target_query_impressions !== null && (
                <span className="text-muted-foreground">
                  {" "}
                  — {formatNumber(data.target_query_impressions)} impressions/mo
                </span>
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Current → Target Position
            </p>
            <p className="mt-1 flex items-center gap-1.5 font-medium">
              {data.current_position?.toFixed(1) ?? "—"}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              {data.target_position?.toFixed(1) ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Estimated Ranking Gain
            </p>
            <p className="mt-1 font-medium">
              {data.estimated_ranking_gain !== null
                ? `+${data.estimated_ranking_gain.toFixed(1)} positions`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Estimated Traffic Gain
            </p>
            <p className="mt-1 font-medium">
              {data.estimated_traffic_gain !== null
                ? `+${formatNumber(data.estimated_traffic_gain)} clicks/mo`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Time to Improve
            </p>
            <p className="mt-1 font-medium">
              {data.estimated_time_to_improve ?? "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
