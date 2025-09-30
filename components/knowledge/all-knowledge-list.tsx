"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Check,
  Filter,
  Grid3X3,
  Layers,
  List,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  buildDuplicateReasonIndex,
  findKnowledgeDuplicates,
} from "@/lib/knowledge-duplicates";
import { cn } from "@/lib/utils";
import {
  fileKnowledgeService,
  textKnowledgeService,
  webKnowledgeService,
} from "@/services/knowledge-api";
import {
  useFileKnowledgeStore,
  useKnowledgeFilterStore,
  useTextKnowledgeStore,
  useWebKnowledgeStore,
} from "@/stores/knowledge-store";
import {
  hasActiveKnowledgeFilters,
  type KnowledgeDuplicateReason,
  type KnowledgeFilterState,
  type KnowledgeListViewMode,
  type UnifiedKnowledgeItem,
  type UnifiedKnowledgeStatus,
} from "@/types/knowledge";
import type {
  FileKnowledge,
  KnowledgeType,
  TextKnowledge,
  WebKnowledge,
  Workspace,
} from "@/types/workspace";
import { KnowledgeDuplicateSummary } from "./knowledge-duplicates";

interface AllKnowledgeListProps {
  workspaceId: string;
  workspace?: Workspace;
}

const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  web: "Web",
  file: "Files",
  text: "Text",
};

const STATUS_LABELS: Record<UnifiedKnowledgeStatus, string> = {
  pending: "Pending",
  scraping: "Scraping",
  processing: "Processing",
  uploading: "Uploading",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_CLASSES: Record<UnifiedKnowledgeStatus, string> = {
  pending:
    "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-200",
  scraping:
    "border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-200",
  processing:
    "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-200",
  uploading:
    "border-indigo-300 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-200",
  completed:
    "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-200",
  failed:
    "border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-200",
};

const TYPE_COLORS: Record<KnowledgeType, string> = {
  web: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
  file: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
  text: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800",
};

const DUPLICATE_REASON_LABELS: Record<KnowledgeDuplicateReason, string> = {
  url: "Matching URL",
  title: "Matching Title",
  content: "Similar Content",
};

const formatDuplicateBadgeText = (reasons: KnowledgeDuplicateReason[]) => {
  if (reasons.length === 0) {
    return "";
  }

  if (reasons.length === 1) {
    return DUPLICATE_REASON_LABELS[reasons[0]];
  }

  return "Multiple similarities";
};

const MAX_PREVIEW_LENGTH = 160;
const GRID_SKELETON_KEYS = [
  "knowledge-grid-1",
  "knowledge-grid-2",
  "knowledge-grid-3",
  "knowledge-grid-4",
  "knowledge-grid-5",
  "knowledge-grid-6",
] as const;
const LIST_SKELETON_KEYS = [
  "knowledge-list-1",
  "knowledge-list-2",
  "knowledge-list-3",
  "knowledge-list-4",
  "knowledge-list-5",
] as const;

const formatPreview = (content?: string | null) => {
  if (!content) return "";
  if (content.length <= MAX_PREVIEW_LENGTH) return content;
  return `${content.slice(0, MAX_PREVIEW_LENGTH)}…`;
};

const toDateString = (value: string | null) => {
  if (!value) return "";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return value;
  }
};

const buildUnifiedItems = (
  workspaceId: string,
  webItems: WebKnowledge[],
  fileItems: FileKnowledge[],
  textItems: TextKnowledge[],
): UnifiedKnowledgeItem[] => {
  const items: UnifiedKnowledgeItem[] = [];

  webItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      items.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "web",
        title: item.title || item.url || "Untitled",
        subtitle: item.url,
        url: item.url,
        status: item.status,
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        preview: formatPreview(item.content),
        source: item,
      });
    });

  fileItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      const displayName =
        "file_name" in item && typeof item.file_name === "string"
          ? item.file_name
          : item.name;

      items.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "file",
        title: displayName || "Untitled File",
        subtitle: item.type,
        status: item.status,
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        preview: formatPreview(item.content),
        source: item,
      });
    });

  textItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      items.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "text",
        title: item.title || "Untitled Note",
        preview: formatPreview(item.content),
        status: undefined,
        tags: item.tags || [],
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        source: item,
      });
    });

  return items;
};

