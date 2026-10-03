/**
 * Draft Manager UI Components
 *
 * React components for managing drafts in the content creation wizard,
 * including draft listing, loading, saving, and deletion.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useDraftManager } from "@/hooks/use-draft-manager";
import type { Draft } from "@/lib/content-creation/draft-manager";
import { cn } from "@/lib/utils";
import type { PartialContentCreationFormData } from "@/types/content-creation";

// ============================================================================
// TYPES
// ============================================================================

interface DraftManagerUIProps {
  /** Current form data */
  formData: PartialContentCreationFormData;
  /** Current step index */
  currentStep: number;
  /** Current completion percentage */
  completionPercentage: number;
  /** Called when draft is loaded */
  onLoadDraft?: (
    formData: PartialContentCreationFormData,
    draft: Draft,
  ) => void;
  /** Called when draft is saved */
  onSaveDraft?: (draft: Draft) => void;
  /** Whether the UI is in compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface SaveDraftDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Called when dialog state changes */
  onOpenChange: (open: boolean) => void;
  /** Called when draft should be saved */
  onSave: (title: string, metadata?: Record<string, unknown>) => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Default draft title */
  defaultTitle?: string;
}

interface DeleteConfirmDialogProps {
  /** Draft to delete */
  draft: Draft | null;
  /** Called when dialog state changes */
  onOpenChange: (open: boolean) => void;
  /** Called when deletion is confirmed */
  onConfirm: () => void;
  /** Whether deletion is in progress */
  isDeleting?: boolean;
}

// ============================================================================
// DRAFT CARD COMPONENT
// ============================================================================

