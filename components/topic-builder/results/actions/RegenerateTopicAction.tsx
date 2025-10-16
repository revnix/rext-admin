"use client";
import { SimpleErrorDisplay } from "./SimpleErrorDisplay";

/**
 * Regenerate Topic Action Component
 * Handles regenerating a topic with confirmation
 */

import { Loader2, RefreshCw } from "lucide-react";
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
import { useRegenerateTopic } from "./hooks/useRegenerateTopic";
import type { BaseActionProps } from "./types";

interface RegenerateTopicActionProps extends BaseActionProps {
  onRegenerate?: (topicId: string) => Promise<void> | void;
  variant?: "button" | "dropdown-item";
}

export function RegenerateTopicAction({
  topic,
  onRegenerate,
  disabled = false,
  variant = "button",
}: RegenerateTopicActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { regenerateTopic, isRegenerating } = useRegenerateTopic();

  const handleRegenerate = async () => {
    setError(undefined);
    setSuccess(undefined);

    const result = await regenerateTopic(topic.id, onRegenerate);

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
          className="flex w-full items-center text-left"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regenerate Topic</DialogTitle>
              <DialogDescription>
                Are you sure you want to regenerate this topic? This will create
                a new version and you may lose the current content.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <SimpleErrorDisplay
                message={error || ""}
                onRetry={() => {
                  setError(undefined);
                  handleRegenerate();
                }}
              />
            )}
            {success && <SuccessAlert message={success} />}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isRegenerating}
              >
                Cancel
              </Button>
              <Button onClick={handleRegenerate} disabled={isRegenerating}>
                {isRegenerating ? (
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
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled || isRegenerating}
        className="gap-1.5 cursor-pointer"
      >
        {isRegenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate this topic? This will create a
              new version and you may lose the current content.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <SimpleErrorDisplay
              message={error || ""}
              onRetry={() => {
                setError(undefined);
                handleRegenerate();
              }}
            />
          )}
          {success && <SuccessAlert message={success} />}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? (
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
    </>
  );
}
