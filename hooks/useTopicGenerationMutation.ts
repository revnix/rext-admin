"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { classifyError } from "@/lib/error-utils";
import { prepareFormDataForAPI } from "@/lib/topic-builder-utils";
import type { BackendError, ErrorRecoveryAction } from "@/types/backend";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

/**
 * Response type for topic generation API
 */
interface TopicGenerationResponse {
  topics: GeneratedTopic[];
  request_id: string;
  generated_at: string;
  model_used?: string;
  generation_time_ms?: number;
}

/**
 * Variables passed to the mutation
 */
interface TopicGenerationVariables {
  formData: TopicBuilderFormData;
  requestId?: string;
}

/**
 * TanStack Query mutation hook for topic generation
 *
 * Provides:
 * - Loading states for better UX
 * - Automatic error classification and retry logic
 * - Rate limiting and network error handling
 * - Integration with existing API contract
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
  return useMutation<
    TopicGenerationResponse,
    BackendError,
    TopicGenerationVariables,
    { requestId: string }
  >({
    mutationFn: async ({
      formData,
      requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }): Promise<TopicGenerationResponse> => {
      // Prepare form data for API
      const apiData = prepareFormDataForAPI(formData);

      // Make request to Next.js API route
      const response = await fetch("/api/topics/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ formData: apiData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle structured API errors
        if (errorData.error_code && errorData.details) {
          const parsedDetails = errorData.details;
          let actualErrorType = errorData.error_code;
          let context = {
            responseStatus: response.status,
            apiError: errorData,
          };

          // Try to parse details if they contain JSON
          try {
            const detailsObj = JSON.parse(errorData.details);
            if (
              detailsObj &&
              typeof detailsObj === "object" &&
              detailsObj.type
            ) {
              actualErrorType = detailsObj.type;
              if (detailsObj.context) {
                context = { ...context, ...detailsObj.context };
              }
            }
          } catch {
            // Not JSON, use as-is
          }

          const backendError: BackendError = {
            type: actualErrorType,
            message: errorData.error,
            technicalMessage: parsedDetails,
            statusCode: response.status,
            severity:
              response.status >= 500
                ? "high"
                : response.status >= 400
                  ? "medium"
                  : "low",
            recoveryActions: getRecoveryActions(response.status),
            isRetryable: response.status >= 500 || response.status === 429,
            requestId: errorData.request_id || requestId,
            timestamp: new Date().toISOString(),
            context,
          };
          throw backendError;
        } else {
          // Fallback for unstructured errors
          const errorMessage =
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(
            `Backend API error: ${response.status} ${errorMessage}`,
          );
        }
      }

      const result = await response.json();

      // Validate response structure
      if (!result.topics || !Array.isArray(result.topics)) {
        throw new Error("Invalid response format from topic generation API");
      }

      // Add unique IDs to topics if not present
      const topicsWithIds = result.topics.map(
        (topic: unknown, index: number) => ({
          ...(topic as GeneratedTopic),
          id: (topic as GeneratedTopic).id || `topic_${Date.now()}_${index}`,
        }),
      );

      return {
        topics: topicsWithIds,
        request_id: result.request_id || requestId,
        generated_at: result.generated_at || new Date().toISOString(),
        model_used: result.model_used,
        generation_time_ms: result.generation_time_ms,
      };
    },

    onMutate: async ({ requestId }) => {
      const finalRequestId =
        requestId ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`Starting topic generation request: ${finalRequestId}`);
      return { requestId: finalRequestId };
    },

    onError: (error, _variables, context) => {
      // Log error for debugging
      const classifiedError =
        error &&
        typeof error === "object" &&
        "type" in error &&
        "message" in error
          ? (error as BackendError)
          : classifyError(error, context?.requestId);

      console.error("Topic generation failed:", classifiedError);

      // Show error toast with recovery action if available
      toast.error("Generation failed", {
        description: classifiedError.message,
        action: classifiedError.recoveryActions?.includes("retry")
          ? {
              label: "Retry",
              onClick: () => {
                // The retry will be handled by the component using this hook
              },
            }
          : undefined,
        duration: 6000,
      });
    },

    onSuccess: (data, _variables, _context) => {
      console.log(
        `✅ Successfully generated ${data.topics.length} topics in ${data.generation_time_ms || "unknown"}ms`,
      );

      // Success toast
      toast.success("Topics generated successfully!", {
        description: `Generated ${data.topics.length} topics`,
        duration: 3000,
      });
    },

    // Retry configuration for network resilience
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client/validation errors)
      if (error && typeof error === "object" && "statusCode" in error) {
        const statusCode = (error as BackendError).statusCode;
        if (
          statusCode &&
          statusCode >= 400 &&
          statusCode < 500 &&
          statusCode !== 429
        ) {
          return false;
        }
      }
      // Retry up to 3 times for 5xx errors and network issues
      return failureCount < 3;
    },

    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
  });
}

/**
 * Get recovery actions based on HTTP status code
 */
function getRecoveryActions(statusCode: number): ErrorRecoveryAction[] {
  if (statusCode >= 500) {
    return ["retry", "check_connection"];
  } else if (statusCode === 429) {
    return ["retry"];
  } else if (statusCode === 401 || statusCode === 403) {
    return ["reload_page", "contact_support"];
  } else if (statusCode === 422) {
    return ["go_back", "retry_with_changes"];
  } else if (statusCode >= 400) {
    return ["go_back", "retry_with_changes"];
  }
  return ["retry"];
}
