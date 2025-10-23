"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Grid3X3, Layers, List, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import {
  aggregateCounts,
  applyFilters,
  buildUnifiedItems,
} from "@/lib/knowledge/filtering";
import {
  buildDuplicateReasonIndex,
  findKnowledgeDuplicates,
} from "@/lib/knowledge-duplicates";
import { cn } from "@/lib/utils";
import {
  useFileKnowledgeStore,
  useKnowledgeFilterStore,
  useTextKnowledgeStore,
  useWebKnowledgeStore,
} from "@/stores/knowledge";
import { hasActiveKnowledgeFilters } from "@/types/knowledge";
import type { Workspace } from "@/types/workspace";
import { KnowledgeDuplicateSummary } from "../knowledge-duplicates";
import { ActiveFiltersBar } from "./ActiveFiltersBar";
import { FilterBar } from "./FilterBar";
import { KnowledgeCard } from "./KnowledgeCard";
import { KnowledgeRow } from "./KnowledgeRow";
import { KnowledgeSkeleton } from "./KnowledgeSkeleton";

export interface UnifiedKnowledgeListProps {
  workspaceId: string;
  workspace?: Workspace;
}

/**
 * Main unified knowledge list component.
 * Orchestrates data fetching, filtering, and rendering of knowledge items
 * from all sources (web, file, text) in a single view.
 */