const DraftCard = memo<{
  draft: Draft;
  onLoad: () => void;
  onDelete: () => void;
  isLoading?: boolean;
  compact?: boolean;
}>(({ draft, onLoad, onDelete, isLoading = false, compact = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isLoading && "opacity-50 cursor-wait",
        compact && "p-3",
      )}
    >
      <CardHeader className={cn("pb-2", compact && "p-0 pb-2")}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle
              className={cn(
                "text-sm font-medium line-clamp-2",
                compact && "text-xs",
              )}
            >
              {draft.title}
            </CardTitle>
            <div
              className={cn(
                "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
                compact && "text-[10px]",
              )}
            >
              <Clock size={12} />
              <span>{formatDate(draft.updatedAt)}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onLoad} disabled={isLoading}>
                <Upload size={14} className="mr-2" />
                Load Draft
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                disabled={isLoading}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", compact && "p-0 pt-2")}>
        <div className="space-y-2">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span
              className={cn(
                "font-medium",
                getCompletionColor(draft.completionPercentage),
              )}
            >
              {draft.completionPercentage}%
            </span>
          </div>
          <Progress value={draft.completionPercentage} className="h-1" />

          {/* Metadata */}
          {draft.metadata && (
            <div className="flex flex-wrap gap-1 mt-2">
              {draft.metadata.platform && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  {draft.metadata.platform}
                </Badge>
              )}
              {draft.metadata.contentType && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {draft.metadata.contentType}
                </Badge>
              )}
              {draft.metadata.industry && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {draft.metadata.industry}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={onLoad}
              disabled={isLoading}
              className="flex-1"
            >
              <Upload size={12} className="mr-1" />
              Load
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

DraftCard.displayName = "DraftCard";

// ============================================================================
// SAVE DRAFT DIALOG
// ============================================================================

const SaveDraftDialog = memo<SaveDraftDialogProps>(
  ({ open, onOpenChange, onSave, isSaving = false, defaultTitle = "" }) => {
    const [title, setTitle] = useState(defaultTitle);
    const [description, setDescription] = useState("");

    const handleSave = useCallback(() => {
      if (!title.trim()) return;

      onSave(title, { description: description.trim() || undefined });
    }, [title, description, onSave]);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Draft</DialogTitle>
            <DialogDescription>
              Give your draft a meaningful name to easily find it later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="draft-title">Draft Title</Label>
              <Input
                id="draft-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your draft..."
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft-description">Description (Optional)</Label>
              <Textarea
                id="draft-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a brief description..."
                disabled={isSaving}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

SaveDraftDialog.displayName = "SaveDraftDialog";

// ============================================================================
// DELETE CONFIRMATION DIALOG
// ============================================================================

const DeleteConfirmDialog = memo<DeleteConfirmDialogProps>(
  ({ draft, onOpenChange, onConfirm, isDeleting = false }) => {
    return (
      <AlertDialog open={!!draft} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{draft?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
);

DeleteConfirmDialog.displayName = "DeleteConfirmDialog";

// ============================================================================
// MAIN DRAFT MANAGER UI COMPONENT
// ============================================================================

export const DraftManagerUI = memo<DraftManagerUIProps>(
  ({
    formData,
    currentStep,
    completionPercentage,
    onLoadDraft,
    onSaveDraft,
    compact = false,
    className,
  }) => {
    const { state, actions } = useDraftManager({
      autoSave: true,
      showToasts: true,
    });

    // Local state for dialogs
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);
    const [loadingDraftId, setLoadingDraftId] = useState<string | null>(null);

    // Handle manual save
    const handleManualSave = useCallback(
      async (title: string, metadata?: Record<string, unknown>) => {
        const draft = await actions.saveDraft(
          formData,
          currentStep,
          completionPercentage,
          { title, metadata, isAutoSave: false },
        );

        if (draft) {
          onSaveDraft?.(draft);
          setShowSaveDialog(false);
        }
      },
      [formData, currentStep, completionPercentage, actions, onSaveDraft],
    );

    // Handle draft load
    const handleLoadDraft = useCallback(
      async (draft: Draft) => {
        setLoadingDraftId(draft.id);

        try {
          const loadedData = await actions.loadDraft(draft.id);
          if (loadedData) {
            onLoadDraft?.(loadedData, draft);
          }
        } finally {
          setLoadingDraftId(null);
        }
      },
      [actions, onLoadDraft],
    );

    // Handle draft deletion
    const handleDeleteDraft = useCallback(async () => {
      if (!draftToDelete) return;

      await actions.deleteDraft(draftToDelete.id);
      setDraftToDelete(null);
    }, [draftToDelete, actions]);

    // Auto-save status
    const autoSaveStatus =
      state.autoSaveEnabled && state.lastSaved
        ? `Last saved ${new Date(state.lastSaved).toLocaleTimeString()}`
        : state.autoSaveEnabled
          ? "Auto-save enabled"
          : "Auto-save disabled";

    return (
      <>
        <Card className={cn("w-full", className)}>
          <CardHeader className={cn("pb-4", compact && "pb-2")}>
            <div className="flex items-center justify-between">
              <CardTitle
                className={cn("text-lg font-semibold", compact && "text-base")}
              >
                <FolderOpen size={18} className="inline mr-2" />
                Draft Manager
              </CardTitle>

              <div className="flex items-center gap-2">
                {state.storageStats && (
                  <Badge variant="outline" className="text-xs">
                    {state.storageStats.draftCount} drafts
                  </Badge>
                )}

                <Button
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={state.isSaving}
                >
                  <Save size={14} className="mr-1" />
                  Save Draft
                </Button>
              </div>
            </div>

            {/* Auto-save status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {state.autoSaveEnabled ? (
                <CheckCircle size={12} className="text-green-600" />
              ) : (
                <AlertTriangle size={12} className="text-yellow-600" />
              )}
              <span>{autoSaveStatus}</span>
              {state.isSaving && (
                <Badge variant="secondary" className="text-[10px]">
                  Saving...
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className={cn("", compact && "pt-0")}>
            {/* Drafts List */}
            {state.isDraftsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading drafts...
                </div>
              </div>
            ) : state.availableDrafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText size={24} className="mx-auto mb-2 opacity-50" />
                <div className="text-sm">No drafts found</div>
                <div className="text-xs">
                  Save your current progress to create a draft
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-4",
                  compact
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                <AnimatePresence>
                  {state.availableDrafts.map((draft) => (
                    <motion.div
                      key={draft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DraftCard
                        draft={draft}
                        onLoad={() => handleLoadDraft(draft)}
                        onDelete={() => setDraftToDelete(draft)}
                        isLoading={loadingDraftId === draft.id}
                        compact={compact}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Storage Stats */}
            {state.storageStats && !compact && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Storage Used</span>
                  <span>
                    {Math.round(state.storageStats.totalSize / 1024)} KB /
                    {Math.round(
                      (state.storageStats.totalSize +
                        state.storageStats.availableSpace) /
                        1024,
                    )}{" "}
                    KB
                  </span>
                </div>
                <Progress
                  value={
                    (state.storageStats.totalSize /
                      (state.storageStats.totalSize +
                        state.storageStats.availableSpace)) *
                    100
                  }
                  className="h-1 mt-1"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Dialog */}
        <SaveDraftDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          onSave={handleManualSave}
          isSaving={state.isSaving}
          defaultTitle={`${formData.contentType || "Content"} for ${formData.platform || "Platform"}`}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          draft={draftToDelete}
          onOpenChange={(open) => !open && setDraftToDelete(null)}
          onConfirm={handleDeleteDraft}
        />
      </>
    );
  },
);

DraftManagerUI.displayName = "DraftManagerUI";
