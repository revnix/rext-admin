"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link as LinkIcon, Loader2, Plus } from "lucide-react";
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField, ValidationInput } from "@/components/ui/form-field";
import { log } from "@/lib/logger";
import { webKnowledgeService } from "@/services/knowledge-api";
import { useWebKnowledgeStore } from "@/stores/knowledge-store";

// Validation schema
const addUrlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "URL must start with http:// or https://",
    ),
});

type AddUrlFormData = z.infer<typeof addUrlSchema>;

interface AddUrlDialogProps {
  workspaceId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddUrlDialog({
  workspaceId,
  trigger,
  open,
  onOpenChange,
}: AddUrlDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addItem = useWebKnowledgeStore((state) => state.addItem);
  const setAdding = useWebKnowledgeStore((state) => state.setAdding);
  const items = useWebKnowledgeStore((state) => state.items);

  const form = useForm<AddUrlFormData>({
    resolver: zodResolver(addUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  const handleDialogChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setIsOpen(open);
    }

    if (!open) {
      form.reset();
    }
  };

  const onSubmit = async (data: AddUrlFormData) => {
    try {
      setIsSubmitting(true);
      setAdding(true);

      // Check for duplicate URLs
      const isDuplicate = items.some(
        (item) => item.url.toLowerCase() === data.url.toLowerCase(),
      );

      if (isDuplicate) {
        form.setError("url", {
          type: "manual",
          message: "This URL has already been added to the workspace",
        });
        return;
      }

      // Add the URL
      const newWebKnowledge = await webKnowledgeService.add({
        workspace_id: workspaceId,
        url: data.url,
      });

      // Update the store
      addItem(newWebKnowledge);

      // Show success message
      toast.success("URL added successfully", {
        description: "The webpage will be scraped and processed automatically.",
      });

      // Close dialog and reset form
      handleDialogChange(false);
      form.reset();
    } catch (error) {
      log.error("Failed to add URL:", error);

      // Handle different error types
      if (error instanceof Error) {
        if (
          error.message.includes("duplicate") ||
          error.message.includes("exists")
        ) {
          form.setError("url", {
            type: "manual",
            message: "This URL has already been added to the workspace",
          });
        } else if (
          error.message.includes("invalid") ||
          error.message.includes("malformed")
        ) {
          form.setError("url", {
            type: "manual",
            message: "The URL appears to be invalid or inaccessible",
          });
        } else {
          toast.error("Failed to add URL", {
            description: error.message || "Please try again later",
          });
        }
      } else {
        toast.error("Failed to add URL", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
      setAdding(false);
    }
  };

  const dialogOpen = open !== undefined ? open : isOpen;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Add Web Knowledge
          </DialogTitle>
          <DialogDescription>
            Add a webpage URL to extract and store its content. The page will be
            automatically scraped and processed for your knowledge base.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label="Website URL"
            error={form.formState.errors.url?.message}
            required
            htmlFor="url"
          >
            <ValidationInput
              id="url"
              placeholder="https://example.com/article"
              {...form.register("url")}
              disabled={isSubmitting}
              error={form.formState.errors.url?.message}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter a valid URL starting with http:// or https://. We'll extract
              the content and make it searchable in your workspace.
            </p>
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding URL...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add URL
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Simplified trigger button component
export function AddUrlButton({
  workspaceId,
  variant = "default",
  size = "default",
  className = "",
}: {
  workspaceId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <AddUrlDialog
      workspaceId={workspaceId}
      trigger={
        <Button variant={variant} size={size} className={className}>
          <Plus className="h-4 w-4 mr-2" />
          Add URL
        </Button>
      }
    />
  );
}
