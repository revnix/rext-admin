"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { KnowledgeItem } from "@/components/workspace/workspace-knowledge-table";
import { apiClient } from "@/lib/api-client";

interface WorkspaceDeleteKnowledgeDialogProps {
  workspaceId: string;
  item: KnowledgeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Workspace Delete Knowledge Dialog
 *
 * Confirmation dialog for deleting knowledge items.
 * Handles all three types: web, file, and text.
 */
export function WorkspaceDeleteKnowledgeDialog({
  workspaceId,
  item,
  open,
  onOpenChange,
  onDeleted,
}: WorkspaceDeleteKnowledgeDialogProps) {
  // Delete knowledge mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("No item to delete");

      switch (item.type) {
        case "web":
          return apiClient.knowledge.deleteWeb(workspaceId, item.id);
        case "file":
          return apiClient.knowledge.deleteFile(workspaceId, item.id);
        case "text":
          return apiClient.knowledge.deleteText(workspaceId, item.id);
        default:
          throw new Error("Unknown knowledge type");
      }
    },
    onSuccess: () => {
      const typeLabel =
        item?.type === "web"
          ? "Website"
          : item?.type === "file"
            ? "File"
            : "Text";
      toast.success(`${typeLabel} deleted successfully`);
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!item) return null;

  const getTypeLabel = () => {
    switch (item.type) {
      case "web":
        return "website";
      case "file":
        return "file";
      case "text":
        return "text knowledge";
      default:
        return "item";
    }
  };

  const getDescription = () => {
    switch (item.type) {
      case "web":
        return "This will remove the website from your knowledge base. Any content scraped from this source will be permanently deleted.";
      case "file":
        return "This will permanently delete the file and all extracted content from your knowledge base.";
      case "text":
        return "This will permanently delete this text knowledge entry and all its content.";
      default:
        return "This action cannot be undone.";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete {getTypeLabel()}?</AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete <strong>{item.name}</strong>?
            </p>
            <p>{getDescription()}</p>
            <p className="text-destructive font-medium">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleteMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Delete {getTypeLabel()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
