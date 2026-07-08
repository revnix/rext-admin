"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/progress";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/types/data-table";
import { useGoogleRankedOpportunities } from "@/hooks/use-google-content";
import { workspaceRoutes } from "@/lib/routes";
import type {
  OpportunityPriorityLevel,
  OpportunityRankedItem,
} from "@/types/google-integration";

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

interface OpportunityRow
  extends Record<string, unknown>,
    OpportunityRankedItem {}

interface OpportunityRankedListProps {
  workspaceId: string;
  workspaceSlug: string;
  days?: number;
}

/** Module 4: "Ranks articles" — every published article ordered by opportunity score. */
export function OpportunityRankedList({
  workspaceId,
  workspaceSlug,
  days = 28,
}: OpportunityRankedListProps) {
  const router = useRouter();
  const { data, isLoading } = useGoogleRankedOpportunities(workspaceId, {
    days,
    pageSize: 200,
  });

  const columns: Column<OpportunityRow>[] = [
    {
      key: "title",
      header: "Article",
      width: "280px",
      searchable: true,
      cell: (value, row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{value as string}</p>
          {row.url && (
            <a
              href={row.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate"
            >
              {row.url} <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      width: "110px",
      cell: (value) => {
        const score = value as number | null;
        if (score === null)
          return <span className="text-xs text-muted-foreground">N/A</span>;
        return (
          <div className="flex items-center gap-2">
            <CircularProgress
              value={score}
              size="sm"
              className={scoreColorClass(score)}
            />
            <span className="text-sm tabular-nums">{score.toFixed(0)}</span>
          </div>
        );
      },
    },
    {
      key: "priority_level",
      header: "Priority",
      width: "110px",
      cell: (value) => {
        const priority = value as OpportunityPriorityLevel | null;
        return priority ? (
          <Badge variant={PRIORITY_VARIANT[priority]}>{priority}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "target_query",
      header: "Target Keyword",
      width: "180px",
      cell: (value) =>
        value ? (
          <span className="text-sm">{value as string}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "current_position",
      header: "Position → Target",
      width: "140px",
      cell: (_value, row) =>
        row.current_position !== null && row.target_position !== null ? (
          <span className="text-sm tabular-nums">
            {row.current_position.toFixed(1)} → {row.target_position.toFixed(1)}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "estimated_traffic_gain",
      header: "Est. Traffic Gain",
      width: "140px",
      cell: (value) =>
        value !== null ? `+${formatNumber(value as number)} clicks/mo` : "—",
    },
    {
      key: "estimated_time_to_improve",
      header: "Time to Improve",
      width: "160px",
      cell: (value) => (value as string) ?? "—",
    },
  ];

  const rows: OpportunityRow[] = (data?.items ?? []) as OpportunityRow[];

  return (
    <DataTable<OpportunityRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      onRowClick={(row) =>
        router.push(
          workspaceRoutes.googleIntegration.contentDetail(
            workspaceSlug,
            row.content_id,
          ) as never,
        )
      }
      emptyTitle="No opportunities found"
      emptyDescription="No published, synced content is available to rank yet."
      searchPlaceholder="Search by title or keyword..."
      searchFields={["title", "target_query"]}
      pageSize={25}
      pageSizeOptions={[25, 50, 100]}
      tableId="google-opportunity-ranked-list"
    />
  );
}
