"use client";

import { Calendar, Edit2, FileText, Tag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDeleteHandler } from "@/hooks/useDeleteHandler";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { numberFormat } from "@/lib/formatters/number-formatters";
import { textKnowledgeService } from "@/services/knowledge-api";
import { useTextKnowledgeStore } from "@/stores/knowledge-store";
import type { TextKnowledge } from "@/types/workspace";
import {
  BaseKnowledgeCard,
  BaseKnowledgeListItem,
  type KnowledgeCardConfig,
  truncateContent,
} from "./shared";

interface TextKnowledgeCardProps {
  item: TextKnowledge;
  onSelect?: (id: string) => void;
  onEdit?: (item: TextKnowledge) => void;
  isSelected?: boolean;
}

interface TextKnowledgeListItemProps {
  item: TextKnowledge;
  onSelect?: (id: string) => void;
  onEdit?: (item: TextKnowledge) => void;
  isSelected?: boolean;
}

export function TextKnowledgeCard({
  item,
  onSelect,
  onEdit,
  isSelected = false,
}: TextKnowledgeCardProps) {
  const removeItem = useTextKnowledgeStore((state) => state.removeItem);

  // Use the delete handler hook
  const { handleDelete: deleteTextKnowledge } = useDeleteHandler({
    deleteFunction: (id) => textKnowledgeService.delete(item.workspace_id, id),
    resourceName: "text note",
    successMessage: `Text note "${item.title}" deleted successfully`,
    onSuccess: () => {
      removeItem(item.id);
    },
  });

  const cardConfig: KnowledgeCardConfig<TextKnowledge> = {
    primaryIcon: FileText,
    getTitle: (item) => item.title,
    getDescription: (item) => (
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {dateFormat.short(item.created_at)}
        {item.updated_at && item.updated_at !== item.created_at && (
          <span className="text-xs">
            • Updated {dateFormat.short(item.updated_at)}
          </span>
        )}
      </div>
    ),
    getStatusConfig: () => null, // Text knowledge doesn't have status
    getActions: (item) => [
      {
        icon: Edit2,
        label: "Edit",
        onClick: (e) => {
          e.stopPropagation();
          onEdit?.(item);
        },
      },
      {
        icon: Trash2,
        label: "Delete",
        variant: "destructive" as const,
        onClick: () => {},
        confirmationConfig: {
          title: "Delete Text Note",
          description: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
          confirmText: "Delete",
        },
      },
    ],
    getMetadataSections: (item) => [
      {
        id: "content-preview",
        content: (
          <div className="text-sm text-muted-foreground line-clamp-3">
            {truncateContent(item.content)}
          </div>
        ),
      },
      {
        id: "tags",
        condition: !!(item.tags && item.tags.length > 0),
        content: (
          <div className="flex flex-wrap gap-1">
            {item.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="mr-1 h-2 w-2" />
                {tag}
              </Badge>
            ))}
            {item.tags && item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3} more
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "statistics",
        condition: !!(item.word_count || item.char_count),
        content: (
          <div className="text-xs text-muted-foreground space-y-1">
            {item.word_count && (
              <div>{numberFormat.integer(item.word_count)} words</div>
            )}
            {item.char_count && (
              <div>{numberFormat.integer(item.char_count)} characters</div>
            )}
          </div>
        ),
      },
    ],
    onDelete: async (item) => {
      await deleteTextKnowledge(item.id);
    },
  };

  return (
    <BaseKnowledgeCard
      item={item}
      config={cardConfig}
      onSelect={onSelect}
      isSelected={isSelected}
    />
  );
}

export function TextKnowledgeListItem({
  item,
  onSelect,
  onEdit,
  isSelected = false,
}: TextKnowledgeListItemProps) {
  const removeItem = useTextKnowledgeStore((state) => state.removeItem);

  // Use the delete handler hook for list view
  const { handleDelete: deleteTextKnowledge } = useDeleteHandler({
    deleteFunction: (id) => textKnowledgeService.delete(item.workspace_id, id),
    resourceName: "text note",
    successMessage: `Text note "${item.title}" deleted successfully`,
    onSuccess: () => {
      removeItem(item.id);
    },
  });

  const listConfig = {
    primaryIcon: FileText,
    getTitle: (item: TextKnowledge) => item.title,
    getDescription: (item: TextKnowledge) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{dateFormat.short(item.created_at)}</span>
        {item.word_count && (
          <span>• {numberFormat.integer(item.word_count)} words</span>
        )}
        {item.updated_at && item.updated_at !== item.created_at && (
          <span>• Updated {dateFormat.short(item.updated_at)}</span>
        )}
      </div>
    ),
    getStatusConfig: () => null,
    getActions: (item: TextKnowledge) => [
      {
        icon: Edit2,
        label: "Edit",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          onEdit?.(item);
        },
      },
      {
        icon: Trash2,
        label: "Delete",
        variant: "destructive" as const,
        onClick: () => {},
        confirmationConfig: {
          title: "Delete Text Note",
          description: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
          confirmText: "Delete",
        },
      },
    ],
    getInlineActions: (item: TextKnowledge) => [
      {
        icon: Edit2,
        label: "Edit",
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          onEdit?.(item);
        },
      },
      {
        icon: Trash2,
        label: "Delete",
        variant: "destructive" as const,
        onClick: () => {},
        confirmationConfig: {
          title: "Delete Text Note",
          description: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
          confirmText: "Delete",
        },
      },
    ],
    getMetadataSections: () => [],
    onDelete: async (item: TextKnowledge) => {
      await deleteTextKnowledge(item.id);
    },
    getCompactMetadata: (item: TextKnowledge) => (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground line-clamp-2">
          {truncateContent(item.content, 200)}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="mr-1 h-2 w-2" />
                {tag}
              </Badge>
            ))}
            {item.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}
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
