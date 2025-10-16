"use client";
import { SimpleErrorDisplay } from "./SimpleErrorDisplay";

/**
 * Save Topic Action Component
 * Handles saving a topic to the backend
 */

import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SuccessAlert } from "@/components/ui/error-alert";
import { SuccessConfirmationDialog } from "../SuccessConfirmationDialog";
import { useSaveTopic } from "./hooks/useSaveTopic";
import type { BaseActionProps } from "./types";

interface SaveTopicActionProps extends BaseActionProps {
  onSave?: (topicId: string) => Promise<void> | void;
  onNavigateToTopics?: () => void;
  onGenerateNew?: () => void;
  variant?: "button" | "dropdown-item";
}

export function SaveTopicAction({
  topic,
  onSave,
  onNavigateToTopics,
  onGenerateNew,
  disabled = false,
  showLabel = false,
  variant = "button",
}: SaveTopicActionProps) {
  const { saveTopic, isSaving, isWorkspaceLoading } = useSaveTopic();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const handleSave = async () => {
    // Clear previous feedback
    setError(undefined);
    setSuccess(undefined);

    const result = await saveTopic(topic, onSave);

    if (result.success) {
      setSuccess(result.message);
      setIsSuccessDialogOpen(true);
    } else {
      setError(result.message);
    }
  };

  const isLoading = isSaving || isWorkspaceLoading;

  if (variant === "dropdown-item") {
    return (
      <>
        <button
          type="button"
          onClick={isLoading || disabled ? undefined : handleSave}
          disabled={isLoading || disabled}
          className="flex w-full items-center text-left"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Topic
        </button>

        {/* Success Confirmation Dialog */}
        <SuccessConfirmationDialog
          open={isSuccessDialogOpen}
          onOpenChange={setIsSuccessDialogOpen}
          topicTitle={topic.title}
          onNavigateToTopics={onNavigateToTopics || (() => {})}
          onGenerateNew={onGenerateNew || (() => {})}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={isLoading || disabled}
        className="gap-1.5 cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {showLabel && "Save"}
      </Button>

      {/* Error and Success Alerts */}
      {error && (
        <SimpleErrorDisplay
          message={error || ""}
          onRetry={() => {
            setError(undefined);
            handleSave();
          }}
        />
      )}
      {success && <SuccessAlert message={success} />}

      {/* Success Confirmation Dialog */}
      <SuccessConfirmationDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        topicTitle={topic.title}
        onNavigateToTopics={onNavigateToTopics || (() => {})}
        onGenerateNew={onGenerateNew || (() => {})}
      />
    </>
  );
}
