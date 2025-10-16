/**
 * Hook for saving a topic
 */

import { useState } from "react";
import { toast } from "sonner";
import { useTopicSaveMutation } from "@/hooks/useTopicMutations";
import { classifyError } from "@/lib/error-utils";
import { log } from "@/lib/logger";
import { useCurrentWorkspace } from "@/stores/workspace-store";
import type { GeneratedTopic } from "@/types/topic-builder";
import type { ActionResult } from "../types";

export function useSaveTopic() {
  const currentWorkspace = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const isWorkspaceLoading = !currentWorkspace;

  // TanStack Query mutation for optimistic saves (use dummy ID during loading)
  const saveMutation = useTopicSaveMutation(
    workspaceId || "00000000-0000-0000-0000-000000000000",
  );

  const [isSaving, setIsSaving] = useState(false);

  const saveTopic = async (
    topic: GeneratedTopic,
    onSuccess?: (topicId: string) => Promise<void> | void,
  ): Promise<ActionResult> => {
    // Check if workspace is still loading
    if (isWorkspaceLoading) {
      toast.warning("Workspace is loading", {
        description: "Please wait for workspace to load before saving",
      });
      return {
        success: false,
        message: "Workspace is loading",
      };
    }

    // Check if workspace is selected
    if (!workspaceId) {
      toast.error("Please select a workspace first", {
        description: "Topics must be saved to a workspace",
      });
      return {
        success: false,
        message: "No workspace selected",
      };
    }

    try {
      setIsSaving(true);

      // Use TanStack Query mutation for optimistic updates
      await saveMutation.mutateAsync(topic);

      // Call the optional onSave callback if provided
      if (onSuccess) {
        await onSuccess(topic.id);
      }

      log.info(`Topic ${topic.id} saved successfully`);

      return {
        success: true,
        message: `Topic "${topic.title}" saved successfully!`,
      };
    } catch (error) {
      log.error(`Failed to save topic ${topic.id}:`, error);

      // Classify error for user-friendly display
      const classifiedError = classifyError(error);

      return {
        success: false,
        error: classifiedError,
        message: "Failed to save topic",
      };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveTopic,
    isSaving: isSaving || saveMutation.isPending,
    isWorkspaceLoading,
  };
}
