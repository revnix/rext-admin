"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Loader2, Save, Tag, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField, ValidationInput } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { useTextKnowledgeStore } from "@/stores/knowledge";

// Validation schema
const editTextSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(50000, "Content must be 50,000 characters or less")
    .trim(),
  tags: z.array(z.string().min(1).max(50)).max(10, "Maximum 10 tags allowed"),
});

type EditTextFormData = z.infer<typeof editTextSchema>;

interface EditTextDialogProps {
  workspaceId: string;
  textId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Auto-save hook with debouncing
function useAutoSave(
  onSave: (data: EditTextFormData) => Promise<void>,
  delay: number = 2000,
) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback(
    (data: EditTextFormData) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        onSave(data);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [onSave, delay, timeoutId],
  );

  const cancelAutoSave = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  return { debouncedSave, cancelAutoSave };
}

export function EditTextDialog({
  workspaceId,
  textId,
  open,
  onOpenChange,
}: EditTextDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTag, setCurrentTag] = useState("");

  const { items, updateItem } = useTextKnowledgeStore();
  const currentItem = items.find((item) => item.id === textId);

  const form = useForm<EditTextFormData>({
    resolver: zodResolver(editTextSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: [],
    },
  });

  const { watch, setValue, reset } = form;
  const watchedTags = watch("tags") || [];
  const watchedData = watch();

  // Auto-save function
  const handleAutoSave = useCallback(
    async (data: EditTextFormData) => {
      if (!hasUnsavedChanges) return;

      try {
        setIsSaving(true);
        const updatedItem = await apiClient.knowledge.updateText(
          workspaceId,
          textId,
          {
            title: data.title,
            content: data.content,
            tags: data.tags?.length ? data.tags : undefined,
          },
        );

        updateItem(textId, updatedItem);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      } catch (error) {
        toast.error(
          `Auto-save failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsSaving(false);
      }
    },
    [workspaceId, textId, updateItem, hasUnsavedChanges],
  );

  const { debouncedSave, cancelAutoSave } = useAutoSave(handleAutoSave);

  // Load initial data
  useEffect(() => {
    if (open && currentItem) {
      setIsLoading(true);
      reset({
        title: currentItem.title,
        content: currentItem.content,
        tags: currentItem.tags || [],
      });
      setHasUnsavedChanges(false);
      setLastSaved(
        currentItem.updated_at ? new Date(currentItem.updated_at) : null,
      );
      setIsLoading(false);
    }
  }, [open, currentItem, reset]);

  // Watch for changes and trigger auto-save
  useEffect(() => {
    if (isLoading || !currentItem) return;

    const hasChanges =
      watchedData.title !== currentItem.title ||
      watchedData.content !== currentItem.content ||
      JSON.stringify(watchedData.tags) !==
        JSON.stringify(currentItem.tags || []);

    if (hasChanges && !hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }

    if (hasChanges) {
      debouncedSave(watchedData);
    }
  }, [watchedData, currentItem, isLoading, hasUnsavedChanges, debouncedSave]);

  const handleAddTag = () => {
    const tag = currentTag.trim();
    if (tag && !watchedTags.includes(tag) && watchedTags.length < 10) {
      setValue("tags", [...watchedTags, tag]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      watchedTags.filter((tag) => tag !== tagToRemove),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSaveNow = async () => {
    if (!hasUnsavedChanges) return;

    cancelAutoSave();
    await handleAutoSave(watchedData);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      // Force save before closing
      cancelAutoSave();
      handleAutoSave(watchedData);
    }
    onOpenChange(false);
  };

  if (!currentItem) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Edit Text Note
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <span>Make changes to your text note. Changes are auto-saved.</span>
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form className="space-y-6">
            <div className="space-y-4">
              {/* Save Status */}
              <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Saving...</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <div className="h-2 w-2 bg-orange-500 rounded-full" />
                      <span className="text-sm">Unsaved changes</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      <span className="text-sm">All changes saved</span>
                    </>
                  )}
                </div>
                {hasUnsavedChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveNow}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Now
                  </Button>
                )}
              </div>

              {/* Title Field */}
              <FormField
                label="Title"
                required
                error={form.formState.errors.title?.message}
              >
                <ValidationInput
                  placeholder="Enter a descriptive title..."
                  {...form.register("title")}
                  disabled={isLoading}
                />
              </FormField>

              {/* Content Field */}
              <FormField
                label="Content"
                required
                error={form.formState.errors.content?.message}
              >
                <Textarea
                  placeholder="Write your content here..."
                  className="min-h-[300px] resize-y"
                  {...form.register("content")}
                  disabled={isLoading}
                />
              </FormField>

              {/* Tags Field */}
              <div className="space-y-2">
                <Label htmlFor="tag-input">Tags (optional)</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="tag-input"
                      placeholder="Add a tag..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading || watchedTags.length >= 10}
                      maxLength={50}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={
                        !currentTag.trim() ||
                        watchedTags.includes(currentTag.trim()) ||
                        watchedTags.length >= 10 ||
                        isLoading
                      }
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Tag Display */}
                  {watchedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {watchedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {watchedTags.length}/10 tags • Press Enter or click + to add
                    • Click tag to remove
                  </p>
                </div>
                {form.formState.errors.tags && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.tags.message}
                  </p>
                )}
              </div>

              {/* Character Count */}
              <div className="text-xs text-muted-foreground text-right">
                {watch("content")?.length || 0} / 50,000 characters
              </div>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
