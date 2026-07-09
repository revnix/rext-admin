"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGoogleContentPerformance } from "@/hooks/use-google-content";

interface ContentKeywordAnalyticsPanelProps {
  workspaceId: string;
  contentId: string;
  primaryKeyword?: string | null;
  supportingKeywords?: string[] | null;
  days?: number;
}

/** Rows are stored oldest-first; show the 8 most recent, newest first. */
function recentHistory<T>(rows: T[], count: number): T[] {
  return rows.slice(-count).reverse();
}

function PositionDelta({ delta }: { delta: number }) {
  if (delta > 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-xs">
        <TrendingUp className="h-3 w-3" /> +{delta.toFixed(1)}
      </span>
    );
  }
  if (delta < -0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs">
        <TrendingDown className="h-3 w-3" /> {delta.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
      <Minus className="h-3 w-3" /> —
    </span>
  );
}

/**
 * Keyword Analytics section: primary/supporting keywords come from the
 * content's existing SEO data (no new backend endpoint needed); ranking
 * history reuses the daily GSC metrics from `/content/{id}/performance`
 * (the same data source as the Overview position trend chart, shown here
 * as a dated table rather than a chart).
 */
export function ContentKeywordAnalyticsPanel({
  workspaceId,
  contentId,
  primaryKeyword,
  supportingKeywords,
  days = 90,
}: ContentKeywordAnalyticsPanelProps) {
  const { data, isLoading } = useGoogleContentPerformance(
    workspaceId,
    contentId,
    days,
  );

  const rows = data?.search_console ?? [];
  const history = recentHistory(rows, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-1.5 text-sm font-medium text-muted-foreground">
            Primary Keyword
          </p>
          {primaryKeyword ? (
            <Badge variant="secondary" className="text-sm">
              {primaryKeyword}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              No primary keyword set for this article.
            </span>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-muted-foreground">
            Supporting Keywords
          </p>
          {supportingKeywords && supportingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {supportingKeywords.map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-sm">
                  {keyword}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              No supporting keywords set for this article.
            </span>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Ranking History
          </p>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : history.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Avg. Position</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Impressions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row, i) => {
                    const previous = history[i + 1];
                    const delta = previous
                      ? previous.position - row.position
                      : 0;
                    return (
                      <TableRow key={row.date}>
                        <TableCell className="text-sm">
                          {new Date(row.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {row.position.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <PositionDelta delta={delta} />
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {row.clicks}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {row.impressions}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              No ranking history synced yet for this article.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
