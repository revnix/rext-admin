"use client";

import {
  Download,
  Edit,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
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
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";

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
  className?: string;
  variant?: "dropdown" | "buttons";
  showLabels?: boolean;
}

interface EditFormData {
  title: string;
  angle: string;
  description: string;
  why_it_works: string;
  tags: string;
}

export function TopicActions({
  topic,
  onSave,
  onEdit,
  onRegenerate,
  onExport,
  onDelete,
  className,
  variant = "dropdown",
  showLabels = false,
}: TopicActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);

  const [loadingStates, setLoadingStates] = useState({
    saving: false,
    editing: false,
    regenerating: false,
    exporting: false,
    deleting: false,
  });

  const [editForm, setEditForm] = useState<EditFormData>({
    title: topic.title,
    angle: topic.angle || "",
    description: topic.description || "",
    why_it_works: topic.why_it_works || "",
    tags: topic.tags?.join(", ") || "",
  });

  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");

  const setLoading = (action: keyof typeof loadingStates, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [action]: loading }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    setLoading("saving", true);
    try {
      await onSave(topic.id);
      console.log(`Topic ${topic.id} saved successfully`);
    } catch (error) {
      console.error(`Failed to save topic ${topic.id}:`, error);
    } finally {
      setLoading("saving", false);
    }
  };

  const handleEdit = async () => {
    if (!onEdit) return;

    setLoading("editing", true);
    try {
      const updates: Partial<GeneratedTopic> = {
        title: editForm.title,
        angle: editForm.angle,
        description: editForm.description,
        why_it_works: editForm.why_it_works,
        tags: editForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await onEdit(topic.id, updates);
      setIsEditDialogOpen(false);
      console.log(`Topic ${topic.id} updated successfully`);
    } catch (error) {
      console.error(`Failed to update topic ${topic.id}:`, error);
    } finally {
      setLoading("editing", false);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;

    setLoading("regenerating", true);
    try {
      await onRegenerate(topic.id);
      setIsRegenerateDialogOpen(false);
      console.log(`Topic ${topic.id} regenerated successfully`);
    } catch (error) {
      console.error(`Failed to regenerate topic ${topic.id}:`, error);
    } finally {
      setLoading("regenerating", false);
    }
  };

  const handleExport = async () => {
    if (!onExport) return;

    setLoading("exporting", true);
    try {
      await onExport([topic], exportFormat);
      setIsExportDialogOpen(false);
      console.log(`Topic ${topic.id} exported as ${exportFormat}`);
    } catch (error) {
      console.error(`Failed to export topic ${topic.id}:`, error);
    } finally {
      setLoading("exporting", false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setLoading("deleting", true);
    try {
      await onDelete(topic.id);
      setIsDeleteDialogOpen(false);
      console.log(`Topic ${topic.id} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete topic ${topic.id}:`, error);
    } finally {
      setLoading("deleting", false);
    }
  };

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  if (variant === "buttons") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {onSave && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isAnyLoading}
            className="gap-1.5"
          >
            {loadingStates.saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {showLabels && "Save"}
          </Button>
        )}

        {onEdit && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                className="gap-1.5"
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
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter topic title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-angle">Angle</Label>
                  <Input
                    id="edit-angle"
                    value={editForm.angle}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        angle: e.target.value,
                      }))
                    }
                    placeholder="Enter topic angle..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter topic description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-why-it-works">Why It Works</Label>
                  <Textarea
                    id="edit-why-it-works"
                    value={editForm.why_it_works}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        why_it_works: e.target.value,
                      }))
                    }
                    placeholder="Explain why this topic works..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input
                    id="edit-tags"
                    value={editForm.tags}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    placeholder="Enter tags separated by commas..."
                  />
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
                className="gap-1.5"
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
            className="h-8 w-8 p-0"
          >
            {isAnyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter topic title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-angle">Angle</Label>
              <Input
                id="edit-angle"
                value={editForm.angle}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, angle: e.target.value }))
                }
                placeholder="Enter topic angle..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter topic description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-why-it-works">Why It Works</Label>
              <Textarea
                id="edit-why-it-works"
                value={editForm.why_it_works}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    why_it_works: e.target.value,
                  }))
                }
                placeholder="Explain why this topic works..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={editForm.tags}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="Enter tags separated by commas..."
              />
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
    </div>
  );
}
