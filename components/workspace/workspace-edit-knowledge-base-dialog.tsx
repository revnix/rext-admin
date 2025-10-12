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
import { apiClient } from "@/lib/api-client";
import type { KnowledgeBase } from "@/lib/api-client/knowledge";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface WorkspaceEditKnowledgeBaseDialogProps {
  workspaceId: string;
  knowledgeBase: KnowledgeBase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdited?: () => void;
}

/**
 * Workspace Edit Knowledge Base Dialog
 *
 * Dialog for editing an existing knowledge base's name and description.
 */
export function WorkspaceEditKnowledgeBaseDialog({
  workspaceId,
  knowledgeBase,
  open,
  onOpenChange,
  onEdited,
}: WorkspaceEditKnowledgeBaseDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form when knowledge base changes
  useEffect(() => {
    if (knowledgeBase) {
      form.reset({
        name: knowledgeBase.name,
        description: knowledgeBase.description || "",
      });
    }
  }, [knowledgeBase, form]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.knowledge.updateBase(workspaceId, knowledgeBase?.id || "", {
        name: data.name,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      toast.success("Knowledge base updated successfully");
      onOpenChange(false);
      onEdited?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update knowledge base: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  if (!knowledgeBase) return null;

  const isDefault = knowledgeBase.type === "default";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Knowledge Base</DialogTitle>
          <DialogDescription>
            Update the name and description of your knowledge base.
            {isDefault &&
              " Note: Default knowledge base name cannot be changed."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Product Documentation"
                      {...field}
                      disabled={updateMutation.isPending || isDefault}
                    />
                  </FormControl>
                  {isDefault && (
                    <FormDescription className="text-muted-foreground">
                      Default knowledge base name cannot be changed
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Contains all product-related documentation and guides"
                      rows={3}
                      {...field}
                      disabled={updateMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a description to help identify this knowledge base
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
