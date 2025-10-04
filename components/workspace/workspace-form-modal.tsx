"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { log } from "@/lib/logger";
import {
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceForm, useWorkspaceStore } from "@/stores/workspace-store";

/**
 * Workspace Form Modal Component
 *
 * A responsive modal for creating and editing workspaces.
 * Uses React Hook Form with Zod validation for robust form handling.
 *
 * Features:
 * - Create/Edit mode support with proper data syncing
 * - Real-time validation with Zod schema
 * - Responsive design for mobile and desktop
 * - Keyboard navigation and accessibility
 * - Character counting and input constraints
 * - Form state management with React Hook Form
 */
export function WorkspaceFormModal() {
  const workspaceForm = useWorkspaceForm();
  const { closeWorkspaceForm } = useWorkspaceStore();

  // Set up React Hook Form with Zod validation
  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
  } = form;

  // Watch description for character count
  const watchedDescription = watch("description") || "";

  // Sync form with workspace store data when modal opens
  useEffect(() => {
    if (workspaceForm.isOpen) {
      reset({
        title: workspaceForm.data.title || "",
        description: workspaceForm.data.description || "",
        url: workspaceForm.data.url || "",
      });
    }
  }, [workspaceForm.isOpen, workspaceForm.data, reset]);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && workspaceForm.isOpen && !isSubmitting) {
        closeWorkspaceForm();
      }
    };

    if (workspaceForm.isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
    return undefined;
  }, [workspaceForm.isOpen, closeWorkspaceForm, isSubmitting]);

  // Reset form when modal closes
  useEffect(() => {
    if (!workspaceForm.isOpen) {
      reset();
    }
  }, [workspaceForm.isOpen, reset]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      closeWorkspaceForm();
    }
  };

  // Form submission handler (actual API calls will be implemented in next subtask)
  const onSubmit = (data: WorkspaceFormData) => {
    log.info("Form submitted with data:", data);
    log.info(
      "Validation passed - API calls will be implemented in subtask 1.1.3",
    );
    // API integration will be implemented in subtask 1.1.3
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter workspace title"
              {...register("title")}
              disabled={isSubmitting}
              className={errors.title ? "border-destructive" : ""}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive" role="alert">
                {errors.title.message}
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
              {...register("url")}
              disabled={isSubmitting}
              className={errors.url ? "border-destructive" : ""}
            />
            {errors.url && (
              <p className="text-sm text-destructive" role="alert">
                {errors.url.message}
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
              {...register("description")}
              disabled={isSubmitting}
              className={`resize-none ${errors.description ? "border-destructive" : ""}`}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {watchedDescription.length}/1000 characters
            </p>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeWorkspaceForm}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
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
