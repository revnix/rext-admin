"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  Edit,
  Loader2,
  MoreHorizontal,
  PenTool,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorAlert, SuccessAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTopicSaveMutation } from "@/hooks/useTopicMutations";
import { classifyError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import { useCurrentWorkspace } from "@/stores/workspace-store";
import type { BackendError } from "@/types/backend";
import { type TopicEditFormData, topicEditFormSchema } from "@/types/forms";
import type { GeneratedTopic } from "@/types/topic-builder";
import { SuccessConfirmationDialog } from "./SuccessConfirmationDialog";

interface TopicActionsProps {
  topic: GeneratedTopic;
  onSave?: (topicId: string) => Promise<void> | void;
  onEdit?: (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => Promise<void> | void;
  onRegenerate?: (topicId: string) => Promise<void> | void;
  onExport?: (
    topics: GeneratedTopic[],
    format: "json" | "csv",
  ) => Promise<void> | void;
  onDelete?: (topicId: string) => Promise<void> | void;
  onNavigateToTopics?: () => void;
  onGenerateNew?: () => void;
  onNavigateToContent?: (topicId: string) => void;
  className?: string;
  variant?: "dropdown" | "buttons";
  showLabels?: boolean;
}

export function TopicActions({
  topic,
  onSave,
  onEdit,
  onRegenerate,
  onExport,
  onDelete,
  onNavigateToTopics,
  onGenerateNew,
  onNavigateToContent,
  className,
  variant = "dropdown",
  showLabels = false,
}: TopicActionsProps) {
  const currentWorkspace = useCurrentWorkspace();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const [loadingStates, setLoadingStates] = useState({
    saving: false,
    editing: false,
    regenerating: false,
    exporting: false,
    deleting: false,
    navigatingToContent: false,
  });

  const [errorStates, setErrorStates] = useState<{
    saving?: BackendError;
    editing?: BackendError;
    regenerating?: BackendError;
    exporting?: BackendError;
    deleting?: BackendError;
    navigatingToContent?: BackendError;
  }>({});

  const [successStates, setSuccessStates] = useState<{
    saving?: string;
    editing?: string;
    regenerating?: string;
    exporting?: string;
    deleting?: string;
    navigatingToContent?: string;
  }>({});

  // Get workspace ID from current workspace
  const workspaceId = currentWorkspace?.id || "";
  const isWorkspaceLoading = !currentWorkspace;

  // TanStack Query mutation for optimistic saves (use dummy ID during loading)
  const saveMutation = useTopicSaveMutation(
    workspaceId || "00000000-0000-0000-0000-000000000000",
  );

  // Router for navigation
  const router = useRouter();

  const editForm = useForm<TopicEditFormData>({
    resolver: zodResolver(topicEditFormSchema),
    defaultValues: {
      title: topic.title,
      angle: topic.angle || "",
      description: topic.description || "",
      why_it_works: topic.why_it_works || "",
      tags: topic.tags?.join(", ") || "",
    },
  });

  const {
    formState: { errors },
  } = editForm;

  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");

  const setLoading = (action: keyof typeof loadingStates, loading: boolean) => {
    // For save action, also check mutation state
    if (action === "saving") {
      setLoadingStates((prev) => ({
        ...prev,
        [action]: loading || saveMutation.isPending,
      }));
    } else {
      setLoadingStates((prev) => ({ ...prev, [action]: loading }));
    }
  };

  const setError = (action: keyof typeof errorStates, error?: BackendError) => {
    setErrorStates((prev) => ({ ...prev, [action]: error }));
  };

  const setSuccess = (action: keyof typeof successStates, message?: string) => {
    setSuccessStates((prev) => ({ ...prev, [action]: message }));
    // Auto-clear success messages after 5 seconds
    if (message) {
      setTimeout(() => {
        setSuccessStates((prev) => ({ ...prev, [action]: undefined }));
      }, 5000);
    }
  };

  const clearFeedback = (action: keyof typeof errorStates) => {
    setError(action, undefined);
    setSuccess(action, undefined);
  };

  const handleSave = async () => {
    clearFeedback("saving");

    // Check if workspace is still loading
    if (isWorkspaceLoading) {
      toast.warning("Workspace is loading", {
        description: "Please wait for workspace to load before saving",
      });
      return;
    }

    // Check if workspace is selected
    if (!workspaceId) {
      toast.error("Please select a workspace first", {
        description: "Topics must be saved to a workspace",
      });
      return;
    }

    try {
      // Set transient success early for responsive feedback (auto-clears)
      setSuccess("saving", `Topic "${topic.title}" saved successfully!`);
      // Use TanStack Query mutation for optimistic updates
      await saveMutation.mutateAsync(topic);

      // Call the optional onSave callback if provided
      if (onSave) {
        await onSave(topic.id);
      }

      // Show success confirmation dialog instead of only inline message
      console.log(
        `Topic ${topic.id} saved successfully, showing confirmation dialog`,
      );
      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error(`Failed to save topic ${topic.id}:`, error);

      // Classify error for user-friendly display
      const classifiedError = classifyError(error);
      // Clear transient success on failure
      setSuccess("saving", undefined);
      setError("saving", classifiedError);
    }
  };

  const handleEdit = editForm.handleSubmit(
    async (formData: TopicEditFormData) => {
      if (!onEdit) return;

      clearFeedback("editing");
      setLoading("editing", true);

      try {
        const updates: Partial<GeneratedTopic> = {
          title: formData.title,
          angle: formData.angle,
          description: formData.description,
          why_it_works: formData.why_it_works,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        };

        await onEdit(topic.id, updates);
        setIsEditDialogOpen(false);
        editForm.reset(); // Reset form after successful submission
        console.log(`Topic ${topic.id} updated successfully`);
        setSuccess("editing", "Topic updated successfully!");
      } catch (error) {
        console.error(`Failed to update topic ${topic.id}:`, error);
        const classifiedError = classifyError(error);
        setError("editing", classifiedError);
      } finally {
        setLoading("editing", false);
      }
    },
  );

  const handleRegenerate = async () => {
    if (!onRegenerate) return;

    clearFeedback("regenerating");
    setLoading("regenerating", true);

    try {
      await onRegenerate(topic.id);
      setIsRegenerateDialogOpen(false);
      console.log(`Topic ${topic.id} regenerated successfully`);
      setSuccess("regenerating", "Topic regenerated successfully!");
    } catch (error) {
      console.error(`Failed to regenerate topic ${topic.id}:`, error);
      const classifiedError = classifyError(error);
      setError("regenerating", classifiedError);
    } finally {
      setLoading("regenerating", false);
    }
  };

  const handleExport = async () => {
    if (!onExport) return;

    clearFeedback("exporting");
    setLoading("exporting", true);

    try {
      await onExport([topic], exportFormat);
      setIsExportDialogOpen(false);
      console.log(`Topic ${topic.id} exported as ${exportFormat}`);
      setSuccess(
        "exporting",
        `Topic exported as ${exportFormat.toUpperCase()} successfully!`,
      );
    } catch (error) {
      console.error(`Failed to export topic ${topic.id}:`, error);
      const classifiedError = classifyError(error);
      setError("exporting", classifiedError);
    } finally {
      setLoading("exporting", false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    clearFeedback("deleting");
    setLoading("deleting", true);

    try {
      await onDelete(topic.id);
      setIsDeleteDialogOpen(false);
      console.log(`Topic ${topic.id} deleted successfully`);
      setSuccess("deleting", "Topic deleted successfully!");
    } catch (error) {
      console.error(`Failed to delete topic ${topic.id}:`, error);
      const classifiedError = classifyError(error);
      setError("deleting", classifiedError);
    } finally {
      setLoading("deleting", false);
    }
  };

  const handleNavigateToContent = () => {
    if (!onNavigateToContent) {
      // Fallback to direct navigation if no handler provided
      clearFeedback("navigatingToContent");
      setLoading("navigatingToContent", true);

      try {
        console.log(`Navigating to content creation for topic ${topic.id}`);
        router.push(`/content/create?topicId=${topic.id}`);
        setSuccess("navigatingToContent", "Navigating to content creation...");
      } catch (error) {
        console.error(
          `Failed to navigate to content creation for topic ${topic.id}:`,
          error,
        );
        const classifiedError = classifyError(error);
        setError("navigatingToContent", classifiedError);
      } finally {
        setLoading("navigatingToContent", false);
      }
    } else {
      // Use provided handler
      try {
        setLoading("navigatingToContent", true);
        console.log(
          `Using handler to navigate to content creation for topic ${topic.id}`,
        );
        onNavigateToContent(topic.id);
        setSuccess("navigatingToContent", "Navigating to content creation...");
      } catch (error) {
        console.error(
          `Failed to navigate to content creation for topic ${topic.id}:`,
          error,
        );
        const classifiedError = classifyError(error);
        setError("navigatingToContent", classifiedError);
      } finally {
        setLoading("navigatingToContent", false);
      }
    }
  };

  const isAnyLoading =
    Object.values(loadingStates).some(Boolean) || saveMutation.isPending;

  if (variant === "buttons") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {onSave && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isAnyLoading}
            className="gap-1.5 cursor-pointer"
          >
            {loadingStates.saving || saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {showLabels && "Save"}
          </Button>
        )}

        {onNavigateToContent && (
          <Button
            variant="default"
            size="sm"
            onClick={handleNavigateToContent}
            disabled={isAnyLoading}
            className="gap-1.5 cursor-pointer"
          >
            {loadingStates.navigatingToContent ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PenTool className="h-4 w-4" />
            )}
            {showLabels && "Write Content"}
          </Button>
        )}

        {onEdit && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="gap-1.5 cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                {showLabels && "Edit"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Topic</DialogTitle>
                <DialogDescription>
                  Make changes to your topic. Click save when you're done.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    {...editForm.register("title")}
                    placeholder="Enter topic title..."
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-angle">Angle</Label>
                  <Input
                    id="edit-angle"
                    {...editForm.register("angle")}
                    placeholder="Enter topic angle..."
                  />
                  {errors.angle && (
                    <p className="text-sm text-red-500">
                      {errors.angle.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    {...editForm.register("description")}
                    placeholder="Enter topic description..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-why-it-works">Why It Works</Label>
                  <Textarea
                    id="edit-why-it-works"
                    {...editForm.register("why_it_works")}
                    placeholder="Explain why this topic works..."
                    rows={3}
                  />
                  {errors.why_it_works && (
                    <p className="text-sm text-red-500">
                      {errors.why_it_works.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input
                    id="edit-tags"
                    {...editForm.register("tags")}
                    placeholder="Enter tags separated by commas..."
                  />
                  {errors.tags && (
                    <p className="text-sm text-red-500">
                      {errors.tags.message}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={loadingStates.editing}
                >
                  Cancel
                </Button>
                <Button onClick={handleEdit} disabled={loadingStates.editing}>
                  {loadingStates.editing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {(onRegenerate || onExport || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="gap-1.5 cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
                {showLabels && "More"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRegenerate && (
                <DropdownMenuItem
                  onClick={() => setIsRegenerateDialogOpen(true)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
              )}
              {(onRegenerate || onExport) && onDelete && (
                <DropdownMenuSeparator />
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Error and Success Alerts for button variant */}
        <div className="space-y-3 mt-4">
          {/* Save operation feedback */}
          {errorStates.saving && (
            <ErrorAlert
              error={errorStates.saving}
              operation="data_save"
              onRetry={() => {
                setError("saving", undefined);
                handleSave();
              }}
            />
          )}
          {successStates.saving && (
            <SuccessAlert message={successStates.saving} />
          )}

          {/* Edit operation feedback */}
          {errorStates.editing && (
            <ErrorAlert
              error={errorStates.editing}
              operation="form_validation"
              onRetry={() => {
                setError("editing", undefined);
                handleEdit();
              }}
            />
          )}
          {successStates.editing && (
            <SuccessAlert message={successStates.editing} />
          )}

          {/* Other operations feedback */}
          {errorStates.regenerating && (
            <ErrorAlert
              error={errorStates.regenerating}
              operation="topic_generation"
              onRetry={() => {
                setError("regenerating", undefined);
                handleRegenerate();
              }}
            />
          )}
          {successStates.regenerating && (
            <SuccessAlert message={successStates.regenerating} />
          )}

          {errorStates.exporting && (
            <ErrorAlert
              error={errorStates.exporting}
              operation="data_save"
              onRetry={() => {
                setError("exporting", undefined);
                handleExport();
              }}
            />
          )}
          {successStates.exporting && (
            <SuccessAlert message={successStates.exporting} />
          )}

          {errorStates.deleting && (
            <ErrorAlert
              error={errorStates.deleting}
              operation="data_save"
              onRetry={() => {
                setError("deleting", undefined);
                handleDelete();
              }}
            />
          )}
          {successStates.deleting && (
            <SuccessAlert message={successStates.deleting} />
          )}

          {/* Content navigation feedback */}
          {errorStates.navigatingToContent && (
            <ErrorAlert
              error={errorStates.navigatingToContent}
              operation="data_save"
              onRetry={() => {
                setError("navigatingToContent", undefined);
                handleNavigateToContent();
              }}
            />
          )}
          {successStates.navigatingToContent && (
            <SuccessAlert message={successStates.navigatingToContent} />
          )}
        </div>

        {/* Success Confirmation Dialog for buttons variant */}
        <SuccessConfirmationDialog
          open={isSuccessDialogOpen}
          onOpenChange={setIsSuccessDialogOpen}
          topicTitle={topic.title}
          onNavigateToTopics={
            onNavigateToTopics ||
            (() => console.log("Navigate to topics not implemented"))
          }
          onGenerateNew={
            onGenerateNew || (() => console.log("Generate new not implemented"))
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isAnyLoading}
            className="h-8 w-8 p-0 cursor-pointer"
          >
            {isAnyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onNavigateToContent && (
            <DropdownMenuItem onClick={handleNavigateToContent}>
              <PenTool className="mr-2 h-4 w-4" />
              Write Content
            </DropdownMenuItem>
          )}
          {onSave && (
            <DropdownMenuItem onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Topic
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Topic
            </DropdownMenuItem>
          )}
          {onRegenerate && (
            <DropdownMenuItem onClick={() => setIsRegenerateDialogOpen(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </DropdownMenuItem>
          )}
          {onExport && (
            <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Make changes to your topic. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                {...editForm.register("title")}
                placeholder="Enter topic title..."
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-angle">Angle</Label>
              <Input
                id="edit-angle"
                {...editForm.register("angle")}
                placeholder="Enter topic angle..."
              />
              {errors.angle && (
                <p className="text-sm text-red-500">{errors.angle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...editForm.register("description")}
                placeholder="Enter topic description..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-why-it-works">Why It Works</Label>
              <Textarea
                id="edit-why-it-works"
                {...editForm.register("why_it_works")}
                placeholder="Explain why this topic works..."
                rows={3}
              />
              {errors.why_it_works && (
                <p className="text-sm text-red-500">
                  {errors.why_it_works.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                {...editForm.register("tags")}
                placeholder="Enter tags separated by commas..."
              />
              {errors.tags && (
                <p className="text-sm text-red-500">{errors.tags.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={loadingStates.editing}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loadingStates.editing}>
              {loadingStates.editing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Topic</DialogTitle>
            <DialogDescription>
              Choose the format to export this topic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as "json" | "csv")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={loadingStates.exporting}
            >
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loadingStates.exporting}>
              {loadingStates.exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Confirmation Dialog */}
      <Dialog
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate this topic? This will create a
              new version and you may lose the current content.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRegenerateDialogOpen(false)}
              disabled={loadingStates.regenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerate}
              disabled={loadingStates.regenerating}
            >
              {loadingStates.regenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this topic? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loadingStates.deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loadingStates.deleting}
            >
              {loadingStates.deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error and Success Alerts */}
      <div className="space-y-3 mt-4">
        {/* Save operation feedback */}
        {errorStates.saving && (
          <ErrorAlert
            error={errorStates.saving}
            operation="data_save"
            onRetry={() => {
              setError("saving", undefined);
              handleSave();
            }}
          />
        )}
        {successStates.saving && (
          <SuccessAlert message={successStates.saving} />
        )}

        {/* Edit operation feedback */}
        {errorStates.editing && (
          <ErrorAlert
            error={errorStates.editing}
            operation="form_validation"
            onRetry={() => {
              setError("editing", undefined);
              handleEdit();
            }}
          />
        )}
        {successStates.editing && (
          <SuccessAlert message={successStates.editing} />
        )}

        {/* Regenerate operation feedback */}
        {errorStates.regenerating && (
          <ErrorAlert
            error={errorStates.regenerating}
            operation="topic_generation"
            onRetry={() => {
              setError("regenerating", undefined);
              handleRegenerate();
            }}
          />
        )}
        {successStates.regenerating && (
          <SuccessAlert message={successStates.regenerating} />
        )}

        {/* Export operation feedback */}
        {errorStates.exporting && (
          <ErrorAlert
            error={errorStates.exporting}
            operation="data_save"
            onRetry={() => {
              setError("exporting", undefined);
              handleExport();
            }}
          />
        )}
        {successStates.exporting && (
          <SuccessAlert message={successStates.exporting} />
        )}

        {/* Delete operation feedback */}
        {errorStates.deleting && (
          <ErrorAlert
            error={errorStates.deleting}
            operation="data_save"
            onRetry={() => {
              setError("deleting", undefined);
              handleDelete();
            }}
          />
        )}
        {successStates.deleting && (
          <SuccessAlert message={successStates.deleting} />
        )}

        {/* Content navigation feedback */}
        {errorStates.navigatingToContent && (
          <ErrorAlert
            error={errorStates.navigatingToContent}
            operation="data_save"
            onRetry={() => {
              setError("navigatingToContent", undefined);
              handleNavigateToContent();
            }}
          />
        )}
        {successStates.navigatingToContent && (
          <SuccessAlert message={successStates.navigatingToContent} />
        )}
      </div>

      {/* Success Confirmation Dialog */}
      <SuccessConfirmationDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        topicTitle={topic.title}
        onNavigateToTopics={
          onNavigateToTopics ||
          (() => console.log("Navigate to topics not implemented"))
        }
        onGenerateNew={
          onGenerateNew || (() => console.log("Generate new not implemented"))
        }
      />
    </div>
  );
}
