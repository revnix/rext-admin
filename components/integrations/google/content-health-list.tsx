"use client";

import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/types/data-table";
import { useGoogleContentInventory } from "@/hooks/use-google-content";
import { googleScoreQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import type {
  ContentHealthScoreComponents,
  ContentHealthScoreResponse,
  ContentInventoryItem,
} from "@/types/google-integration";

interface ContentHealthRow
  extends Record<string, unknown>,
    ContentInventoryItem {}

interface ContentHealthListProps {
  workspaceId: string;
  workspaceSlug: string;
  days?: number;
}

function scoreColorClass(value: number): string {
  if (value >= 70) return "text-green-500";
  if (value >= 40) return "text-yellow-500";
  return "text-red-500";
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function HealthScoreCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">N/A</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <CircularProgress
        value={value}
        size="sm"
        className={scoreColorClass(value)}
      />
      <span className="text-sm tabular-nums">{value.toFixed(0)}</span>
    </div>
  );
}

function MetricScoreCell({
  value,
  isLoading,
}: {
  value: number | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-4 w-10" />;
  }

  if (value === undefined || value === null) {
    return <span className="text-xs text-muted-foreground">N/A</span>;
  }

  return <span className="text-sm tabular-nums">{value.toFixed(0)}</span>;
}

/** Module 3: standalone workspace list for content health scores. */
export function ContentHealthList({
  workspaceId,
  workspaceSlug,
  days = 28,
}: ContentHealthListProps) {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { data, isLoading } = useGoogleContentInventory(workspaceId, {
    days,
    pageSize: 200,
  });

  const rows: ContentHealthRow[] = useMemo(() => {
    return ([...(data?.items ?? [])] as ContentHealthRow[]).sort((a, b) => {
      const aScore = a.health_score;
      const bScore = b.health_score;

      if (aScore === null && bScore === null) return 0;
      if (aScore === null) return 1;
      if (bScore === null) return -1;

      return sortOrder === "asc" ? aScore - bScore : bScore - aScore;
    });
  }, [data?.items, sortOrder]);

  const healthQueries = useQueries({
    queries: rows.map((row) =>
      googleScoreQueries.healthScore(workspaceId, row.content_id),
    ),
  });

  const healthByContentId = useMemo(() => {
    return new Map(
      rows.map((row, index) => [
        row.content_id,
        {
          data: healthQueries[index]?.data as
            | ContentHealthScoreResponse
            | undefined,
          isLoading: healthQueries[index]?.isLoading ?? false,
        },
      ]),
    );
  }, [healthQueries, rows]);

  const metricCell = (
    row: ContentHealthRow,
    key: keyof ContentHealthScoreComponents,
  ) => {
    const health = healthByContentId.get(row.content_id);
    return (
      <MetricScoreCell
        value={health?.data?.components[key]}
        isLoading={health?.isLoading ?? false}
      />
    );
  };

  const columns: Column<ContentHealthRow>[] = [
    {
      key: "title",
      header: "Article",
      width: "280px",
      searchable: true,
      cell: (value, row) => (
        <div className="w-[260px] min-w-0 overflow-hidden">
          <p className="truncate font-medium text-sm">{value as string}</p>
          {row.url && (
            <a
              href={row.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex max-w-full items-center gap-1 overflow-hidden text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="min-w-0 truncate">{row.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: "health_score",
      header: "Health Score",
      width: "110px",
      cell: (value) => <HealthScoreCell value={value as number | null} />,
    },
    {
      key: "seo_optimization",
      header: "SEO",
      width: "60px",
      cell: (_value, row) => metricCell(row, "seo_optimization"),
    },
    {
      key: "freshness",
      header: "Freshness",
      width: "85px",
      cell: (_value, row) => metricCell(row, "freshness"),
    },
    {
      key: "content_quality",
      header: "Quality",
      width: "75px",
      cell: (_value, row) => metricCell(row, "content_quality"),
    },
    {
      key: "technical_seo",
      header: "Technical",
      width: "85px",
      cell: (_value, row) => metricCell(row, "technical_seo"),
    },
    {
      key: "topical_coverage",
      header: "Topical",
      width: "75px",
      cell: (_value, row) => metricCell(row, "topical_coverage"),
    },
    {
      key: "user_engagement",
      header: "Engagement",
      width: "95px",
      cell: (_value, row) => metricCell(row, "user_engagement"),
    },
    {
      key: "primary_keyword",
      header: "Primary Keyword",
      width: "140px",
      searchable: true,
      cell: (value) =>
        value ? (
          <span className="block w-[125px] truncate text-sm">
            {value as string}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: "95px",
      cell: (value) => (
        <Badge variant="outline" className="w-fit capitalize">
          {value as string}
        </Badge>
      ),
    },
    {
      key: "is_indexed",
      header: "Indexed",
      width: "90px",
      cell: (value) => {
        if (value === null) {
          return (
            <Badge variant="outline" className="text-xs">
              Unknown
            </Badge>
          );
        }

        return value ? (
          <Badge variant="secondary" className="text-xs">
            Indexed
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">
            Not Indexed
          </Badge>
        );
      },
    },
    {
      key: "last_updated",
      header: "Last Updated",
      width: "105px",
      cell: (value) => formatDate(value as string | null),
    },
  ];

  return (
    <DataTable<ContentHealthRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      actions={
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={() =>
            setSortOrder((current) => (current === "asc" ? "desc" : "asc"))
          }
        >
          {sortOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          Health Score
        </Button>
      }
      onRowClick={(row) =>
        router.push(
          workspaceRoutes.googleIntegration.contentHealthDetail(
            workspaceSlug,
            row.content_id,
          ) as never,
        )
      }
      emptyTitle="No health scores found"
      emptyDescription="No tracked content is available to score yet."
      searchPlaceholder="Search by title or keyword..."
      searchFields={["title", "primary_keyword"]}
      pageSize={25}
      pageSizeOptions={[25, 50, 100]}
      tableId="google-content-health-list"
    />
  );
}
