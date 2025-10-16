/**
 * Hook for regenerating a topic
 */

import { useState } from "react";
import { classifyError } from "@/lib/error-utils";
import { log } from "@/lib/logger";
import type { ActionResult } from "../types";

export function useRegenerateTopic() {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerateTopic = async (
    topicId: string,
    onRegenerate?: (topicId: string) => Promise<void> | void,
  ): Promise<ActionResult> => {
    if (!onRegenerate) {
      return {
        success: false,
        message: "No regenerate handler provided",
      };
    }

    setIsRegenerating(true);

    try {
      await onRegenerate(topicId);

      log.info(`Topic ${topicId} regenerated successfully`);

      return {
        success: true,
        message: "Topic regenerated successfully!",
      };
    } catch (error) {
      log.error(`Failed to regenerate topic ${topicId}:`, error);
      const classifiedError = classifyError(error);

      return {
        success: false,
        error: classifiedError,
        message: "Failed to regenerate topic",
      };
    } finally {
      setIsRegenerating(false);
    }
  };

  return {
    regenerateTopic,
    isRegenerating,
  };
}
