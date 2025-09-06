"use client";

import { useQuery } from "@tanstack/react-query";
import { transformTopicsToIdeasEnhanced } from "@/lib/topic-adapter-utils";
import { backendService } from "@/services";
import type { ValidationError } from "@/types/backend";
import type { IdeaData } from "@/types/data-table";

/**
 * Custom hook to fetch and transform topics data using TanStack Query v5 with enhanced validation
 *
 * Provides:
 * - Automatic caching with 'topics' key
 * - Background refetching
 * - Loading and error states
 * - Retry mechanism for transient failures
 * - Enhanced validation with Zod schemas
 * - Transformed data ready for DataTable consumption
 * - Validation error recovery
 *
 * @returns Query result with data, status, error, refetch, and isRefetching
 */
export function useTopics() {
  const query = useQuery<IdeaData[]>({
    queryKey: ["topics"],
    queryFn: async () => {
      try {
        const response = await backendService.getTopics();

        // Use enhanced transformation with validation
        const transformResult = await transformTopicsToIdeasEnhanced(
          response.topics,
          {
            autoFix: true,
            includeMetrics: true,
            includeWarnings: true,
            fallbackBehavior: "lenient",
            continueOnError: true,
          },
        );

        if (!transformResult.success) {
          console.error(
            "🔴 Topics transformation failed:",
            transformResult.errors,
          );

          // Try to recover with basic transformation if enhanced fails
          const { transformTopicsToIdeas } = await import("@/services");
          console.log("🔄 Falling back to basic transformation");
          return transformTopicsToIdeas(response.topics);
        }

        // Log validation metrics and warnings if available
        if (transformResult.metrics) {
          console.log("📊 Transformation metrics:", {
            duration: `${transformResult.metrics.totalDurationMs}ms`,
            throughput: `${transformResult.metrics.throughputPerSecond} items/sec`,
            success: transformResult.metrics.successCount,
            errors: transformResult.metrics.errorCount,
          });
        }

        if (transformResult.warnings && transformResult.warnings.length > 0) {
          console.warn("⚠️  Transformation warnings:", transformResult.warnings);
        }

        return transformResult.data;
      } catch (error) {
        // Enhanced error handling for validation errors
        if (error && typeof error === "object" && "type" in error) {
          const validationError = error as ValidationError;
          if (validationError.type === "validation_error") {
            console.error("🔴 Validation failed in useTopics:", {
              stage: validationError.stage,
              message: validationError.message,
              recoveryActions: validationError.recoveryActions,
            });

            // Attempt fallback recovery
            if (
              validationError.stage === "output" &&
              validationError.originalData
            ) {
              console.log("🔄 Attempting recovery with original data");
              const { transformTopicsToIdeas } = await import("@/services");
              try {
                return transformTopicsToIdeas(
                  // biome-ignore lint/suspicious/noExplicitAny: Recovery fallback with unknown data structure
                  validationError.originalData as any,
                );
              } catch (fallbackError) {
                console.error(
                  "🔴 Fallback transformation also failed:",
                  fallbackError,
                );
              }
            }
          }
        }

        throw error;
      }
    },
    // Specific configuration for topics
    staleTime: 2 * 60 * 1000, // 2 minutes - topics change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refresh when user returns to tab

    // Enhanced retry configuration for topics with validation error handling
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

      // Don't retry validation errors (schema mismatch, data corruption)
      if (error && typeof error === "object" && "type" in error) {
        const validationError = error as unknown as ValidationError;
        if (validationError.type === "validation_error") {
          console.log(
            "🔴 Not retrying validation error:",
            validationError.message,
          );
          return false;
        }
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
