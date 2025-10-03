"use client";

import { useQuery } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import { backendService } from "@/services/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

const topicsLogger = logger.forComponent("useTopics");

/**
 * TanStack Query hook for fetching topics from backend
 * Uses client-side fetching for Next.js 15 best practices
 *
 * @param workspaceId - Optional workspace ID to scope topics to a specific workspace
 */
export function useTopics(workspaceId?: string) {
  return useQuery({
    queryKey: workspaceId ? ["topics", workspaceId] : ["topics"],
    queryFn: async (): Promise<GeneratedTopic[]> => {
      if (workspaceId) {
        topicsLogger.info(
          "Fetching workspace-scoped topics from backend via BackendService",
          { workspace_id: workspaceId },
        );
      } else {
        topicsLogger.info(
          "Fetching all topics from backend via BackendService",
        );
      }

      // TODO: Once backend supports workspace-scoped topics, use:
      // const topics = workspaceId
      //   ? await backendService.getWorkspaceTopics(workspaceId)
      //   : await backendService.getTopics();

      // For now, fetch all topics (backward compatible)
      const topics = await backendService.getTopics();

      topicsLogger.info("Successfully fetched topics", {
        count: topics.length,
        workspace_id: workspaceId || "all",
      });

      return topics;
    },
    enabled: workspaceId ? !!workspaceId : true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (updated from cacheTime for TanStack Query v5)
    retry: false, // No retries
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for getting a single topic by ID
 */
export function useTopic(id: string) {
  return useQuery({
    queryKey: ["topic", id],
    queryFn: async (): Promise<GeneratedTopic | null> => {
      if (!id) return null;

      topicsLogger.info("Fetching single topic via BackendService", {
        topic_id: id,
      });

      const topic = await backendService.getTopic(id);

      topicsLogger.info("Successfully fetched topic", {
        topic_id: id,
        found: !!topic,
      });

      return topic;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (updated from cacheTime)
    retry: false, // No retries
    refetchOnWindowFocus: false,
  });
}
