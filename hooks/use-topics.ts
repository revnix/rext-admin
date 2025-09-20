"use client";

import { useQuery } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import type { GeneratedTopic } from "@/types/topic-builder";

// Backend URL for client-side requests (safe to expose)
const BACKEND_URL = "http://localhost:2024";
// API key will be handled server-side or through secure authentication

const topicsLogger = logger.forComponent("useTopics");

/**
 * TanStack Query hook for fetching topics from backend
 * Uses client-side fetching for Next.js 15 best practices
 */
export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async (): Promise<GeneratedTopic[]> => {
      topicsLogger.info("Fetching topics from backend");

      const response = await fetch(`${BACKEND_URL}/api/topic/get-topics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // API key authentication will be handled by backend or auth middleware
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        topicsLogger.error("Failed to fetch topics", {
          status: response.status,
          error: errorText,
        });
        throw new Error(
          `Failed to fetch topics: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();

      // Handle backend consistent response format
      // Backend returns: { status: "success", data: { topics: [...], total_count: n }, message: "..." }
      const topics = data.data?.topics || data.topics || [];

      topicsLogger.info("Successfully fetched topics", {
        count: topics.length,
      });

      return topics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
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

      topicsLogger.info("Fetching single topic", { topic_id: id });

      const response = await fetch(`${BACKEND_URL}/api/topic/get-topic/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // API key authentication will be handled by backend or auth middleware
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorText = await response.text().catch(() => "Unknown error");
        topicsLogger.error("Failed to fetch topic", {
          topic_id: id,
          status: response.status,
          error: errorText,
        });
        throw new Error(
          `Failed to fetch topic: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();

      // Handle backend consistent response format
      // Backend returns: { status: "success", data: topic_data, message: "..." }
      const topic = data.data || data || null;

      topicsLogger.info("Successfully fetched topic", {
        topic_id: id,
        found: !!topic,
      });

      return topic;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // No retries
    refetchOnWindowFocus: false,
  });
}