export function UnifiedKnowledgeList({
  workspaceId,
  workspace,
}: UnifiedKnowledgeListProps) {
  // Store connections for web knowledge
  const webItems = useWebKnowledgeStore((state) => state.items);
  const setWebItems = useWebKnowledgeStore((state) => state.setItems);
  const setWebLoading = useWebKnowledgeStore((state) => state.setLoading);
  const setWebError = useWebKnowledgeStore((state) => state.setError);

  // Store connections for file knowledge
  const fileItems = useFileKnowledgeStore((state) => state.items);
  const setFileItems = useFileKnowledgeStore((state) => state.setItems);
  const setFileLoading = useFileKnowledgeStore((state) => state.setLoading);
  const setFileError = useFileKnowledgeStore((state) => state.setError);

  // Store connections for text knowledge
  const textItems = useTextKnowledgeStore((state) => state.items);
  const setTextItems = useTextKnowledgeStore((state) => state.setItems);
  const setTextLoading = useTextKnowledgeStore((state) => state.setLoading);
  const setTextError = useTextKnowledgeStore((state) => state.setError);

  // Filter store
  const {
    searchQuery,
    typeFilters,
    statusFilters,
    tagFilters,
    dateRange,
    minWordCount,
    maxWordCount,
    sortBy,
    sortOrder,
    viewMode,
    setSearchQuery,
    toggleTypeFilter,
    toggleStatusFilter,
    addTagFilter,
    removeTagFilter,
    setDateRange,
    setWordCountRange,
    setSort,
    toggleSortOrder,
    setViewMode,
    resetFilters,
  } = useKnowledgeFilterStore();

  const [dateValue, setDateValue] = useState<DateRange | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data queries
  const webQuery = useQuery({
    queryKey: ["web-knowledge", workspaceId],
    queryFn: () => apiClient.knowledge.listWeb(workspaceId),
    staleTime: 2 * 60 * 1000,
    enabled: workspaceId.length > 0,
    select: (response) => response.web_knowledge, // Extract array from response
  });

  const fileQuery = useQuery({
    queryKey: ["file-knowledge", workspaceId],
    queryFn: () => apiClient.knowledge.listFiles(workspaceId),
    staleTime: 2 * 60 * 1000,
    enabled: workspaceId.length > 0,
    select: (response) => response.file_knowledge, // Extract array from response
  });

  const textQuery = useQuery({
    queryKey: ["text-knowledge", workspaceId],
    queryFn: () => apiClient.knowledge.listText(workspaceId),
    staleTime: 2 * 60 * 1000,
    enabled: workspaceId.length > 0,
    select: (response) => response.text_knowledge, // Extract array from response
  });

  // Sync web query state to store
  useEffect(() => {
    setWebLoading(webQuery.isLoading || webQuery.isFetching);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webQuery.isLoading, webQuery.isFetching, setWebLoading]);

  useEffect(() => {
    setWebError(webQuery.error ? "Failed to load web knowledge" : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webQuery.error, setWebError]);

  useEffect(() => {
    if (webQuery.data) {
      setWebItems(webQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webQuery.data, setWebItems]);

  // Sync file query state to store
  useEffect(() => {
    setFileLoading(fileQuery.isLoading || fileQuery.isFetching);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileQuery.isLoading, fileQuery.isFetching, setFileLoading]);

  useEffect(() => {
    setFileError(fileQuery.error ? "Failed to load file knowledge" : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileQuery.error, setFileError]);

  useEffect(() => {
    if (fileQuery.data) {
      setFileItems(fileQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileQuery.data, setFileItems]);

  // Sync text query state to store
  useEffect(() => {
    setTextLoading(textQuery.isLoading || textQuery.isFetching);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textQuery.isLoading, textQuery.isFetching, setTextLoading]);

  useEffect(() => {
    setTextError(textQuery.error ? "Failed to load text knowledge" : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textQuery.error, setTextError]);

  useEffect(() => {
    if (textQuery.data) {
      setTextItems(textQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textQuery.data, setTextItems]);

  // Sync date value with date range filter
  useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
      setDateValue(undefined);
      return;
    }

    const selection: DateRange = {
      from: dateRange.from ? new Date(dateRange.from) : undefined,
      to: dateRange.to ? new Date(dateRange.to) : undefined,
    };
    setDateValue(selection);
  }, [dateRange.from, dateRange.to]);

  // Build unified items from all sources with empty array fallbacks
  const unifiedItems = useMemo(
    () =>
      buildUnifiedItems(
        workspaceId,
        webItems || [],
        fileItems || [],
        textItems || [],
      ),
    [workspaceId, webItems, fileItems, textItems],
  );

  // Apply filters
  const filteredItems = useMemo(
    () =>
      applyFilters(unifiedItems, {
        searchQuery,
        typeFilters,
        statusFilters,
        tagFilters,
        dateRange,
        minWordCount,
        maxWordCount,
        sortBy,
        sortOrder,
        viewMode,
      }),
    [
      unifiedItems,
      searchQuery,
      typeFilters,
      statusFilters,
      tagFilters,
      dateRange,
      minWordCount,
      maxWordCount,
      sortBy,
      sortOrder,
      viewMode,
    ],
  );

  // Aggregate counts
  const counts = useMemo(() => aggregateCounts(unifiedItems), [unifiedItems]);

  // Duplicate detection
  const duplicateGroups = useMemo(
    () => findKnowledgeDuplicates(unifiedItems),
    [unifiedItems],
  );

  const duplicateReasonIndex = useMemo(
    () => buildDuplicateReasonIndex(duplicateGroups),
    [duplicateGroups],
  );

  // Extract available filter options
  const availableStatuses = useMemo(() => {
    const statuses = new Set<
      import("@/types/knowledge").UnifiedKnowledgeStatus
    >();
    unifiedItems.forEach((item) => {
      if (item.status) {
        statuses.add(item.status);
      }
    });
    return Array.from(statuses).sort();
  }, [unifiedItems]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    unifiedItems.forEach((item) => {
      item.tags?.forEach((tag) => {
        tags.add(tag);
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [unifiedItems]);

  // Loading and error states
  const isLoading =
    webQuery.isLoading ||
    fileQuery.isLoading ||
    textQuery.isLoading ||
    (isRefreshing && filteredItems.length === 0);

  const hasError = webQuery.error || fileQuery.error || textQuery.error;

  // Event handlers
  const handleDateChange = (range: DateRange | undefined) => {
    setDateValue(range);
    const from = range?.from ? format(range.from, "yyyy-MM-dd") : null;
    const to = range?.to ? format(range.to, "yyyy-MM-dd") : null;
    setDateRange(from, to);
  };

  const handleWordCountChange = (type: "min" | "max", value: string) => {
    const parsed = value === "" ? null : Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      if (type === "min") {
        setWordCountRange(null, maxWordCount);
      } else {
        setWordCountRange(minWordCount, null);
      }
      return;
    }

    if (type === "min") {
      setWordCountRange(parsed, maxWordCount);
    } else {
      setWordCountRange(minWordCount, parsed);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        webQuery.refetch(),
        fileQuery.refetch(),
        textQuery.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeFilters = hasActiveKnowledgeFilters({
    searchQuery,
    typeFilters,
    statusFilters,
    tagFilters,
    dateRange,
    minWordCount,
    maxWordCount,
    sortBy,
    sortOrder,
    viewMode,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <Layers className="h-5 w-5 text-muted-foreground" />
                Unified Knowledge
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {workspace?.title ? `${workspace.title} · ` : ""}
                {counts.total} item{counts.total === 1 ? "" : "s"} across web,
                files, and text sources
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
                <span className="sr-only">Refresh</span>
              </Button>
              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <FilterBar
            searchQuery={searchQuery}
            typeFilters={typeFilters}
            statusFilters={statusFilters}
            tagFilters={tagFilters}
            dateRange={dateRange}
            dateValue={dateValue}
            minWordCount={minWordCount}
            maxWordCount={maxWordCount}
            sortBy={sortBy}
            sortOrder={sortOrder}
            availableStatuses={availableStatuses}
            availableTags={availableTags}
            counts={counts}
            onSearchChange={setSearchQuery}
            onToggleTypeFilter={toggleTypeFilter}
            onToggleStatusFilter={toggleStatusFilter}
            onAddTagFilter={addTagFilter}
            onRemoveTagFilter={removeTagFilter}
            onDateChange={handleDateChange}
            onClearDates={() => setDateRange(null, null)}
            onWordCountChange={handleWordCountChange}
            onClearWordCount={() => setWordCountRange(null, null)}
            onSortChange={setSort}
            onToggleSortOrder={toggleSortOrder}
            onResetFilters={resetFilters}
            activeFilters={activeFilters}
          />

          {/* Active filters bar */}
          <ActiveFiltersBar
            filters={{
              searchQuery,
              typeFilters,
              statusFilters,
              tagFilters,
              dateRange,
              minWordCount,
              maxWordCount,
              sortBy,
              sortOrder,
              viewMode,
            }}
            onRemoveType={toggleTypeFilter}
            onRemoveStatus={toggleStatusFilter}
            onRemoveTag={removeTagFilter}
            onClearDates={() => setDateRange(null, null)}
            onClearWordCount={() => setWordCountRange(null, null)}
          />
        </CardHeader>
      </Card>

      {/* Duplicate detection summary */}
      {duplicateGroups.length > 0 && (
        <KnowledgeDuplicateSummary groups={duplicateGroups} />
      )}

      {/* Content area */}
      {hasError ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-base font-semibold text-destructive">
              Unable to load knowledge items
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              One or more knowledge sources failed to load. Retry refreshing to
              attempt fetching the latest data.
            </p>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
              />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <KnowledgeSkeleton viewMode={viewMode} />
      ) : filteredItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Layers className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              No knowledge matches your filters
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Try adjusting the filters or search query. You can also reset all
              filters to start over.
            </p>
            <Button variant="outline" onClick={() => resetFilters()}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <KnowledgeCard
              key={`${item.type}-${item.id}`}
              item={item}
              duplicateReasons={duplicateReasonIndex[item.id] ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <KnowledgeRow
              key={`${item.type}-${item.id}`}
              item={item}
              duplicateReasons={duplicateReasonIndex[item.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
