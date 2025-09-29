"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Download,
  FileText,
  Grid3X3,
  List,
  RefreshCw,
  Search,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fileKnowledgeService } from "@/services/knowledge-api";
import { useFileKnowledgeStore } from "@/stores/knowledge-store";
import type { FileKnowledgeStatus, Workspace } from "@/types/workspace";
import { ExportDialog } from "./export-dialog";
import {
  FileKnowledgeCard,
  FileKnowledgeListItem,
} from "./file-knowledge-card";
import { FileUploadZone } from "./file-upload-zone";

interface FileKnowledgeListProps {
  workspaceId: string;
  workspace?: Workspace;
}

type ViewMode = "grid" | "list";
type SortOption = "created_at" | "name" | "size" | "type";

const GRID_SKELETON_KEYS = [
  "file-grid-skeleton-1",
  "file-grid-skeleton-2",
  "file-grid-skeleton-3",
  "file-grid-skeleton-4",
  "file-grid-skeleton-5",
  "file-grid-skeleton-6",
] as const;

const LIST_SKELETON_KEYS = [
  "file-list-skeleton-1",
  "file-list-skeleton-2",
  "file-list-skeleton-3",
  "file-list-skeleton-4",
  "file-list-skeleton-5",
] as const;

// Loading skeleton components
function FileKnowledgeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {GRID_SKELETON_KEYS.map((key) => (
        <Card key={key} className="h-40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FileKnowledgeListSkeleton() {
  return (
    <div className="space-y-3">
      {LIST_SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className="flex items-center gap-4 p-4 border rounded-lg"
        >
          <Skeleton className="h-8 w-8" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function FileKnowledgeList({
  workspaceId,
  workspace,
}: FileKnowledgeListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<FileKnowledgeStatus | "all">(
    "all",
  );
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const {
    items,
    selectedItems,
    searchQuery,
    setItems,
    setSearchQuery,
    toggleSelection,
    selectAll,
    deselectAll,
  } = useFileKnowledgeStore();

  // Fetch file knowledge data
  const {
    data: fileKnowledge,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fileKnowledge"],
    queryFn: () => fileKnowledgeService.list(),
    staleTime: 30000,
  });

  // Update store when data changes
  useEffect(() => {
    if (fileKnowledge) {
      setItems(fileKnowledge);
    }
  }, [fileKnowledge, setItems]);

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      // Delete selected files
      const deletePromises = selectedItems.map((fileId) => {
        const file = items.find((item) => item.id === fileId);
        if (file) {
          return fileKnowledgeService.delete(file.workspace_id, fileId);
        }
        return Promise.resolve();
      });

      await Promise.allSettled(deletePromises);

      // Remove from store
      selectedItems.forEach((fileId) => {
        const removeItem = useFileKnowledgeStore.getState().removeItem;
        removeItem(fileId);
      });

      deselectAll();
      toast.success(`${selectedItems.length} file(s) deleted successfully`);
    } catch (error) {
      toast.error(
        `Failed to delete files: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("File knowledge list refreshed");
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load files</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
            There was an error loading the file knowledge. Please try again.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {showUploadZone && (
        <FileUploadZone
          workspaceId={workspaceId}
          onUploadComplete={() => {
            refetch();
            setShowUploadZone(false);
          }}
        />
      )}

      {/* Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Files</h3>
          <span className="text-sm text-muted-foreground">
            ({filteredAndSortedItems.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowUploadZone(!showUploadZone)}
            size="sm"
            variant={showUploadZone ? "secondary" : "default"}
          >
            <Upload className="mr-2 h-4 w-4" />
            {showUploadZone ? "Hide Upload" : "Upload Files"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as FileKnowledgeStatus | "all")
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="uploading">Uploading</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split("-") as [
                SortOption,
                "asc" | "desc",
              ];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="size-desc">Largest First</SelectItem>
              <SelectItem value="size-asc">Smallest First</SelectItem>
              <SelectItem value="type-asc">Type A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedItems.length} file(s) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Clear Selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
            <ConfirmationDialog
              title="Delete Files"
              description={`Are you sure you want to delete ${selectedItems.length} file(s)? This action cannot be undone.`}
              confirmText="Delete"
              variant="destructive"
              onConfirm={handleBulkDelete}
            >
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </ConfirmationDialog>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        viewMode === "grid" ? (
          <FileKnowledgeGridSkeleton />
        ) : (
          <FileKnowledgeListSkeleton />
        )
      ) : filteredAndSortedItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || statusFilter !== "all"
                ? "No files found"
                : "No files uploaded yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters to find files."
                : "Upload files to start building your knowledge base."}
            </p>
            {!showUploadZone && (
              <Button onClick={() => setShowUploadZone(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedItems.map((item) => (
            <FileKnowledgeCard
              key={item.id}
              item={item}
              onSelect={toggleSelection}
              isSelected={selectedItems.includes(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedItems.map((item) => (
            <FileKnowledgeListItem
              key={item.id}
              item={item}
              onSelect={toggleSelection}
              isSelected={selectedItems.includes(item.id)}
            />
          ))}
        </div>
      )}

      {/* Bulk Selection Controls */}
      {filteredAndSortedItems.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedItems.length === filteredAndSortedItems.length) {
                  deselectAll();
                } else {
                  selectAll();
                }
              }}
            >
              {selectedItems.length === filteredAndSortedItems.length ? (
                <CheckSquare className="mr-2 h-4 w-4" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              {selectedItems.length === filteredAndSortedItems.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {filteredAndSortedItems.length} of {items.length} files
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {workspace && (
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          workspace={workspace}
          webItems={[]}
          fileItems={items}
          textItems={[]}
          selectedIds={selectedItems}
          initialScope={selectedItems.length > 0 ? "selected" : "all"}
          initialKnowledgeTypes={["file"]}
        />
      )}
    </div>
  );
}
