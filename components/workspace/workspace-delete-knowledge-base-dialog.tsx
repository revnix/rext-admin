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
import { apiClient } from "@/lib/api-client";
import type { KnowledgeBase } from "@/lib/api-client/knowledge";

interface WorkspaceDeleteKnowledgeBaseDialogProps {
  workspaceId: string;
  knowledgeBase: KnowledgeBase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Workspace Delete Knowledge Base Dialog
 *
 * Confirmation dialog for deleting a knowledge base.
 * Prevents deletion of default knowledge bases.
 */
export function WorkspaceDeleteKnowledgeBaseDialog({
  workspaceId,
  knowledgeBase,
  open,
  onOpenChange,
  onDeleted,
}: WorkspaceDeleteKnowledgeBaseDialogProps) {
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!knowledgeBase) throw new Error("No knowledge base to delete");
      if (knowledgeBase.type === "default") {
        throw new Error("Cannot delete the default knowledge base");
      }
      return apiClient.knowledge.deleteBase(workspaceId, knowledgeBase.id);
    },
    onSuccess: () => {
      toast.success("Knowledge base deleted successfully");
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete knowledge base: ${error.message}`);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!knowledgeBase) return null;

  const isDefault = knowledgeBase.type === "default";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete knowledge base?</AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="space-y-3">
            {isDefault ? (
              <>
                <p className="text-destructive font-medium">
                  The default knowledge base cannot be deleted.
                </p>
                <p>
                  The default knowledge base is required for your workspace. All
                  knowledge items must belong to at least one knowledge base.
                </p>
              </>
            ) : (
              <>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{knowledgeBase.name}</strong>?
                </p>
                <p>
                  This will permanently delete the knowledge base and{" "}
                  <strong>
                    all {knowledgeBase.items_count} knowledge items
                  </strong>{" "}
                  it contains (websites, files, and text entries).
                </p>
                <p className="text-destructive font-medium">
                  This action cannot be undone.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {isDefault ? "Close" : "Cancel"}
          </AlertDialogCancel>
          {!isDefault && (
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
              Delete Knowledge Base
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
