/**
 * Hook for deleting a topic
 */

import { useState } from "react";
import { classifyError } from "@/lib/error-utils";
import { log } from "@/lib/logger";
import type { ActionResult } from "../types";

export function useDeleteTopic() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTopic = async (
    topicId: string,
    onDelete?: (topicId: string) => Promise<void> | void,
  ): Promise<ActionResult> => {
    if (!onDelete) {
      return {
        success: false,
        message: "No delete handler provided",
      };
    }

    setIsDeleting(true);

    try {
      await onDelete(topicId);

      return {
        success: true,
        message: "Topic deleted successfully!",
      };
    } catch (error) {
      log.error(`Failed to delete topic ${topicId}:`, error);
      const classifiedError = classifyError(error);

      return {
        success: false,
        error: classifiedError,
        message: "Failed to delete topic",
      };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteTopic,
    isDeleting,
  };
}