const applyFilters = (
  items: UnifiedKnowledgeItem[],
  filters: KnowledgeFilterState,
): UnifiedKnowledgeItem[] => {
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
  } = filters;

  const query = searchQuery.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (typeFilters.length > 0 && !typeFilters.includes(item.type)) {
      return false;
    }

    if (statusFilters.length > 0) {
      if (!item.status || !statusFilters.includes(item.status)) {
        return false;
      }
    }

    if (tagFilters.length > 0) {
      const tags = item.tags || [];
      const matches = tagFilters.every((tag) =>
        tags.some((current) => current.toLowerCase() === tag.toLowerCase()),
      );
      if (!matches) {
        return false;
      }
    }

    if (dateRange.from) {
      const created = new Date(item.createdAt).getTime();
      const from = new Date(dateRange.from).getTime();
      if (Number.isFinite(created) && created < from) {
        return false;
      }
    }

    if (dateRange.to) {
      const created = new Date(item.createdAt).getTime();
      const to = new Date(dateRange.to).getTime();
      if (Number.isFinite(created) && created > to) {
        return false;
      }
    }

    const wordCount = item.wordCount ?? item.charCount ?? 0;
    if (minWordCount !== null && wordCount < minWordCount) {
      return false;
    }
    if (maxWordCount !== null && wordCount > maxWordCount) {
      return false;
    }

    if (query.length > 0) {
      const haystacks = [
        item.title,
        item.subtitle,
        item.url,
        item.preview,
        ...(item.tags || []),
      ]
        .filter(
          (value): value is string => value !== null && value !== undefined,
        )
        .map((value) => String(value).toLowerCase());

      const hasMatch = haystacks.some((value) => value.includes(query));
      if (!hasMatch) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;

    switch (sortBy) {
      case "title": {
        return factor * a.title.localeCompare(b.title);
      }
      case "type": {
        return factor * a.type.localeCompare(b.type);
      }
      case "status": {
        return factor * (a.status || "").localeCompare(b.status || "");
      }
      case "word_count": {
        const aCount = a.wordCount ?? a.charCount ?? 0;
        const bCount = b.wordCount ?? b.charCount ?? 0;
        return factor * (aCount - bCount);
      }
      case "updated_at": {
        const aDate = new Date(a.updatedAt || a.createdAt).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt).getTime();
        return factor * (aDate - bDate);
      }
      default: {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return factor * (aDate - bDate);
      }
    }
  });

  return sorted;
};

const aggregateCounts = (items: UnifiedKnowledgeItem[]) => {
  return items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.byType[item.type] += 1;
      if (item.status) {
        acc.byStatus[item.status] = (acc.byStatus[item.status] || 0) + 1;
      }
      return acc;
    },
    {
      total: 0,
      byType: {
        web: 0,
        file: 0,
        text: 0,
      } as Record<KnowledgeType, number>,
      byStatus: {} as Record<string, number>,
    },
  );
};

