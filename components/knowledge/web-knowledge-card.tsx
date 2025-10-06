"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit2,
  ExternalLink,
  Globe,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteHandler } from "@/hooks/useDeleteHandler";
import { apiClient } from "@/lib/api-client";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { numberFormat } from "@/lib/formatters/number-formatters";
import { log } from "@/lib/logger";
import { useWebKnowledgeStore } from "@/stores/knowledge-store";
import type { WebKnowledge } from "@/types/workspace";
import {
  BaseKnowledgeCard,
  BaseKnowledgeListItem,
  type KnowledgeCardConfig,
  type StatusConfig,
} from "./shared";

interface WebKnowledgeCardProps {
  item: WebKnowledge;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

// Status configuration for display
const statusConfig: Record<WebKnowledge["status"], StatusConfig> = {
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "secondary",
    color: "text-slate-500",
  },
  scraping: {
    icon: Loader2,
    label: "Scraping",
    variant: "default",
    color: "text-blue-500",
    animate: true,
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    variant: "default",
    color: "text-blue-500",
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    variant: "default",
    color: "text-green-500",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    variant: "destructive",
    color: "text-red-500",
  },
};

export function WebKnowledgeCard({
  item,
  onSelect,
  isSelected = false,
}: WebKnowledgeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const removeItem = useWebKnowledgeStore((state) => state.removeItem);
  const updateItem = useWebKnowledgeStore((state) => state.updateItem);

  // Use the delete handler hook
  const { handleDelete: deleteWebKnowledge } = useDeleteHandler({
    deleteFunction: (id) =>
      apiClient.knowledge.deleteWeb(item.workspace_id, id),
    resourceName: "web knowledge",
    onSuccess: () => {
      removeItem(item.id);
    },
  });

  const handleUpdate = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      setIsUpdating(true);
      await apiClient.knowledge.updateWeb(
        item.workspace_id,
        item.id,
        editTitle,
      );
      updateItem(item.id, { ...item, title: editTitle });
      toast.success("Web knowledge updated successfully");
      setIsEditing(false);
    } catch (error) {
      log.error("Failed to update web knowledge:", error);
      toast.error("Failed to update web knowledge");
    } finally {
      setIsUpdating(false);
    }
  };

  const cardConfig: KnowledgeCardConfig<WebKnowledge> = {
    primaryIcon: Globe,
    getTitle: (item) => item.title || "Untitled",
    getDescription: (item) => (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline inline-flex items-center gap-1 text-xs line-clamp-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Globe className="h-3 w-3" />
        {item.url}
        <ExternalLink className="h-3 w-3" />
      </a>
    ),
    getStatusConfig: (item) => statusConfig[item.status],
    getActions: (item) => [
      {
        icon: ExternalLink,
        label: "Open URL",
        onClick: (e) => {
          e.stopPropagation();
          window.open(item.url, "_blank");
        },
      },
      {
        icon: Edit2,
        label: "Edit Title",
        onClick: () => {},
        // This is a special case - we handle it with a custom Dialog component
      },
      {
        icon: Trash2,
        label: "Delete",
        variant: "destructive" as const,
        onClick: () => {},
        confirmationConfig: {
          title: "Delete Web Knowledge",
          description:
            "Are you sure you want to delete this web knowledge? This will remove the URL and all associated content from your workspace. This action cannot be undone.",
          confirmText: "Delete",
        },
      },
    ],
    getMetadataSections: (item) => [
      {
        id: "statistics",
        condition:
          item.status === "completed" && !!(item.char_count || item.word_count),
        content: (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {item.word_count && (
              <span>{numberFormat.compact(item.word_count)} words</span>
            )}
            {item.char_count && (
              <span>{numberFormat.compact(item.char_count)} characters</span>
            )}
          </div>
        ),
      },
      {
        id: "error",
        condition: item.status === "failed",
        content: (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            Failed to scrape content from this URL. Please check if the URL is
            accessible and try again.
          </div>
        ),
      },
      {
        id: "processing",
        condition: item.status === "scraping" || item.status === "processing",
        content: (
          <div className="text-xs text-muted-foreground">
            {item.status === "scraping"
              ? "Extracting content from the webpage..."
              : "Processing content for vector storage..."}
          </div>
        ),
      },
      {
        id: "timestamps",
        content: (
          <div className="text-xs text-muted-foreground">
            Added {dateFormat.short(item.created_at)}
            {item.updated_at && (
              <span> • Updated {dateFormat.short(item.updated_at)}</span>
            )}
          </div>
        ),
      },
    ],
    onDelete: async (item) => {
      await deleteWebKnowledge(item.id);
    },
    className: "cursor-pointer",
  };

  // We need to customize the actions to include the Edit dialog
  // Since the base component doesn't support custom action rendering,
  // we'll need to render the card with modified actions
  const modifiedConfig = {
    ...cardConfig,
    getActions: (item: WebKnowledge) => {
      const baseActions = cardConfig.getActions(item);
      return baseActions.map((action) => {
        if (action.label === "Edit Title") {
          return {
            ...action,
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
              setIsEditing(true);
            },
          };
        }
        return action;
      });
    },
  };

  return (
    <>
      <BaseKnowledgeCard
        item={item}
        config={modifiedConfig}
        onSelect={onSelect}
        isSelected={isSelected}
      />
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Web Knowledge</DialogTitle>
            <DialogDescription>
              Update the title for this web knowledge item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditTitle(item.title || "");
                setIsEditing(false);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// List view variant
export function WebKnowledgeListItem({
  item,
  onSelect,
  isSelected = false,
}: WebKnowledgeCardProps) {
  const removeItem = useWebKnowledgeStore((state) => state.removeItem);

  // Use the delete handler hook for list view
  const { handleDelete: deleteWebKnowledge } = useDeleteHandler({
    deleteFunction: (id) =>
      apiClient.knowledge.deleteWeb(item.workspace_id, id),
    resourceName: "web knowledge",
    onSuccess: () => {
      removeItem(item.id);
    },
  });

  const listConfig = {
    ...{
      primaryIcon: Globe,
      getTitle: (item: WebKnowledge) => item.title || "Untitled",
      getDescription: (item: WebKnowledge) => (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline inline-flex items-center gap-1 truncate max-w-[300px]"
          onClick={(e) => e.stopPropagation()}
        >
          <Globe className="h-3 w-3" />
          {item.url}
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
      getStatusConfig: (item: WebKnowledge) => statusConfig[item.status],
      getActions: (item: WebKnowledge) => [
        {
          icon: ExternalLink,
          label: "Open URL",
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            window.open(item.url, "_blank");
          },
        },
        {
          icon: Trash2,
          label: "Delete",
          variant: "destructive" as const,
          onClick: () => {},
          confirmationConfig: {
            title: "Delete Web Knowledge",
            description:
              "Are you sure you want to delete this web knowledge? This will remove the URL and all associated content from your workspace. This action cannot be undone.",
            confirmText: "Delete",
          },
        },
      ],
      getMetadataSections: () => [],
      onDelete: async (item: WebKnowledge) => {
        await deleteWebKnowledge(item.id);
      },
      className: "cursor-pointer hover:bg-muted/50",
    },
    getCompactMetadata: (item: WebKnowledge) => (
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline inline-flex items-center gap-1 truncate max-w-[300px]"
          onClick={(e) => e.stopPropagation()}
        >
          <Globe className="h-3 w-3" />
          {item.url}
          <ExternalLink className="h-3 w-3" />
        </a>
        {item.status === "completed" && (
          <>
            {item.word_count && (
              <span>{numberFormat.compact(item.word_count)} words</span>
            )}
            {item.char_count && (
              <span>{numberFormat.compact(item.char_count)} chars</span>
            )}
          </>
        )}
        <span>Added {dateFormat.short(item.created_at)}</span>
      </div>
    ),
  };

  return (
    <BaseKnowledgeListItem
      item={item}
      config={listConfig}
      onSelect={onSelect}
      isSelected={isSelected}
    />
  );
}
