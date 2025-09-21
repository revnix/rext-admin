"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/response-utils";
import { backendService } from "@/services/backend";
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
 * - Direct backend communication (no API route proxying)
 * - Enhanced error classification with backend error codes
 * - Request correlation and tracking
 * - User-friendly error messages
 * - Processing time tracking
 *
 * @example
 * ```tsx
 * const generateMutation = useTopicGenerationMutation();
 *
 * const handleGenerate = () => {
 *   generateMutation.mutate({ formData: wizardFormData });
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

      try {
        // Use backend service directly (no API route proxying)
        generationLogger.info("Calling backend service generateTopics", {
          requestId,
          formData,
        });

        const result = await backendService.generateTopics(formData);

        generationLogger.info("Backend service returned result", {
          requestId,
          result,
          topics_generated: result.topics?.length || 0,
          generation_time_ms: result.generation_time_ms,
        });

        const response = {
          topics: result.topics,
          request_id: result.request_id || requestId,
          generated_at: new Date().toISOString(),
          model_used: result.model_used,
          generation_time_ms: result.generation_time_ms,
        };

        generationLogger.info("Mutation returning response", {
          requestId,
          response,
        });

        return response;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorType =
          error && typeof error === "object" && "type" in error
            ? (error as { type: string }).type
            : "unknown";

        generationLogger.error("Topic generation failed", {
          requestId,
          error: errorMessage,
          error_type: errorType,
        });

        // Convert backend error to expected format
        const errorResponse: TopicGenerationError = {
          error: errorMessage,
          error_code:
            error &&
            typeof error === "object" &&
            "statusCode" in error &&
            error.statusCode === 401
              ? "unauthorized"
              : "external_service_error",
          details:
            error &&
            typeof error === "object" &&
            "context" in error &&
            error.context
              ? JSON.stringify(error.context)
              : undefined,
          request_id: requestId,
          retry_after:
            error &&
            typeof error === "object" &&
            "isRetryable" in error &&
            error.isRetryable
              ? 5000
              : undefined,
          fallback_available: false,
        };

        throw errorResponse;
      }
    },

    onMutate: async (variables) => {
      const requestId =
        variables.requestId || generateRequestId("topic_generation");
      return { requestId };
    },

    onSuccess: (data, _variables, context) => {
      const successMessage = `Generated ${data.topics.length} topics successfully`;

      generationLogger.info("Topic generation mutation success", {
        topics_count: data.topics.length,
        request_id: data.request_id,
        correlation_id: context?.requestId,
        generation_time_ms: data.generation_time_ms,
        model_used: data.model_used,
      });

      // Success toast notification
      toast.success(successMessage, {
        description: `Request ID: ${data.request_id}`,
        duration: 4000,
      });
    },

    onError: (error, _variables, context) => {
      // Get user-friendly error information
      const { userMessage, retryable: shouldShowRetry } = getErrorInfo(
        error.error_code,
      );

      generationLogger.error("Topic generation mutation error", {
        error_code: error.error_code,
        error_message: error.error,
        details: error.details,
        request_id: error.request_id,
        correlation_id: context?.requestId,
        retry_after: error.retry_after,
        fallback_available: error.fallback_available,
      });

      // Error toast notification with action button if retryable
      const toastOptions: {
        description: string;
        duration: number;
        action?: {
          label: string;
          onClick: () => void;
        };
      } = {
        description: `Error code: ${error.error_code}`,
        duration: 6000,
      };

      if (shouldShowRetry && error.retry_after) {
        toastOptions.action = {
          label: "Retry",
          onClick: () => {
            // You can implement retry logic here or let the component handle it
            generationLogger.info("User initiated retry from toast", {
              error_code: error.error_code,
              request_id: error.request_id,
            });
          },
        };
      }

      toast.error(userMessage, toastOptions);
    },
  });
}