export function AllKnowledgeList({
  workspaceId,
  workspace,
}: AllKnowledgeListProps) {
  const webItems = useWebKnowledgeStore((state) => state.items);
  const setWebItems = useWebKnowledgeStore((state) => state.setItems);
  const setWebLoading = useWebKnowledgeStore((state) => state.setLoading);
  const setWebError = useWebKnowledgeStore((state) => state.setError);

  const fileItems = useFileKnowledgeStore((state) => state.items);
  const setFileItems = useFileKnowledgeStore((state) => state.setItems);
  const setFileLoading = useFileKnowledgeStore((state) => state.setLoading);
  const setFileError = useFileKnowledgeStore((state) => state.setError);

  const textItems = useTextKnowledgeStore((state) => state.items);
  const setTextItems = useTextKnowledgeStore((state) => state.setItems);
  const setTextLoading = useTextKnowledgeStore((state) => state.setLoading);
  const setTextError = useTextKnowledgeStore((state) => state.setError);

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

  // Use workspace-specific endpoints for better performance
  const webQuery = useQuery({
    queryKey: ["web-knowledge", workspaceId],
    queryFn: () => webKnowledgeService.listForWorkspace(workspaceId),
    staleTime: 2 * 60 * 1000,
    enabled: workspaceId.length > 0,
  });

  const fileQuery = useQuery({
    queryKey: ["file-knowledge", workspaceId],
    queryFn: () => fileKnowledgeService.listForWorkspace(workspaceId),
    staleTime: 2 * 60 * 1000,
    enabled: workspaceId.length > 0,
  });

  const textQuery = useQuery({
    queryKey: ["text-knowledge", workspaceId],
    queryFn: () => textKnowledgeService.listForWorkspace(workspaceId),
    staleTime: 2 * 60 * 1000,
    enabled: workspaceId.length > 0,
  });

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
      // No filtering needed - workspace-specific endpoint already filters
      setWebItems(webQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    webQuery.data, // No filtering needed - workspace-specific endpoint already filters
    setWebItems,
  ]);

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
      // No filtering needed - workspace-specific endpoint already filters
      setFileItems(fileQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fileQuery.data, // No filtering needed - workspace-specific endpoint already filters
    setFileItems,
  ]);

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
      // No filtering needed - workspace-specific endpoint already filters
      setTextItems(textQuery.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    textQuery.data, // No filtering needed - workspace-specific endpoint already filters
    setTextItems,
  ]);

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

  const unifiedItems = useMemo(
    () => buildUnifiedItems(workspaceId, webItems, fileItems, textItems),
    [workspaceId, webItems, fileItems, textItems],
  );

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

  const counts = useMemo(() => aggregateCounts(unifiedItems), [unifiedItems]);

  const duplicateGroups = useMemo(
    () => findKnowledgeDuplicates(unifiedItems),
    [unifiedItems],
  );

  const duplicateReasonIndex = useMemo(
    () => buildDuplicateReasonIndex(duplicateGroups),
    [duplicateGroups],
  );

  const availableStatuses = useMemo(() => {
    const statuses = new Set<UnifiedKnowledgeStatus>();
    unifiedItems.forEach((item) => {
      if (item.status) {
        statuses.add(item.status as UnifiedKnowledgeStatus);
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

  const isLoading =
    webQuery.isLoading ||
    fileQuery.isLoading ||
    textQuery.isLoading ||
    (isRefreshing && filteredItems.length === 0);

  const hasError = webQuery.error || fileQuery.error || textQuery.error;

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

          <div className="grid gap-3 md:grid-cols-[minmax(0,_1fr)_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, content, URL, or tags"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Type
                    {typeFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {typeFilters.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium">Knowledge Types</h4>
                    <div className="space-y-2">
                      {(
                        Object.keys(KNOWLEDGE_TYPE_LABELS) as KnowledgeType[]
                      ).map((type) => {
                        const checkboxId = `knowledge-type-${type}`;
                        return (
                          <div
                            key={type}
                            className="flex items-center justify-between gap-3 rounded-md border p-2"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={checkboxId}
                                checked={typeFilters.includes(type)}
                                onCheckedChange={() => toggleTypeFilter(type)}
                              />
                              <Label
                                htmlFor={checkboxId}
                                className="text-sm font-medium"
                              >
                                {KNOWLEDGE_TYPE_LABELS[type]}
                              </Label>
                            </div>
                            <Badge variant="outline">
                              {counts.byType[type]}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Status
                    {statusFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {statusFilters.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium">Processing Status</h4>
                    {availableStatuses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No status information available yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {availableStatuses.map((status) => {
                          const statusId = `knowledge-status-${status}`;
                          return (
                            <div
                              key={status}
                              className="flex items-center justify-between gap-3 rounded-md border p-2"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={statusId}
                                  checked={statusFilters.includes(status)}
                                  onCheckedChange={() =>
                                    toggleStatusFilter(status)
                                  }
                                />
                                <Label
                                  htmlFor={statusId}
                                  className="text-sm font-medium"
                                >
                                  {STATUS_LABELS[status]}
                                </Label>
                              </div>
                              <Badge variant="outline">
                                {counts.byStatus[status] || 0}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                    {tagFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {tagFilters.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium">Filter by tags</h4>
                    {availableTags.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Tags will appear once knowledge items include them.
                      </p>
                    ) : (
                      <Command>
                        <CommandInput placeholder="Search tags" />
                        <CommandList>
                          <CommandEmpty>No tags found.</CommandEmpty>
                          <CommandGroup>
                            {availableTags.map((tag) => {
                              const isActive = tagFilters.includes(tag);
                              return (
                                <CommandItem
                                  key={tag}
                                  value={tag}
                                  onSelect={() =>
                                    isActive
                                      ? removeTagFilter(tag)
                                      : addTagFilter(tag)
                                  }
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isActive ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {tag}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Dates
                    {(dateRange.from || dateRange.to) && (
                      <Badge variant="secondary" className="ml-1">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <Calendar
                    mode="range"
                    selected={dateValue}
                    onSelect={handleDateChange}
                    numberOfMonths={2}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {dateRange.from ? toDateString(dateRange.from) : "Start"}{" "}
                      → {dateRange.to ? toDateString(dateRange.to) : "End"}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(null, null)}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Word Count
                    {(minWordCount !== null || maxWordCount !== null) && (
                      <Badge variant="secondary" className="ml-1">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Word count range</h4>
                      <p className="text-sm text-muted-foreground">
                        Filter by estimated word count (falls back to characters
                        when missing).
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="knowledge-min-words"
                          className="text-xs uppercase tracking-wide"
                        >
                          Minimum
                        </Label>
                        <Input
                          id="knowledge-min-words"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={minWordCount ?? ""}
                          onChange={(event) =>
                            handleWordCountChange("min", event.target.value)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="knowledge-max-words"
                          className="text-xs uppercase tracking-wide"
                        >
                          Maximum
                        </Label>
                        <Input
                          id="knowledge-max-words"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={maxWordCount ?? ""}
                          onChange={(event) =>
                            handleWordCountChange("max", event.target.value)
                          }
                          placeholder="Any"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setWordCountRange(null, null)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownSort
                sortBy={sortBy}
                sortOrder={sortOrder}
                onChange={setSort}
                onToggleDirection={toggleSortOrder}
              />

              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                disabled={!activeFilters}
                onClick={() => resetFilters()}
              >
                <X className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

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

      {duplicateGroups.length > 0 && (
        <KnowledgeDuplicateSummary groups={duplicateGroups} />
      )}

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

interface DropdownSortProps {
  sortBy: KnowledgeFilterState["sortBy"];
  sortOrder: KnowledgeFilterState["sortOrder"];
  onChange: (
    sortBy: KnowledgeFilterState["sortBy"],
    sortOrder: KnowledgeFilterState["sortOrder"],
  ) => void;
  onToggleDirection: () => void;
}

function DropdownSort({
  sortBy,
  sortOrder,
  onChange,
  onToggleDirection,
}: DropdownSortProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4 rotate-90" />
          Sort
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">Sort order</h4>
            <p className="text-xs text-muted-foreground">
              Choose the attribute to sort by and toggle direction.
            </p>
          </div>
          <div className="space-y-2">
            {(
              [
                { value: "created_at", label: "Created date" },
                { value: "updated_at", label: "Updated date" },
                { value: "title", label: "Title" },
                { value: "type", label: "Knowledge type" },
                { value: "status", label: "Status" },
                { value: "word_count", label: "Word count" },
              ] as Array<{
                value: KnowledgeFilterState["sortBy"];
                label: string;
              }>
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md border p-2 text-sm",
                  sortBy === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted",
                )}
                onClick={() => onChange(option.value, sortOrder)}
              >
                <span>{option.label}</span>
                {sortBy === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDirection}
            className="w-full"
          >
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ActiveFiltersBarProps {
  filters: KnowledgeFilterState;
  onRemoveType: (type: KnowledgeType) => void;
  onRemoveStatus: (status: UnifiedKnowledgeStatus) => void;
  onRemoveTag: (tag: string) => void;
  onClearDates: () => void;
  onClearWordCount: () => void;
}

function ActiveFiltersBar({
  filters,
  onRemoveType,
  onRemoveStatus,
  onRemoveTag,
  onClearDates,
  onClearWordCount,
}: ActiveFiltersBarProps) {
  const {
    typeFilters,
    statusFilters,
    tagFilters,
    dateRange,
    minWordCount,
    maxWordCount,
  } = filters;

  const hasChips =
    typeFilters.length > 0 ||
    statusFilters.length > 0 ||
    tagFilters.length > 0 ||
    dateRange.from !== null ||
    dateRange.to !== null ||
    minWordCount !== null ||
    maxWordCount !== null;

  if (!hasChips) {
    return null;
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-muted/30 p-2">
      <div className="flex items-center gap-2">
        {typeFilters.map((type) => (
          <Badge
            key={`type-${type}`}
            variant="outline"
            className={cn("flex items-center gap-1 border", TYPE_COLORS[type])}
          >
            {KNOWLEDGE_TYPE_LABELS[type]}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => onRemoveType(type)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {statusFilters.map((status) => (
          <Badge
            key={`status-${status}`}
            variant="outline"
            className={cn(
              "flex items-center gap-1 border",
              STATUS_CLASSES[status],
            )}
          >
            {STATUS_LABELS[status]}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => onRemoveStatus(status)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {tagFilters.map((tag) => (
          <Badge
            key={`tag-${tag}`}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => onRemoveTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {(dateRange.from || dateRange.to) && (
          <Badge variant="outline" className="flex items-center gap-1">
            {dateRange.from ? toDateString(dateRange.from) : "Start"}
            <span>→</span>
            {dateRange.to ? toDateString(dateRange.to) : "End"}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={onClearDates}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {(minWordCount !== null || maxWordCount !== null) && (
          <Badge variant="outline" className="flex items-center gap-1">
            {minWordCount ?? "0"} – {maxWordCount ?? "∞"} words
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={onClearWordCount}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    </ScrollArea>
  );
}

function KnowledgeCard({
  item,
  duplicateReasons = [],
}: {
  item: UnifiedKnowledgeItem;
  duplicateReasons?: KnowledgeDuplicateReason[];
}) {
  const hasDuplicates = duplicateReasons.length > 0;
  const duplicateLabel = formatDuplicateBadgeText(duplicateReasons);
  const duplicateTitle = duplicateReasons
    .map((reason) => DUPLICATE_REASON_LABELS[reason])
    .join(", ");

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("border", TYPE_COLORS[item.type])}
            >
              {KNOWLEDGE_TYPE_LABELS[item.type]}
            </Badge>
            {hasDuplicates && (
              <Badge
                variant="outline"
                title={duplicateTitle}
                className="flex items-center gap-1 border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-200/70 dark:bg-amber-900/30 dark:text-amber-100"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {duplicateLabel}
              </Badge>
            )}
          </div>
          {item.status && (
            <Badge
              variant="outline"
              className={cn("border", STATUS_CLASSES[item.status])}
            >
              {STATUS_LABELS[item.status]}
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{item.title}</h3>
          {item.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {item.subtitle}
            </p>
          )}
          {item.preview && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {item.preview}
            </p>
          )}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Created {toDateString(item.createdAt)}</span>
          {item.updatedAt && item.updatedAt !== item.createdAt && (
            <span>· Updated {toDateString(item.updatedAt)}</span>
          )}
          {(item.wordCount || item.charCount) && (
            <span>
              · {item.wordCount ?? Math.round((item.charCount || 0) / 5)} words
            </span>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KnowledgeRow({
  item,
  duplicateReasons = [],
}: {
  item: UnifiedKnowledgeItem;
  duplicateReasons?: KnowledgeDuplicateReason[];
}) {
  const hasDuplicates = duplicateReasons.length > 0;
  const duplicateLabel = formatDuplicateBadgeText(duplicateReasons);
  const duplicateTitle = duplicateReasons
    .map((reason) => DUPLICATE_REASON_LABELS[reason])
    .join(", ");

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 transition hover:bg-muted/60 md:flex-row md:items-start md:justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("border", TYPE_COLORS[item.type])}
          >
            {KNOWLEDGE_TYPE_LABELS[item.type]}
          </Badge>
          <h3 className="text-base font-semibold">{item.title}</h3>
          {hasDuplicates && (
            <Badge
              variant="outline"
              title={duplicateTitle}
              className="flex items-center gap-1 border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-200/70 dark:bg-amber-900/30 dark:text-amber-100"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {duplicateLabel}
            </Badge>
          )}
          {item.status && (
            <Badge
              variant="outline"
              className={cn("border", STATUS_CLASSES[item.status])}
            >
              {STATUS_LABELS[item.status]}
            </Badge>
          )}
        </div>
        {item.subtitle && (
          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
        )}
        {item.preview && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.preview}
          </p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 6).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 6}
              </Badge>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground md:items-end">
        <span>Created {toDateString(item.createdAt)}</span>
        {item.updatedAt && item.updatedAt !== item.createdAt && (
          <span>Updated {toDateString(item.updatedAt)}</span>
        )}
        {(item.wordCount || item.charCount) && (
          <span>
            {item.wordCount ?? Math.round((item.charCount || 0) / 5)} words
          </span>
        )}
      </div>
    </div>
  );
}

function KnowledgeSkeleton({ viewMode }: { viewMode: KnowledgeListViewMode }) {
  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GRID_SKELETON_KEYS.map((key) => (
          <Card key={key}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-4 w-20 rounded-full bg-muted" />
              </div>
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded-full bg-muted" />
                <div className="h-4 w-24 rounded-full bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {LIST_SKELETON_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-5 w-48 rounded bg-muted" />
            <div className="h-5 w-24 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
