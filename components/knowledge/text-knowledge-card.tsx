"use client";

import {
  Calendar,
  Edit2,
  FileText,
  MoreHorizontal,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { textKnowledgeService } from "@/services/knowledge-api";
import { useTextKnowledgeStore } from "@/stores/knowledge-store";
import type { TextKnowledge } from "@/types/workspace";

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

// Helper function to truncate content for preview
const truncateContent = (content: string, maxLength: number = 150) => {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trim()}...`;
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function TextKnowledgeCard({
  item,
  onSelect,
  onEdit,
  isSelected = false,
}: TextKnowledgeCardProps) {
  const [_isDeleting, setIsDeleting] = useState(false);
  const removeItem = useTextKnowledgeStore((state) => state.removeItem);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await textKnowledgeService.delete(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success(`Text note "${item.title}" deleted successfully`);
    } catch (error) {
      toast.error(
        `Failed to delete text note: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className={`h-full transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${onSelect ? "cursor-pointer" : ""}`}
      onClick={() => onSelect?.(item.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium leading-snug line-clamp-2">
              {item.title}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.created_at)}
                {item.updated_at && item.updated_at !== item.created_at && (
                  <span className="text-xs">
                    • Updated {formatDate(item.updated_at)}
                  </span>
                )}
              </div>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ConfirmationDialog
                title="Delete Text Note"
                description={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDelete}
              >
                <DropdownMenuItem
                  onClick={(e) => e.stopPropagation()}
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </ConfirmationDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Content Preview */}
          <div className="text-sm text-muted-foreground line-clamp-3">
            {truncateContent(item.content)}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-2 w-2" />
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="text-xs text-muted-foreground space-y-1">
            {item.word_count && (
              <div>{item.word_count.toLocaleString()} words</div>
            )}
            {item.char_count && (
              <div>{item.char_count.toLocaleString()} characters</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TextKnowledgeListItem({
  item,
  onSelect,
  onEdit,
  isSelected = false,
}: TextKnowledgeListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const removeItem = useTextKnowledgeStore((state) => state.removeItem);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await textKnowledgeService.delete(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success(`Text note "${item.title}" deleted successfully`);
    } catch (error) {
      toast.error(
        `Failed to delete text note: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      className={`flex items-start gap-4 p-4 border rounded-lg transition-all hover:shadow-sm ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${onSelect ? "cursor-pointer" : ""} w-full text-left`}
      onClick={() => onSelect?.(item.id)}
      disabled={!onSelect}
    >
      {/* Icon */}
      <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate text-base">{item.title}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{formatDate(item.created_at)}</span>
              {item.word_count && (
                <span>• {item.word_count.toLocaleString()} words</span>
              )}
              {item.updated_at && item.updated_at !== item.created_at && (
                <span>• Updated {formatDate(item.updated_at)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {truncateContent(item.content, 200)}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
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

      {/* Actions */}
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
        role="toolbar"
        aria-label="Text knowledge actions"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(item);
          }}
          className="h-8"
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <ConfirmationDialog
          title="Delete Text Note"
          description={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            className="h-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </ConfirmationDialog>
      </div>
    </button>
  );
}
