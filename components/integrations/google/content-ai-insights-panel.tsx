"use client";

import { useState } from "react";
import {
  ArrowRight,
  History,
  Loader2,
  type LucideIcon,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InsufficientCreditsModal } from "@/components/subscription/insufficient-credits-modal";
import { useGoogleRankingDiagnosis } from "@/hooks/use-google-content";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client/core";
import type {
  RankingDiagnosisClassification,
  RankingDiagnosisResponse,
} from "@/types/google-integration";

interface ClassificationMeta {
  label: string;
  icon: LucideIcon;
  badgeClassName: string;
}

const CLASSIFICATION_META: Record<
  RankingDiagnosisClassification,
  ClassificationMeta
> = {
  ranking_drop: {
    label: "Ranking Drop",
    icon: TrendingDown,
    badgeClassName:
      "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  visibility_drop: {
    label: "Visibility Drop",
    icon: TrendingDown,
    badgeClassName:
      "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  ctr_collapse: {
    label: "CTR Collapse",
    icon: Search,
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  improving: {
    label: "Improving",
    icon: TrendingUp,
    badgeClassName:
      "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400",
  },
  stable: {
    label: "Stable",
    icon: History,
    badgeClassName: "border-transparent bg-muted text-muted-foreground",
  },
  no_data: {
    label: "Not enough data",
    icon: History,
    badgeClassName: "border-transparent bg-muted text-muted-foreground",
  },
};

// Classifications where "No decline to explain" applies — the backend
// skips the AI call entirely for these, so don't spend a click/credit
// offering a button that can't do anything.
const AI_EXPLAINABLE: RankingDiagnosisClassification[] = [
  "ranking_drop",
  "ctr_collapse",
  "visibility_drop",
];

function formatPct(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function deltaColorClass(value: number | null, higherIsBetter: boolean) {
  if (value === null || value === 0) return "text-muted-foreground";
  const isPositive = value > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;
  return isGood
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

interface ContentAiInsightsPanelProps {
  workspaceId: string;
  contentId: string;
  days?: number;
}

/** Module 5 (AI Diagnosis): why this article's search performance changed. */
export function ContentAiInsightsPanel({
  workspaceId,
  contentId,
  days = 28,
}: ContentAiInsightsPanelProps) {
  const { data, isLoading } = useGoogleRankingDiagnosis(
    workspaceId,
    contentId,
    days,
  );

  const [aiResult, setAiResult] = useState<RankingDiagnosisResponse | null>(
    null,
  );
  const [isExplaining, setIsExplaining] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsError, setCreditsError] = useState<{
    code: 402 | 429;
    detail: string;
  } | null>(null);

  const display = aiResult ?? data;

  const handleExplainWithAi = async () => {
    setIsExplaining(true);
    try {
      const result = await apiClient.googleIntegration.getRankingDiagnosis(
        workspaceId,
        contentId,
        { days, generateAiSummary: true },
      );
      setAiResult(result);
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.statusCode === 402 || error.statusCode === 429)
      ) {
        setCreditsError({ code: error.statusCode, detail: error.message });
        setShowCreditsModal(true);
      } else {
        toast.error("Couldn't generate an AI explanation. Please try again.");
      }
    } finally {
      setIsExplaining(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!display) {
    return null;
  }

  const meta = CLASSIFICATION_META[display.classification];
  const canExplainWithAi =
    AI_EXPLAINABLE.includes(display.classification) && !display.ai_generated;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            AI Insights
          </CardTitle>
          <Badge className={meta.badgeClassName} variant="outline">
            <meta.icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          {display.classification === "no_data" ? (
            <p className="text-sm text-muted-foreground">
              Not enough search history yet to diagnose this article's
              performance.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-sm">{display.summary}</p>
                {display.ai_generated && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    AI-enhanced explanation
                  </p>
                )}
                {!display.ai_generated && display.ai_unavailable_reason && (
                  <p className="text-xs text-muted-foreground">
                    {display.ai_unavailable_reason}
                  </p>
                )}
              </div>

              {display.top_query && (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    Top query
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">
                      &ldquo;{display.top_query}&rdquo;
                    </span>
                    {display.top_query_position !== null && (
                      <span className="text-muted-foreground">
                        {" "}
                        — position {display.top_query_position.toFixed(1)}
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Position</p>
                  <p className="mt-1 flex items-center gap-1.5 font-medium">
                    {display.position_previous?.toFixed(1) ?? "—"}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    {display.position_current?.toFixed(1) ?? "—"}
                  </p>
                  <p
                    className={`text-xs ${deltaColorClass(display.position_delta, false)}`}
                  >
                    {display.position_delta !== null
                      ? `${display.position_delta > 0 ? "+" : ""}${display.position_delta.toFixed(1)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                  <p className="mt-1 font-medium">
                    {Math.round(display.clicks_current)}
                  </p>
                  <p
                    className={`text-xs ${deltaColorClass(display.clicks_delta_pct, true)}`}
                  >
                    {formatPct(display.clicks_delta_pct)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                  <p className="mt-1 font-medium">
                    {Math.round(display.impressions_current)}
                  </p>
                  <p
                    className={`text-xs ${deltaColorClass(display.impressions_delta_pct, true)}`}
                  >
                    {formatPct(display.impressions_delta_pct)}
                  </p>
                </div>
              </div>

              {display.signals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Detected signals
                  </p>
                  {display.signals.map((signal) => (
                    <div key={signal.key} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{signal.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {signal.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {canExplainWithAi && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExplainWithAi}
                  disabled={isExplaining}
                >
                  {isExplaining ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Explain with AI
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <InsufficientCreditsModal
        open={showCreditsModal}
        onOpenChange={setShowCreditsModal}
        statusCode={creditsError?.code}
        errorDetail={creditsError?.detail}
      />
    </>
  );
}
