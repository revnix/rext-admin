"use client";

import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceForm, useWorkspaceStore } from "@/stores/workspace-store";

/**
 * Workspace Form Modal Component
 *
 * A responsive modal for creating and editing workspaces.
 * Integrates with the workspace store for state management.
 *
 * Features:
 * - Create/Edit mode support
 * - Responsive design for mobile and desktop
 * - Keyboard navigation and accessibility
 * - Real-time validation (will be implemented in next subtask)
 */
export function WorkspaceFormModal() {
  const workspaceForm = useWorkspaceForm();
  const { closeWorkspaceForm, updateWorkspaceFormData } = useWorkspaceStore();

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && workspaceForm.isOpen) {
        closeWorkspaceForm();
      }
    };

    if (workspaceForm.isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [workspaceForm.isOpen, closeWorkspaceForm]);

  // Reset form data when modal closes
  useEffect(() => {
    if (!workspaceForm.isOpen && !workspaceForm.isSubmitting) {
      // Form reset will be handled in next subtask
    }
  }, [workspaceForm.isOpen, workspaceForm.isSubmitting]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !workspaceForm.isSubmitting) {
      closeWorkspaceForm();
    }
  };

  const handleInputChange = (field: keyof typeof workspaceForm.data) => {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      updateWorkspaceFormData({ [field]: event.target.value });
    };
  };

  // Prevent form submission for now (will be implemented in next subtask)
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Form submission logic will be implemented in subtask 1.1.2
    console.log("Form submission will be implemented in next subtask");
  };

  const isCreateMode = workspaceForm.mode === "create";
  const modalTitle = isCreateMode ? "Create Workspace" : "Edit Workspace";
  const modalDescription = isCreateMode
    ? "Add a new workspace to organize your knowledge and content."
    : "Update your workspace details and settings.";
  const submitButtonText = isCreateMode ? "Create Workspace" : "Save Changes";

  return (
    <Dialog open={workspaceForm.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter workspace title"
              value={workspaceForm.data.title}
              onChange={handleInputChange("title")}
              disabled={workspaceForm.isSubmitting}
              className={workspaceForm.errors.title ? "border-destructive" : ""}
              maxLength={200}
              required
              autoFocus
            />
            {workspaceForm.errors.title && (
              <p className="text-sm text-destructive" role="alert">
                {workspaceForm.errors.title}
              </p>
            )}
          </div>

          {/* URL Field */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">
              Website URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={workspaceForm.data.url}
              onChange={handleInputChange("url")}
              disabled={workspaceForm.isSubmitting}
              className={workspaceForm.errors.url ? "border-destructive" : ""}
              required
            />
            {workspaceForm.errors.url && (
              <p className="text-sm text-destructive" role="alert">
                {workspaceForm.errors.url}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The website URL will be used to extract brand voice and content.
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Optional description for your workspace"
              value={workspaceForm.data.description}
              onChange={handleInputChange("description")}
              disabled={workspaceForm.isSubmitting}
              className={`resize-none ${workspaceForm.errors.description ? "border-destructive" : ""}`}
              maxLength={1000}
              rows={3}
            />
            {workspaceForm.errors.description && (
              <p className="text-sm text-destructive" role="alert">
                {workspaceForm.errors.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {workspaceForm.data.description.length}/1000 characters
            </p>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeWorkspaceForm}
              disabled={workspaceForm.isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={workspaceForm.isSubmitting}
              className="w-full sm:w-auto"
            >
              {workspaceForm.isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {isCreateMode ? "Creating..." : "Saving..."}
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
