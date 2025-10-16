/**
 * Hook for navigating to content creation
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { classifyError } from "@/lib/error-utils";
import { log } from "@/lib/logger";
import { workspaceRoutes } from "@/lib/routes";
import { useCurrentWorkspace } from "@/stores/workspace-store";
import type { ActionResult } from "../types";

export function useNavigateToContent() {
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateToContent = (
    topicId: string,
    onNavigateToContent?: (topicId: string) => void,
  ): ActionResult => {
    if (onNavigateToContent) {
      // Use provided handler
      try {
        setIsNavigating(true);
        log.info(
          `Using handler to navigate to content creation for topic ${topicId}`,
        );
        onNavigateToContent(topicId);

        return {
          success: true,
          message: "Navigating to content creation...",
        };
      } catch (error) {
        log.error(
          `Failed to navigate to content creation for topic ${topicId}:`,
          error,
        );
        const classifiedError = classifyError(error);

        return {
          success: false,
          error: classifiedError,
          message: "Failed to navigate to content creation",
        };
      } finally {
        setIsNavigating(false);
      }
    }

    // Fallback to direct navigation if no handler provided
    try {
      setIsNavigating(true);
      log.info(`Navigating to content creation for topic ${topicId}`);

      const workspaceSlug = currentWorkspace?.slug;
      if (!workspaceSlug) {
        throw new Error("No workspace selected");
      }

      router.push(
        `${workspaceRoutes.contentCreate(workspaceSlug)}?topicId=${topicId}`,
      );

      return {
        success: true,
        message: "Navigating to content creation...",
      };
    } catch (error) {
      log.error(
        `Failed to navigate to content creation for topic ${topicId}:`,
        error,
      );
      const classifiedError = classifyError(error);

      return {
        success: false,
        error: classifiedError,
        message: "Failed to navigate to content creation",
      };
    } finally {
      setIsNavigating(false);
    }
  };

  return {
    navigateToContent,
    isNavigating,
  };
}
