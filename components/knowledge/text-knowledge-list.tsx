"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Download,
  FileText,
  Grid3X3,
  List,
  Plus,
  RefreshCw,
  Search,
  Square,
  Tag,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
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
import { apiClient } from "@/lib/api-client";
import { useTextKnowledgeStore } from "@/stores/knowledge";
import type { Workspace } from "@/types/workspace";
import { AddTextDialog } from "./add-text-dialog";
import { EditTextDialog } from "./edit-text-dialog";

// Lazy load ExportDialog (large component with complex form logic)
const ExportDialog = dynamic(() =>
  import("./export-dialog").then((mod) => ({ default: mod.ExportDialog })),
);

import {
  TextKnowledgeCard,
  TextKnowledgeListItem,
} from "./text-knowledge-card";

interface TextKnowledgeListProps {
  workspaceId: string;
  workspace?: Workspace;
}

type ViewMode = "grid" | "list";
type SortOption = "created_at" | "title" | "updated_at";

const GRID_SKELETON_KEYS = [
  "text-grid-skeleton-1",
  "text-grid-skeleton-2",
  "text-grid-skeleton-3",
  "text-grid-skeleton-4",
  "text-grid-skeleton-5",
  "text-grid-skeleton-6",
] as const;

const LIST_SKELETON_KEYS = [
  "text-list-skeleton-1",
  "text-list-skeleton-2",
  "text-list-skeleton-3",
  "text-list-skeleton-4",
  "text-list-skeleton-5",
] as const;

// Loading skeleton components
function TextKnowledgeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {GRID_SKELETON_KEYS.map((key) => (
        <Card key={key} className="h-64">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TextKnowledgeListSkeleton() {
  return (
    <div className="space-y-3">
      {LIST_SKELETON_KEYS.map((key) => (
        <div key={key} className="flex items-start gap-4 p-4 border rounded-lg">
          <Skeleton className="h-8 w-8 mt-1" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TextKnowledgeList({
  workspaceId,
  workspace,
}: TextKnowledgeListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [tagFilter, setTagFilter] = useState<string>("all");
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
  } = useTextKnowledgeStore();

  // Fetch text knowledge data
  // Use workspace-specific endpoint if workspaceId is provided
  const {
    data: textKnowledge,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["textKnowledge", workspaceId],
    queryFn: () =>
      workspaceId
        ? apiClient.knowledge.listText(workspaceId)
        : apiClient.knowledge.listText(workspaceId),
    staleTime: 30000,
    enabled: !!workspaceId,
    select: (response) => response.text_knowledge, // Extract array from response
  });

  // Update store when data changes
  useEffect(() => {
    if (textKnowledge) {
      setItems(textKnowledge);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textKnowledge, setItems]);

  // Get all unique tags for filtering
  const allTags = Array.from(
    new Set(items.flatMap((item) => item.tags || [])),
  ).sort();

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesTag =
        tagFilter === "all" ||
        item.tags?.includes(tagFilter) ||
        (tagFilter === "untagged" && (!item.tags || item.tags.length === 0));

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at || a.created_at).getTime() -
            new Date(b.updated_at || b.created_at).getTime();
          break;
        default: // created_at
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      // Delete selected text items
      const deletePromises = selectedItems.map((textId) => {
        const textItem = items.find((item) => item.id === textId);
        if (textItem) {
          return apiClient.knowledge.deleteText(textItem.workspace_id, textId);
        }
        return Promise.resolve();
      });

      await Promise.allSettled(deletePromises);

      // Remove from store
      selectedItems.forEach((textId) => {
        const removeItem = useTextKnowledgeStore.getState().removeItem;
        removeItem(textId);
      });

      deselectAll();
      toast.success(
        `${selectedItems.length} text note(s) deleted successfully`,
      );
    } catch (error) {
      toast.error(
        `Failed to delete text notes: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Text knowledge list refreshed");
  };

  const handleEdit = (item: { id: string }) => {
    setEditingItem(item.id);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Failed to load text notes
          </h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
            There was an error loading the text knowledge. Please try again.
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
      {/* Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Text Notes</h3>
          <span className="text-sm text-muted-foreground">
            ({filteredAndSortedItems.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Text Note
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
            placeholder="Search text notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Tag Filter */}
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              <SelectItem value="untagged">Untagged</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </div>
                </SelectItem>
              ))}
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
              <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
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
              {selectedItems.length} text note(s) selected
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
              title="Delete Text Notes"
              description={`Are you sure you want to delete ${selectedItems.length} text note(s)? This action cannot be undone.`}
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
          <TextKnowledgeGridSkeleton />
        ) : (
          <TextKnowledgeListSkeleton />
        )
      ) : filteredAndSortedItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || tagFilter !== "all"
                ? "No text notes found"
                : "No text notes created yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {searchQuery || tagFilter !== "all"
                ? "Try adjusting your search or filters to find text notes."
                : "Create your first text note to start building your knowledge base."}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Text Note
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedItems.map((item) => (
            <TextKnowledgeCard
              key={item.id}
              item={item}
              onSelect={toggleSelection}
              onEdit={handleEdit}
              isSelected={selectedItems.includes(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedItems.map((item) => (
            <TextKnowledgeListItem
              key={item.id}
              item={item}
              onSelect={toggleSelection}
              onEdit={handleEdit}
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
            Showing {filteredAndSortedItems.length} of {items.length} text notes
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddTextDialog
        workspaceId={workspaceId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      {editingItem && (
        <EditTextDialog
          workspaceId={workspaceId}
          textId={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
        />
      )}

      {/* Export Dialog */}
      {workspace && (
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          workspace={workspace}
          webItems={[]}
          fileItems={[]}
          textItems={items}
          selectedIds={selectedItems}
          initialScope={selectedItems.length > 0 ? "selected" : "all"}
          initialKnowledgeTypes={["text"]}
        />
      )}
    </div>
  );
}
