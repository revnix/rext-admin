"use client";

import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/types/data-table";
import { useGoogleContentInventory } from "@/hooks/use-google-content";
import { workspaceRoutes } from "@/lib/routes";
import {
  CONTENT_INVENTORY_FILTERS,
  type ContentInventoryFilter,
  type ContentInventoryItem,
  type ContentInventorySortField,
} from "@/types/google-integration";

const SORT_FIELD_LABELS: Record<ContentInventorySortField, string> = {
  title: "Title",
  status: "Status",
  opportunity_score: "Opportunity Score",
  organic_clicks: "Clicks",
  organic_impressions: "Impressions",
  ctr: "CTR",
  average_position: "Avg. Position",
  last_updated: "Last Updated",
};
const SORT_FIELDS = Object.keys(
  SORT_FIELD_LABELS,
) as ContentInventorySortField[];

const FILTER_LABELS: Record<ContentInventoryFilter, string> = {
  published: "Published",
  growing: "Growing",
  declining: "Declining",
  needs_update: "Needs Update",
  high_opportunity: "High Opportunity",
  low_ctr: "Low CTR",
  not_indexed: "Not Indexed",
  cannibalized: "Cannibalized",
};

interface InventoryRow extends Record<string, unknown>, ContentInventoryItem {}

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">N/A</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <CircularProgress
        value={value}
        size="sm"
        className={
          value >= 70
            ? "text-green-500"
            : value >= 40
              ? "text-yellow-500"
              : "text-red-500"
        }
      />
      <span className="text-sm tabular-nums">{value.toFixed(0)}</span>
    </div>
  );
}

function TrendCell({ trend }: { trend: ContentInventoryItem["trend"] }) {
  if (trend === "growing") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
        <TrendingUp className="h-3.5 w-3.5" /> Growing
      </span>
    );
  }
  if (trend === "declining") {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-sm">
        <TrendingDown className="h-3.5 w-3.5" /> Declining
      </span>
    );
  }
  if (trend === "stable") {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-3.5 w-3.5" /> Stable
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      {trend === "new" ? "New" : "—"}
    </span>
  );
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number | null): string {
  return value === null ? "—" : new Intl.NumberFormat("en-US").format(value);
}

interface ContentInventoryTableProps {
  workspaceId: string;
  workspaceSlug: string;
  siteId?: string;
  days?: number;
}

export function ContentInventoryTable({
  workspaceId,
  workspaceSlug,
  siteId,
  days = 28,
}: ContentInventoryTableProps) {
  const router = useRouter();
  const [activeFilters, setActiveFilters] = useState<ContentInventoryFilter[]>(
    [],
  );
  const [sortBy, setSortBy] =
    useState<ContentInventorySortField>("opportunity_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useGoogleContentInventory(workspaceId, {
    days,
    pageSize: 200,
    filters: activeFilters.length > 0 ? activeFilters : undefined,
    sortBy,
    sortOrder,
    siteId,
  });

  const toggleFilter = (filter: ContentInventoryFilter) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  const columns: Column<InventoryRow>[] = [
    {
      key: "title",
      header: "Title",
      width: "260px",
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
      key: "primary_keyword",
      header: "Primary Keyword",
      width: "160px",
      searchable: true,
      cell: (value) =>
        value ? (
          <span className="text-sm">{value as string}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      cell: (value, row) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="w-fit capitalize">
            {value as string}
          </Badge>
          {row.is_cannibalized && (
            <Badge variant="destructive" className="w-fit text-xs">
              Cannibalized
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "health_score",
      header: "Health Score",
      width: "130px",
      cell: (value) => <ScoreCell value={value as number | null} />,
    },
    {
      key: "opportunity_score",
      header: "Opportunity Score",
      width: "150px",
      cell: (value) => <ScoreCell value={value as number | null} />,
    },
    {
      key: "organic_clicks",
      header: "Clicks",
      width: "90px",
      cell: (value) => formatNumber(value as number | null),
    },
    {
      key: "organic_impressions",
      header: "Impressions",
      width: "110px",
      cell: (value) => formatNumber(value as number | null),
    },
    {
      key: "ctr",
      header: "CTR",
      width: "80px",
      cell: (value) => formatPercent(value as number | null),
    },
    {
      key: "average_position",
      header: "Avg. Position",
      width: "110px",
      cell: (value) => (value === null ? "—" : (value as number).toFixed(1)),
    },
    {
      key: "trend",
      header: "Trend",
      width: "120px",
      cell: (value) => (
        <TrendCell trend={value as ContentInventoryItem["trend"]} />
      ),
    },
    {
      key: "is_indexed",
      header: "Indexed",
      width: "100px",
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
      width: "120px",
      cell: (value) =>
        value ? new Date(value as string).toLocaleDateString() : "—",
    },
    {
      key: "ai_recommendation",
      header: "AI Recommendation",
      width: "160px",
      cell: (value) =>
        value ? (
          <span className="text-sm">{value as string}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Coming soon</span>
        ),
    },
  ];

  const rows: InventoryRow[] = (data?.items ?? []) as InventoryRow[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {CONTENT_INVENTORY_FILTERS.map((filter) => {
            const isActive = activeFilters.includes(filter);
            return (
              <Button
                key={filter}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => toggleFilter(filter)}
                aria-pressed={isActive}
              >
                {FILTER_LABELS[filter]}
              </Button>
            );
          })}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters([])}
              className="text-muted-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as ContentInventorySortField)
            }
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELDS.map((field) => (
                <SelectItem key={field} value={field}>
                  {SORT_FIELD_LABELS[field]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            aria-label={
              sortOrder === "asc" ? "Sort ascending" : "Sort descending"
            }
          >
            {sortOrder === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <DataTable<InventoryRow>
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
        emptyTitle="No content found"
        emptyDescription={
          activeFilters.length > 0
            ? "No articles match the selected filters."
            : "No published content is tracked yet."
        }
        searchPlaceholder="Search by title or keyword..."
        searchFields={["title", "primary_keyword"]}
        pageSize={25}
        pageSizeOptions={[25, 50, 100]}
        tableId="google-content-inventory"
      />
    </div>
  );
}
