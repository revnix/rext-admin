"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import type { GeneratedTopic } from "@/types/topic-builder";

const topicsLogger = logger.forComponent("useTopics");

/**
 * TanStack Query hook for fetching topics from backend
 * Uses client-side fetching for Next.js 15 best practices
 *
 * @param workspaceId - Required workspace ID to scope topics to a specific workspace
 */
export function useTopics(workspaceId: string) {
  return useQuery({
    queryKey: ["topics", workspaceId],
    queryFn: async (): Promise<GeneratedTopic[]> => {
      topicsLogger.info("Fetching workspace-scoped topics from backend", {
        workspace_id: workspaceId,
      });

      const topics = await apiClient.topics.list(workspaceId);

      topicsLogger.info("Successfully fetched topics", {
        count: topics.length,
        workspace_id: workspaceId,
      });

      return topics;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (updated from cacheTime for TanStack Query v5)
    retry: false, // No retries
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for getting a single topic by ID
 */
export function useTopic(id: string, workspaceId: string) {
  return useQuery({
    queryKey: ["topic", id, workspaceId],
    queryFn: async (): Promise<GeneratedTopic | null> => {
      if (!id || !workspaceId) return null;

      topicsLogger.info("Fetching single topic", {
        topic_id: id,
        workspace_id: workspaceId,
      });

      const topic = await apiClient.topics.get(id, workspaceId);

      topicsLogger.info("Successfully fetched topic", {
        topic_id: id,
        workspace_id: workspaceId,
        found: !!topic,
      });

      return topic;
    },
    enabled: !!id && !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (updated from cacheTime)
    retry: false, // No retries
    refetchOnWindowFocus: false,
  });
}
