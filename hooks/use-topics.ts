"use client";

import { useQuery } from "@tanstack/react-query";
import { backendService, transformTopicsToIdeas } from "@/services";
import type { IdeaData } from "@/types/data-table";

/**
 * Custom hook to fetch and transform topics data using TanStack Query v5
 *
 * Provides:
 * - Automatic caching with 'topics' key
 * - Background refetching
 * - Loading and error states
 * - Retry mechanism for transient failures
 * - Transformed data ready for DataTable consumption
 *
 * @returns Query result with data, status, error, refetch, and isRefetching
 */
export function useTopics() {
  const query = useQuery<IdeaData[]>({
    queryKey: ["topics"],
    queryFn: async () => {
      const response = await backendService.getTopics();
      return transformTopicsToIdeas(response.topics);
    },
    // Specific configuration for topics
    staleTime: 2 * 60 * 1000, // 2 minutes - topics change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refresh when user returns to tab

    // Enhanced retry configuration for topics
    retry: (failureCount, error) => {
      console.log(
        `Topics fetch attempt ${failureCount + 1} failed:`,
        error.message,
      );

      // Don't retry on authentication errors (401, 403)
      if (error instanceof Error && "status" in error) {
        const status = (error as Error & { status: number }).status;
        if (status === 401 || status === 403) return false;
      }

      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },

    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff, max 10s
  });

  return {
    ...query,
    // Expose additional states for enhanced UI handling
    isInitialLoading: query.status === "pending" && query.isFetching,
    isBackgroundRefetching: query.status === "success" && query.isFetching,
  };
}
