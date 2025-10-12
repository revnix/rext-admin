"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { KnowledgeItem } from "@/components/workspace/workspace-knowledge-table";
import { apiClient } from "@/lib/api-client";

// Edit schemas for each type
const webEditSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
});

const textEditSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(50000, "Content too long"),
});

type WebEditFormData = z.infer<typeof webEditSchema>;
type TextEditFormData = z.infer<typeof textEditSchema>;

interface WorkspaceEditKnowledgeDialogProps {
  workspaceId: string;
  item: KnowledgeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdited?: () => void;
}

/**
 * Workspace Edit Knowledge Dialog
 *
 * Type-specific editing dialog:
 * - Web: Edit title only (URL is immutable)
 * - File: Files cannot be edited (upload new file instead)
 * - Text: Edit title and content
 */
export function WorkspaceEditKnowledgeDialog({
  workspaceId,
  item,
  open,
  onOpenChange,
  onEdited,
}: WorkspaceEditKnowledgeDialogProps) {
  // Web knowledge form
  const webForm = useForm<WebEditFormData>({
    resolver: zodResolver(webEditSchema),
    defaultValues: {
      title: "",
    },
  });

  // Text knowledge form
  const textForm = useForm<TextEditFormData>({
    resolver: zodResolver(textEditSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Update form when item changes
  useEffect(() => {
    if (item) {
      if (item.type === "web") {
        webForm.reset({
          title: item.name,
        });
      } else if (item.type === "text") {
        textForm.reset({
          title: item.name,
          content: item.description || "",
        });
      }
    }
  }, [item, webForm, textForm]);

  // Update web knowledge mutation
  const updateWebMutation = useMutation({
    mutationFn: (data: WebEditFormData) =>
      apiClient.knowledge.updateWeb(workspaceId, item?.id || "", data.title),
    onSuccess: () => {
      toast.success("Website updated successfully");
      onOpenChange(false);
      onEdited?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update website: ${error.message}`);
    },
  });

  // Update text knowledge mutation
  const updateTextMutation = useMutation({
    mutationFn: (data: TextEditFormData) =>
      apiClient.knowledge.updateText(workspaceId, item?.id || "", {
        title: data.title,
        content: data.content,
      }),
    onSuccess: () => {
      toast.success("Text knowledge updated successfully");
      onOpenChange(false);
      onEdited?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update text: ${error.message}`);
    },
  });

  const onWebSubmit = (data: WebEditFormData) => {
    updateWebMutation.mutate(data);
  };

  const onTextSubmit = (data: TextEditFormData) => {
    updateTextMutation.mutate(data);
  };

  const isLoading = updateWebMutation.isPending || updateTextMutation.isPending;

  if (!item) return null;

  // Files cannot be edited
  if (item.type === "file") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Edit File</DialogTitle>
            <DialogDescription>
              Files cannot be edited after upload. Please delete this file and
              upload a new one if you need to make changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit {item.type === "web" ? "Website" : "Text"} Knowledge
          </DialogTitle>
          <DialogDescription>
            Update the details for this knowledge item
          </DialogDescription>
        </DialogHeader>

        {item.type === "web" ? (
          <Form {...webForm}>
            <form
              onSubmit={webForm.handleSubmit(onWebSubmit)}
              className="space-y-4"
            >
              <FormField
                control={webForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Website title"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      The display name for this website source
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  URL
                </p>
                <p className="text-sm truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  URL cannot be changed
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...textForm}>
            <form
              onSubmit={textForm.handleSubmit(onTextSubmit)}
              className="space-y-4"
            >
              <FormField
                control={textForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Knowledge title"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={textForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your knowledge content here..."
                        className="min-h-[200px]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
