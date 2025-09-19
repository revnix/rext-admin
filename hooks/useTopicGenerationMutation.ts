"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/response-utils";
import { prepareFormDataForAPI } from "@/lib/topic-builder-utils";
import { getErrorInfo } from "@/types/api";
import type { BackendErrorCode } from "@/types/consistent-response";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

/**
 * Enhanced response type for topic generation API with consistent format
 */
interface TopicGenerationResponse {
  topics: GeneratedTopic[];
  request_id: string;
  generated_at: string;
  model_used?: string;
  generation_time_ms?: number;
}

/**
 * Enhanced error response type with consistent format
 */
interface TopicGenerationError {
  error: string;
  error_code: BackendErrorCode;
  details?: string;
  request_id: string;
  retry_after?: number;
  fallback_available?: boolean;
}

/**
 * Variables passed to the mutation
 */
interface TopicGenerationVariables {
  formData: TopicBuilderFormData;
  requestId?: string;
}

/**
 * Enhanced TanStack Query mutation hook for topic generation
 *
 * Features:
 * - Pure consistent response format handling
 * - Enhanced error classification with backend error codes
 * - Request correlation and tracking
 * - Smart retry logic based on error types
 * - User-friendly error messages
 * - Processing time tracking
 *
 * @example
 * ```tsx
 * const generateMutation = useTopicGenerationMutation();
 *
 * const handleGenerate = async (formData: TopicBuilderFormData) => {
 *   try {
 *     const result = await generateMutation.mutateAsync({ formData });
 *     console.log(`Generated ${result.topics.length} topics`);
 *   } catch (error) {
 *     console.error('Generation failed:', error);
 *   }
 * };
 * ```
 */
