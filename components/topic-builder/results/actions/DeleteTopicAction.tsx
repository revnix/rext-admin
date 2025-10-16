"use client";
import { SimpleErrorDisplay } from "./SimpleErrorDisplay";

/**
 * Delete Topic Action Component
 * Handles deleting a topic with confirmation
 */

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SuccessAlert } from "@/components/ui/error-alert";
import { useDeleteTopic } from "./hooks/useDeleteTopic";
import type { BaseActionProps } from "./types";

interface DeleteTopicActionProps extends BaseActionProps {
  onDelete?: (topicId: string) => Promise<void> | void;
  variant?: "button" | "dropdown-item";
}

export function DeleteTopicAction({
  topic,
  onDelete,
  disabled = false,
  variant = "button",
}: DeleteTopicActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { deleteTopic, isDeleting } = useDeleteTopic();

  const handleDelete = async () => {
    setError(undefined);
    setSuccess(undefined);

    const result = await deleteTopic(topic.id, onDelete);

    if (result.success) {
      setSuccess(result.message);
      setIsDialogOpen(false);
    } else {
      setError(result.message);
    }
  };

  if (variant === "dropdown-item") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="flex w-full items-center text-left text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Topic</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this topic? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <SimpleErrorDisplay
                message={error || ""}
                onRetry={() => {
                  setError(undefined);
                  handleDelete();
                }}
              />
            )}
            {success && <SuccessAlert message={success} />}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
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
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled || isDeleting}
        className="gap-1.5 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this topic? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <SimpleErrorDisplay
              message={error || ""}
              onRetry={() => {
                setError(undefined);
                handleDelete();
              }}
            />
          )}
          {success && <SuccessAlert message={success} />}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
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
    </>
  );
}
