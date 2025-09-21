"use client";

import { useQuery } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import { backendService } from "@/services/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

const topicsLogger = logger.forComponent("useTopics");

/**
 * TanStack Query hook for fetching topics from backend
 * Uses client-side fetching for Next.js 15 best practices
 */
export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async (): Promise<GeneratedTopic[]> => {
      topicsLogger.info("Fetching topics from backend via BackendService");

      const topics = await backendService.getTopics();

      topicsLogger.info("Successfully fetched topics", {
        count: topics.length,
      });

      return topics;
    },
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