export function useTopicGenerationMutation() {
  const generationLogger = logger.forComponent("useTopicGenerationMutation");

  return useMutation<
    TopicGenerationResponse,
    TopicGenerationError,
    TopicGenerationVariables,
    { requestId: string }
  >({
    mutationFn: async ({
      formData,
      requestId = generateRequestId("topic_generation"),
    }): Promise<TopicGenerationResponse> => {
      generationLogger.info("Starting topic generation", {
        requestId,
        topics_count_requested: formData.num_topics ?? 5,
      });

      // Prepare form data for API
      const apiData = prepareFormDataForAPI(formData);

      // Make request to Next.js API route with enhanced headers
      const response = await fetch("/api/topics/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ formData: apiData }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle consistent error response format
        const errorResponse: TopicGenerationError = {
          error: responseData.error || "Topic generation failed",
          error_code: responseData.error_code || "unknown_error",
          details: responseData.details,
          request_id: responseData.request_id || requestId,
          retry_after: responseData.retry_after,
          fallback_available: responseData.fallback_available || false,
        };

        generationLogger.error("Topic generation API error", {
          error_code: errorResponse.error_code,
          status_code: response.status,
          request_id: errorResponse.request_id,
          correlation_id: requestId,
          retry_after: errorResponse.retry_after,
        });

        throw errorResponse;
      }

      // Validate response structure
      if (!responseData.topics || !Array.isArray(responseData.topics)) {
        const errorResponse: TopicGenerationError = {
          error: "Invalid response format from API",
          error_code: "invalid_response_format",
          details: "Expected topics array in response",
          request_id: responseData.request_id || requestId,
        };
        throw errorResponse;
      }

      // Add unique IDs to topics if not present
      const topicsWithIds = responseData.topics.map(
        (topic: GeneratedTopic, index: number) => ({
          ...topic,
          id: topic.id || `topic_${Date.now()}_${index}`,
        }),
      );

      generationLogger.info("Topic generation success", {
        topics_count: topicsWithIds.length,
        request_id: responseData.request_id,
        generation_time_ms: responseData.generation_time_ms,
        model_used: responseData.model_used,
      });

      return {
        topics: topicsWithIds,
        request_id: responseData.request_id || requestId,
        generated_at: responseData.generated_at || new Date().toISOString(),
        model_used: responseData.model_used,
        generation_time_ms: responseData.generation_time_ms,
      };
    },

    // Enhanced mutation lifecycle with 2025 patterns
    onMutate: async ({ requestId }) => {
      const finalRequestId = requestId || generateRequestId("topic_generation");
      generationLogger.debug("Starting topic generation request", {
        requestId: finalRequestId,
      });
      return { requestId: finalRequestId };
    },

    onError: (error, _variables, context) => {
      // Enhanced error handling with consistent format
      const errorInfo = getErrorInfo(error.error_code);

      generationLogger.error("Topic generation failed", {
        error_code: error.error_code,
        error_message: error.error,
        request_id: error.request_id,
        correlation_id: context?.requestId,
        retry_after: error.retry_after,
        category: errorInfo.category,
        severity: errorInfo.severity,
      });

      // Show enhanced error toast with user-friendly message
      toast.error("Generation failed", {
        description: errorInfo.userMessage,
        action: errorInfo.retryable
          ? {
              label: error.retry_after
                ? `Retry in ${error.retry_after}s`
                : "Retry",
              onClick: () => {
                // The retry will be handled by the component using this hook
              },
            }
          : undefined,
        duration: errorInfo.severity === "critical" ? 10000 : 6000,
      });
    },

    onSuccess: (data, _variables, context) => {
      generationLogger.info(
        `Successfully generated ${data.topics.length} topics`,
        {
          topics_count: data.topics.length,
          generation_time_ms: data.generation_time_ms,
          request_id: data.request_id,
          correlation_id: context?.requestId,
          model_used: data.model_used,
        },
      );

      // Enhanced success toast
      toast.success("Topics generated successfully!", {
        description: `Generated ${data.topics.length} topics${
          data.generation_time_ms
            ? ` in ${Math.round(data.generation_time_ms)}ms`
            : ""
        }`,
        duration: 3000,
      });
    },

    // Enhanced retry configuration based on consistent error codes
    retry: (failureCount, error) => {
      // Get error information for smart retry logic
      const errorInfo = getErrorInfo(error.error_code);

      // Don't retry non-retryable errors
      if (!errorInfo.retryable) {
        return false;
      }

      // Don't retry validation and authentication errors
      if (
        ["validation", "authentication", "authorization"].includes(
          errorInfo.category,
        )
      ) {
        return false;
      }

      // Retry up to 3 times for retryable errors
      return failureCount < 3;
    },

    retryDelay: (attemptIndex, error) => {
      // Use backend-suggested retry delay if available
      if (error?.retry_after) {
        return error.retry_after * 1000; // Convert to milliseconds
      }

      // Enhanced exponential backoff based on error type
      const errorInfo = getErrorInfo(error?.error_code || "unknown_error");

      const baseDelay =
        errorInfo.category === "external_service"
          ? 2000
          : errorInfo.category === "network"
            ? 1000
            : errorInfo.category === "system"
              ? 1500
              : 1000;

      return Math.min(baseDelay * 2 ** attemptIndex, 30000); // Max 30s
    },
  });
}

/**
 * Enhanced hook that provides additional utilities for topic generation
 */
export function useTopicGenerationWithMetadata() {
  const mutation = useTopicGenerationMutation();

  return {
    ...mutation,

    // Enhanced helpers
    generateWithTracking: (
      formData: TopicBuilderFormData,
      trackingId?: string,
    ) => {
      const requestId =
        trackingId || generateRequestId("topic_generation_tracked");
      return mutation.mutateAsync({ formData, requestId });
    },

    // Get current request metadata
    getCurrentRequestId: () => {
      return mutation.context?.requestId;
    },

    // Check if error is retryable
    isRetryableError: (error: TopicGenerationError) => {
      const errorInfo = getErrorInfo(error.error_code);
      return errorInfo.retryable;
    },

    // Get user-friendly error message
    getUserFriendlyError: (error: TopicGenerationError) => {
      const errorInfo = getErrorInfo(error.error_code);
      return errorInfo.userMessage;
    },
  };
}
