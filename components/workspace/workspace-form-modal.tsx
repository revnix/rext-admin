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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const closeWorkspaceForm = useWorkspaceStore(
    (state) => state.closeWorkspaceForm,
  );

  // Set up React Hook Form with Zod validation
  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      title: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      url: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = form;

  // Sync form with workspace store data when modal opens
  useEffect(() => {
    if (workspaceForm.isOpen) {
      reset({
        title: workspaceForm.data.title || "",
        timezone:
          workspaceForm.data.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
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

          {/* Timezone Field */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium">
              Timezone
            </Label>
            <Select
              value={form.watch("timezone") || ""}
              onValueChange={(value) =>
                form.setValue("timezone", value, { shouldValidate: true })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>North America</SelectLabel>
                  <SelectItem value="America/New_York">
                    Eastern Time (ET)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    Central Time (CT)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    Mountain Time (MT)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time (PT)
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Europe</SelectLabel>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                  <SelectItem value="Europe/Istanbul">
                    Istanbul (TRT)
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Asia</SelectLabel>
                  <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                  <SelectItem value="Asia/Karachi">Karachi (PKT)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="Asia/Singapore">
                    Singapore (SGT)
                  </SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Australia & Pacific</SelectLabel>
                  <SelectItem value="Australia/Sydney">
                    Sydney (AEDT)
                  </SelectItem>
                  <SelectItem value="Pacific/Auckland">
                    Auckland (NZDT)
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Other</SelectLabel>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.timezone && (
              <p className="text-sm text-destructive" role="alert">
                {errors.timezone.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
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
