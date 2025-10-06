"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, Plus, Tag } from "lucide-react";
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField, ValidationInput } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { useTextKnowledgeStore } from "@/stores/knowledge-store";

// Validation schema
const addTextSchema = z.object({
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

type AddTextFormData = z.infer<typeof addTextSchema>;

interface AddTextDialogProps {
  workspaceId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTextDialog({
  workspaceId,
  trigger,
  open,
  onOpenChange,
}: AddTextDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const addItem = useTextKnowledgeStore((state) => state.addItem);

  const actualOpen = open !== undefined ? open : isOpen;
  const actualOnOpenChange = onOpenChange || setIsOpen;

  const form = useForm<AddTextFormData>({
    resolver: zodResolver(addTextSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: [],
    },
  });

  const { watch, setValue, reset } = form;
  const watchedTags = watch("tags") || [];

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

  const onSubmit = async (data: AddTextFormData) => {
    try {
      setIsSubmitting(true);

      const textKnowledge = await apiClient.knowledge.addText(
        workspaceId,
        data.title,
        data.content,
      );

      // Add to store with optimistic update
      addItem(textKnowledge);

      toast.success(`Text note "${data.title}" created successfully`);
      reset();
      actualOnOpenChange(false);
    } catch (error) {
      toast.error(
        `Failed to create text note: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setCurrentTag("");
    }
    actualOnOpenChange(open);
  };

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Text Note
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Text Note
          </DialogTitle>
          <DialogDescription>
            Create a new text note with content and optional tags. This will be
            added to your workspace knowledge base.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Title Field */}
            <FormField
              label="Title"
              required
              error={form.formState.errors.title?.message}
            >
              <ValidationInput
                placeholder="Enter a descriptive title..."
                {...form.register("title")}
                disabled={isSubmitting}
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
                className="min-h-[200px] resize-y"
                {...form.register("content")}
                disabled={isSubmitting}
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
                    disabled={isSubmitting || watchedTags.length >= 10}
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
                      isSubmitting
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
                        <span className="ml-1 text-xs">&times;</span>
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {watchedTags.length}/10 tags • Press Enter or click + to add •
                  Click tag to remove
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => actualOnOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Note
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
