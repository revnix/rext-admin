"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Download,
  Filter,
  Globe,
  Grid3X3,
  List,
  RefreshCw,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { log } from "@/lib/logger";
import { webKnowledgeService } from "@/services/knowledge-api";
import { useWebKnowledgeStore } from "@/stores/knowledge-store";
import type { WebKnowledgeStatus, Workspace } from "@/types/workspace";
import { AddUrlDialog } from "./add-url-dialog";
import { ExportDialog } from "./export-dialog";
import { WebKnowledgeCard, WebKnowledgeListItem } from "./web-knowledge-card";

interface WebKnowledgeListProps {
  workspaceId: string;
  workspace?: Workspace; // Optional workspace data for export
}

type ViewMode = "grid" | "list";
type SortOption = "created_at" | "title" | "status";

const GRID_SKELETON_KEYS = [
  "web-grid-skeleton-1",
  "web-grid-skeleton-2",
  "web-grid-skeleton-3",
  "web-grid-skeleton-4",
  "web-grid-skeleton-5",
  "web-grid-skeleton-6",
] as const;

const LIST_SKELETON_KEYS = [
  "web-list-skeleton-1",
  "web-list-skeleton-2",
  "web-list-skeleton-3",
  "web-list-skeleton-4",
  "web-list-skeleton-5",
  "web-list-skeleton-6",
] as const;

// Loading skeleton components
function WebKnowledgeGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {GRID_SKELETON_KEYS.map((key) => (
        <Card key={key}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WebKnowledgeListSkeleton() {
  return (
    <div className="space-y-2">
      {LIST_SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className="flex items-center gap-4 p-4 border rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

// Empty state component
function EmptyWebKnowledgeState({ workspaceId }: { workspaceId: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No web knowledge yet</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Add your first webpage URL to start building your knowledge base.
          We'll automatically scrape and process the content.
        </p>
        <AddUrlDialog workspaceId={workspaceId} />
      </CardContent>
    </Card>
  );
}

export function WebKnowledgeList({
  workspaceId,
  workspace,
}: WebKnowledgeListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WebKnowledgeStatus | "all">(
    "all",
  );
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Store state
  const {
    items,
    selectedItems,
    isLoading,
    error,
    setItems,
    setLoading,
    setError,
    toggleSelection,
    selectAll,
    deselectAll,
  } = useWebKnowledgeStore();

  // Query web knowledge data - using workspace-specific endpoint
  const {
    data: webKnowledgeList,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["web-knowledge", workspaceId],
    queryFn: () => webKnowledgeService.listForWorkspace(workspaceId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!workspaceId,
  });

  // Update store when API data changes
  useEffect(() => {
    if (webKnowledgeList) {
      setItems(webKnowledgeList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webKnowledgeList, setItems]);

  // Update loading and error states
  useEffect(() => {
    setLoading(isQueryLoading);
    setError(queryError ? "Failed to load web knowledge" : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQueryLoading, queryError, setError, setLoading]);

  // Filter and sort items
  const filteredItems = items.filter((item) => {
    // Search filter
    if (
      searchQuery &&
      !item.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.url.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "title":
        comparison = (a.title || "").localeCompare(b.title || "");
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "created_at":
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      await Promise.all(
        selectedItems.map((id) => {
          const item = items.find((i) => i.id === id);
          return item
            ? webKnowledgeService.delete(item.workspace_id, item.id)
            : Promise.resolve();
        }),
      );

      toast.success(
        `Deleted ${selectedItems.length} web knowledge item${
          selectedItems.length > 1 ? "s" : ""
        }`,
      );
      deselectAll();
      refetch();
    } catch (error) {
      log.error("Failed to delete items:", error);
      toast.error("Failed to delete some items");
    }
  };

  const hasSelection = selectedItems.length > 0;
  const allSelected =
    sortedItems.length > 0 && selectedItems.length === sortedItems.length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search web knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as WebKnowledgeStatus | "all")
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scraping">Scraping</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSortBy("created_at");
                  setSortOrder("desc");
                }}
              >
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy("created_at");
                  setSortOrder("asc");
                }}
              >
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSortBy("title");
                  setSortOrder("asc");
                }}
              >
                Title A-Z
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy("title");
                  setSortOrder("desc");
                }}
              >
                Title Z-A
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSortBy("status");
                  setSortOrder("asc");
                }}
              >
                Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-2"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Refresh */}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Add URL */}
          <AddUrlDialog workspaceId={workspaceId} />
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelection && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
            selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={allSelected ? deselectAll : selectAll}
          >
            {allSelected ? (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Select All
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {sortedItems.length === items.length
              ? `${items.length} web knowledge item${items.length !== 1 ? "s" : ""}`
              : `${sortedItems.length} of ${items.length} items`}
          </div>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        viewMode === "grid" ? (
          <WebKnowledgeGridSkeleton />
        ) : (
          <WebKnowledgeListSkeleton />
        )
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : sortedItems.length === 0 ? (
        searchQuery || statusFilter !== "all" ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-8 w-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No web knowledge matches your search criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <EmptyWebKnowledgeState workspaceId={workspaceId} />
        )
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          }
        >
          {sortedItems.map((item) =>
            viewMode === "grid" ? (
              <WebKnowledgeCard
                key={item.id}
                item={item}
                onSelect={toggleSelection}
                isSelected={selectedItems.includes(item.id)}
              />
            ) : (
              <WebKnowledgeListItem
                key={item.id}
                item={item}
                onSelect={toggleSelection}
                isSelected={selectedItems.includes(item.id)}
              />
            ),
          )}
        </div>
      )}

      {/* Export Dialog */}
      {workspace && (
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          workspace={workspace}
          webItems={items}
          fileItems={[]}
          textItems={[]}
          selectedIds={selectedItems}
          initialScope={selectedItems.length > 0 ? "selected" : "all"}
          initialKnowledgeTypes={["web"]}
        />
      )}
    </div>
  );
}
