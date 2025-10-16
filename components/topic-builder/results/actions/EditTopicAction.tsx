"use client";
import { SimpleErrorDisplay } from "./SimpleErrorDisplay";

/**
 * Edit Topic Action Component
 * Handles editing a topic's details
 */

import { Edit, Loader2 } from "lucide-react";
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
import { SuccessAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GeneratedTopic } from "@/types/topic-builder";
import { useEditTopic } from "./hooks/useEditTopic";
import type { BaseActionProps } from "./types";

interface EditTopicActionProps extends BaseActionProps {
  onEdit?: (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => Promise<void> | void;
  variant?: "button" | "dropdown-item";
}

export function EditTopicAction({
  topic,
  onEdit,
  disabled = false,
  showLabel = false,
  variant = "button",
}: EditTopicActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { editTopic, isEditing, editForm, errors } = useEditTopic(topic);

  const handleEdit = async () => {
    // Clear previous feedback
    setError(undefined);
    setSuccess(undefined);

    await editForm.handleSubmit(async (formData) => {
      const res = await editTopic(formData, onEdit);

      if (res.success) {
        setSuccess(res.message);
        setIsDialogOpen(false);
      } else {
        setError(res.message);
      }
    })();
  };

  if (variant === "dropdown-item") {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="flex w-full items-center text-left"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Topic
        </button>

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

            {error && (
              <SimpleErrorDisplay
                message={error || ""}
                onRetry={() => {
                  setError(undefined);
                  handleEdit();
                }}
              />
            )}
            {success && <SuccessAlert message={success} />}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing ? (
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
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5 cursor-pointer"
        >
          <Edit className="h-4 w-4" />
          {showLabel && "Edit"}
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

          {error && (
            <SimpleErrorDisplay
              message={error || ""}
              onRetry={() => {
                setError(undefined);
                handleEdit();
              }}
            />
          )}
          {success && <SuccessAlert message={success} />}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isEditing}
          >
            Cancel
          </Button>
          <Button onClick={handleEdit} disabled={isEditing}>
            {isEditing ? (
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
  );
}
