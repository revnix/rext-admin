"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import { useWorkspaceStore } from "@/stores/workspace";
import type { WorkspaceData } from "@/types/data-table";
import type { Workspace } from "@/types/workspace";

interface WorkspaceDeleteDialogProps {
  /**
   * The workspace to be deleted
   */
  workspace: Workspace | WorkspaceData;
  /**
   * Trigger element for the dialog (optional - will use default button if not provided)
   */
  trigger?: React.ReactNode;
  /**
   * Callback fired when workspace is successfully deleted
   */
  onDeleted?: (workspaceId: string) => void;
  /**
   * Callback fired when a just-deleted workspace is restored via the "Undo" toast action
   */
  onRestored?: (workspaceId: string) => void;
  /**
   * Callback fired when an error occurs during deletion
   */
  onError?: (error: Error) => void;
  /**
   * Whether the dialog should be open by default
   */
  defaultOpen?: boolean;
  /**
   * Controlled open state
   */
  open?: boolean;
  /**
   * Callback fired when open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * WorkspaceDeleteDialog Component
 *
 * A reusable confirmation dialog for workspace deletion with safety measures.
 * Requires users to type the workspace name to confirm deletion, preventing
 * accidental deletions. Integrates with the workspace store for deletion logic.
 */
export function WorkspaceDeleteDialog({
  workspace,
  trigger,
  onDeleted,
  onRestored,
  onError,
  defaultOpen = false,
  open,
  onOpenChange,
}: WorkspaceDeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [confirmationText, setConfirmationText] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);
  const loadingStates = useWorkspaceStore((state) => state.loadingStates);

  // Use controlled or uncontrolled state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  // Check if confirmation is valid
  const workspaceName = getWorkspaceDisplayTitle(workspace);
  const isConfirmationValid = confirmationText.trim() === workspaceName?.trim();
  const canDelete =
    isConfirmationValid &&
    !!passwordConfirmation &&
    !isDeleting &&
    !loadingStates.deleting;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canDelete) return;

    setIsDeleting(true);

    try {
      // Verify password before proceeding with deletion
      try {
        await apiClient.request("/api/v1/user/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passwordConfirmation }),
        });
      } catch {
        toast.error("The password you entered is incorrect.");
        setIsDeleting(false);
        return;
      }

      await deleteWorkspace(workspace.id);

      // Success feedback - the workspace is soft-deleted and can be restored
      // within 14 days via apiClient.workspaces.restore(workspace.id).
      toast.success(`Workspace "${workspaceName}" has been deleted`, {
        description:
          "It's been moved to trash. You have 14 days to restore it before it's permanently removed.",
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await apiClient.workspaces.restore(workspace.id);
              toast.success(`Workspace "${workspaceName}" restored`);
              onRestored?.(workspace.id);
            } catch (restoreError) {
              log.error("Failed to restore workspace:", restoreError);
              toast.error("Failed to restore workspace", {
                description:
                  restoreError instanceof Error
                    ? restoreError.message
                    : "An unexpected error occurred",
              });
            }
          },
        },
      });

      // Close dialog and reset state
      setDialogOpen(false);
      setConfirmationText("");
      setPasswordConfirmation("");
      setShowPassword(false);

      // Notify parent component
      onDeleted?.(workspace.id);
    } catch (error) {
      log.error("Failed to delete workspace:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      toast.error("Failed to delete workspace", {
        description: errorMessage,
      });

      // Notify parent component of error
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setDialogOpen(newOpen);

    // Reset form when dialog closes
    if (!newOpen) {
      setConfirmationText("");
      setPasswordConfirmation("");
      setShowPassword(false);
      setIsDeleting(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete Workspace
    </Button>
  );

  const knowledgeCount =
    workspace.knowledge_stats?.total ||
    ((workspace as Workspace).websites?.length || 0) +
      ((workspace as Workspace).knowledge_files?.length || 0) +
      ((workspace as Workspace).text_knowledge?.length || 0);

  return (
    <AlertDialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!open && (
        <AlertDialogTrigger asChild>
          {trigger || defaultTrigger}
        </AlertDialogTrigger>
      )}

      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Workspace
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete the workspace{" "}
            <span className="font-semibold text-foreground">
              "{workspaceName}"
            </span>
            .
            {knowledgeCount > 0 && (
              <>
                {" "}
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  ⚠️ This includes {knowledgeCount} knowledge item
                  {knowledgeCount === 1 ? "" : "s"}
                  (websites, files, and text notes) associated with this
                  workspace.
                </span>
              </>
            )}{" "}
            <span className="font-medium">
              The workspace will be moved to trash and become inaccessible
              immediately. You'll have 14 days to restore it before it's
              permanently and irreversibly deleted.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm font-medium">
              To confirm deletion, type the workspace name below:
            </Label>
            <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              {workspaceName}
            </div>
            <Input
              id="confirmation-input"
              type="text"
              placeholder="Enter workspace name to confirm"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              disabled={isDeleting || loadingStates.deleting}
              className={
                confirmationText && !isConfirmationValid
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              autoComplete="off"
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-sm text-destructive">
                Workspace name does not match. Please type exactly: "
                {workspaceName}"
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                id="password-confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password to confirm"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                disabled={isDeleting || loadingStates.deleting}
                className="pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting || loadingStates.deleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting || loadingStates.deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Workspace
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Default export for convenience
 */
export default WorkspaceDeleteDialog;
