"use client";

import { useQuery } from "@tanstack/react-query";
import { generateRequestId } from "@/lib/response-utils";
import { transformTopicsForDisplayEnhanced } from "@/lib/topic-adapter-utils";
import { backendService } from "@/services";
import { getErrorInfo } from "@/types/api";
import type { ValidationError } from "@/types/backend";
import type { BackendErrorCode } from "@/types/consistent-response";
import type { TopicData } from "@/types/data-table";
import type { GeneratedTopic } from "@/types/topic-builder";

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
  const query = useQuery<TopicData[]>({
    queryKey: ["topics"],
    queryFn: async () => {
      try {
        const response = await backendService.getTopics();

        // Use enhanced transformation with validation
        const transformResult = await transformTopicsForDisplayEnhanced(
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
          const { transformTopicsForDisplay } = await import("@/services");
          console.log("🔄 Falling back to basic transformation");
          return transformTopicsForDisplay(response.topics);
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
              const { transformTopicsForDisplay } = await import("@/services");
              try {
                return transformTopicsForDisplay(
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

/**
 * Enhanced response type for single topic retrieval with consistent format
 */
interface SingleTopicResponse {
  success: boolean;
  topic: GeneratedTopic;
  request_id: string;
  processing_time_ms?: number;
}

/**
 * Enhanced error response type for single topic operations
 */
interface SingleTopicError {
  error: string;
  error_code: BackendErrorCode;
  details?: string;
  request_id: string;
  fallback_available?: boolean;
}

/**
 * Custom hook to fetch a single topic by ID using TanStack Query v5
 *
 * Features:
 * - Pure consistent response format handling
 * - Enhanced error classification with backend error codes
 * - Request correlation and tracking
 * - Smart caching and retry logic
 * - Processing time tracking
 *
 * @param topicId - The topic ID to fetch
 * @returns Query result with topic data, status, error, and refetch capabilities
 *
 * @example
 * ```tsx
 * const { data: topic, isLoading, error, refetch } = useTopic("topic_12345");
 *
 * if (isLoading) return <div>Loading topic...</div>;
 * if (error) return <div>Error: {error.error}</div>;
 * if (topic) return <TopicDetail topic={topic} />;
 * ```
 */
export function useTopic(topicId: string | undefined) {
  return useQuery<GeneratedTopic, SingleTopicError>({
    queryKey: ["topic", topicId],
    queryFn: async (): Promise<GeneratedTopic> => {
      if (!topicId) {
        const error: SingleTopicError = {
          error: "Topic ID is required",
          error_code: "missing_required_field",
          request_id: generateRequestId("topic_fetch"),
        };
        throw error;
      }

      const requestId = generateRequestId("topic_fetch");

      const response = await fetch(
        `/api/topics/${encodeURIComponent(topicId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        },
      );

      const responseData = await response.json();

      if (!response.ok) {
        const errorResponse: SingleTopicError = {
          error: responseData.error || "Failed to fetch topic",
          error_code: responseData.error_code || "unknown_error",
          details: responseData.details,
          request_id: responseData.request_id || requestId,
          fallback_available: responseData.fallback_available || false,
        };

        console.error("Topic fetch API error:", {
          error_code: errorResponse.error_code,
          status_code: response.status,
          request_id: errorResponse.request_id,
          topic_id: topicId,
        });

        throw errorResponse;
      }

      console.log("Topic fetch success:", {
        topic_id: topicId,
        request_id: responseData.request_id,
        processing_time_ms: responseData.processing_time_ms,
      });

      return responseData.topic;
    },

    // Only run query if topicId is provided
    enabled: !!topicId,

    // Caching configuration for single topics
    staleTime: 5 * 60 * 1000, // 5 minutes - individual topics don't change as frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on focus for individual topics

    // Enhanced retry configuration
    retry: (failureCount, error) => {
      const errorInfo = getErrorInfo(error.error_code);

      if (!errorInfo.retryable) {
        return false;
      }

      // Don't retry for certain error categories
      if (
        ["validation", "authentication", "authorization", "not_found"].includes(
          errorInfo.category,
        )
      ) {
        return false;
      }

      return failureCount < 3;
    },

    retryDelay: (attemptIndex, error) => {
      const errorInfo = getErrorInfo(error?.error_code || "unknown_error");
      const baseDelay = errorInfo.category === "external_service" ? 2000 : 1000;

      return Math.min(baseDelay * 2 ** attemptIndex, 15000);
    },
  });
}
