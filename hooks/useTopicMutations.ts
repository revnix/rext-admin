import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getQueryClient } from "@/lib/query-client";
import { generateRequestId } from "@/lib/response-utils";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import { getErrorInfo } from "@/types/api";
import type { BackendErrorCode } from "@/types/consistent-response";
import type { TopicData } from "@/types/data-table";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Enhanced response type for topic save operations with consistent format
 */
interface SaveTopicResponse {
  success: boolean;
  bulk_save: boolean;
  single_save: boolean;
  total_attempted: number;
  successful_saves: number;
  failed_saves: number;
  saved_topic_ids: string[];
  failed_topics: Array<{
    topic_id: string;
    reason: string;
  }>;
  topic?: GeneratedTopic; // For single save compatibility
  message?: string; // For single save compatibility
  saved_count?: number; // For single save compatibility
  saved_at: string;
  request_id: string;
  processing_time_ms?: number;
}

/**
 * Enhanced response type for topic deletion operations with consistent format
 */
interface DeleteTopicResponse {
  success: boolean;
  total_requested: number;
  deleted_count: number;
  failed_count: number;
  deleted_topic_ids: string[];
  failed_deletions: Array<{
    topic_id: string;
    reason: string;
  }>;
  deleted_at: string;
  request_id: string;
  processing_time_ms?: number;
}

/**
 * Enhanced error response type with consistent format
 */
interface TopicMutationError {
  error: string;
  error_code: BackendErrorCode;
  details?: string;
  request_id: string;
  retry_after?: number;
  fallback_available?: boolean;
}

/**
 * Enhanced TanStack Query mutation hook for saving topics with optimistic updates
 *
 * Features:
 * - Pure consistent response format handling
 * - Enhanced error classification with backend error codes
 * - Request correlation and tracking
 * - Optimistic UI updates with rollback
 * - Smart retry logic based on error types
 * - Processing time tracking
 *
 * @example
 * ```tsx
 * const saveMutation = useTopicSaveMutation();
 *
 * const handleSave = () => {
 *   saveMutation.mutate(topic);
 * };
 * ```
 */
export function useTopicSaveMutation() {
  const queryClient = getQueryClient();
  const {
    optimisticallyMarkTopicSaved,
    revertOptimisticSave,
    updateTopicSaveState,
  } = useTopicBuilderStore();

  return useMutation<
    SaveTopicResponse,
    TopicMutationError,
    GeneratedTopic,
    { topicId: string; requestId: string }
  >({
    mutationFn: async (topic: GeneratedTopic): Promise<SaveTopicResponse> => {
      const requestId = generateRequestId("topic_save");

      const response = await fetch("/api/topics/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ topic }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorResponse: TopicMutationError = {
          error: responseData.error || "Failed to save topic",
          error_code: responseData.error_code || "unknown_error",
          details: responseData.details,
          request_id: responseData.request_id || requestId,
          retry_after: responseData.retry_after,
          fallback_available: responseData.fallback_available || false,
        };

        console.error("Topic save API error:", {
          error_code: errorResponse.error_code,
          status_code: response.status,
          request_id: errorResponse.request_id,
          topic_id: topic.id,
        });

        throw errorResponse;
      }

      console.log("Topic save success:", {
        topic_id: topic.id,
        request_id: responseData.request_id,
        processing_time_ms: responseData.processing_time_ms,
      });

      return responseData;
    },

    onMutate: async (topic) => {
      const requestId = generateRequestId("topic_save");

      // Optimistically mark the topic as saved
      optimisticallyMarkTopicSaved(topic.id);

      console.log(`Optimistically saving topic: ${topic.id} (${requestId})`);

      return {
        topicId: topic.id,
        requestId,
      };
    },

    onError: (error, topic, context) => {
      // Revert optimistic update
      if (context?.topicId) {
        revertOptimisticSave(context.topicId);
      }

      const errorInfo = getErrorInfo(error.error_code);

      console.error("Topic save failed:", {
        error_code: error.error_code,
        topic_id: topic.id,
        request_id: error.request_id,
        correlation_id: context?.requestId,
        category: errorInfo.category,
        severity: errorInfo.severity,
      });

      // Show enhanced error toast
      toast.error("Failed to save topic", {
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

    onSuccess: (data, topic, context) => {
      // Update topic save state with success
      updateTopicSaveState(topic.id, false);

      // Invalidate topics queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      console.log(`✅ Successfully saved topic: ${topic.id}`, {
        request_id: data.request_id,
        correlation_id: context?.requestId,
        processing_time_ms: data.processing_time_ms,
      });

      toast.success("Topic saved successfully!", {
        description: `"${topic.title}" has been saved`,
        duration: 3000,
      });
    },

    // Enhanced retry configuration
    retry: (failureCount, error) => {
      const errorInfo = getErrorInfo(error.error_code);

      if (!errorInfo.retryable) {
        return false;
      }

      if (
        ["validation", "authentication", "authorization"].includes(
          errorInfo.category,
        )
      ) {
        return false;
      }

      return failureCount < 3;
    },

    retryDelay: (attemptIndex, error) => {
      if (error?.retry_after) {
        return error.retry_after * 1000;
      }

      const errorInfo = getErrorInfo(error?.error_code || "unknown_error");
      const baseDelay = errorInfo.category === "external_service" ? 2000 : 1000;

      return Math.min(baseDelay * 2 ** attemptIndex, 30000);
    },
  });
}

/**
 * Enhanced TanStack Query mutation hook for bulk saving topics
 *
 * Features:
 * - Handles multiple topics at once
 * - Pure consistent response format handling
 * - Enhanced error classification
 * - Partial success handling
 * - Request correlation and tracking
 */
export function useBulkTopicSaveMutation() {
  const queryClient = getQueryClient();
  const { updateTopicSaveState } = useTopicBuilderStore();

  return useMutation<
    SaveTopicResponse,
    TopicMutationError,
    GeneratedTopic[],
    { requestId: string }
  >({
    mutationFn: async (
      topics: GeneratedTopic[],
    ): Promise<SaveTopicResponse> => {
      const requestId = generateRequestId("topic_bulk_save");

      const response = await fetch("/api/topics/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ topics }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorResponse: TopicMutationError = {
          error: responseData.error || "Failed to save topics",
          error_code: responseData.error_code || "unknown_error",
          details: responseData.details,
          request_id: responseData.request_id || requestId,
          retry_after: responseData.retry_after,
          fallback_available: responseData.fallback_available || false,
        };

        console.error("Bulk topic save API error:", {
          error_code: errorResponse.error_code,
          status_code: response.status,
          request_id: errorResponse.request_id,
          topics_count: topics.length,
        });

        throw errorResponse;
      }

      console.log("Bulk topic save success:", {
        total_attempted: responseData.total_attempted,
        successful_saves: responseData.successful_saves,
        failed_saves: responseData.failed_saves,
        request_id: responseData.request_id,
        processing_time_ms: responseData.processing_time_ms,
      });

      return responseData;
    },

    onMutate: async (topics) => {
      const requestId = generateRequestId("topic_bulk_save");
      console.log(
        `Starting bulk save for ${topics.length} topics (${requestId})`,
      );
      return { requestId };
    },

    onError: (error, topics, context) => {
      const errorInfo = getErrorInfo(error.error_code);

      console.error("Bulk topic save failed:", {
        error_code: error.error_code,
        topics_count: topics.length,
        request_id: error.request_id,
        correlation_id: context?.requestId,
        category: errorInfo.category,
      });

      toast.error("Failed to save topics", {
        description: errorInfo.userMessage,
        duration: 6000,
      });
    },

    onSuccess: (data, _topics, context) => {
      // Update save states for successful topics
      data.saved_topic_ids.forEach((topicId) => {
        updateTopicSaveState(topicId, false);
      });

      // Update save states for failed topics
      data.failed_topics?.forEach((failure) => {
        updateTopicSaveState(failure.topic_id, false);
      });

      queryClient.invalidateQueries({ queryKey: ["topics"] });

      console.log(
        `✅ Bulk save completed: ${data.successful_saves}/${data.total_attempted} topics saved`,
        {
          request_id: data.request_id,
          correlation_id: context?.requestId,
          processing_time_ms: data.processing_time_ms,
        },
      );

      if (data.failed_saves > 0) {
        toast.warning("Partial save success", {
          description: `${data.successful_saves} topics saved, ${data.failed_saves} failed`,
          duration: 6000,
        });
      } else {
        toast.success("All topics saved successfully!", {
          description: `${data.successful_saves} topics saved`,
          duration: 3000,
        });
      }
    },
  });
}

/**
 * Enhanced TanStack Query mutation hook for deleting topics
 *
 * Features:
 * - Pure consistent response format handling
 * - Enhanced error classification
 * - Optimistic updates with rollback
 * - Request correlation and tracking
 */
export function useTopicDeleteMutation() {
  const queryClient = getQueryClient();

  return useMutation<
    DeleteTopicResponse,
    TopicMutationError,
    string[],
    { requestId: string }
  >({
    mutationFn: async (topicIds: string[]): Promise<DeleteTopicResponse> => {
      const requestId = generateRequestId("topic_delete");

      const response = await fetch("/api/topics/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ topic_ids: topicIds }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorResponse: TopicMutationError = {
          error: responseData.error || "Failed to delete topics",
          error_code: responseData.error_code || "unknown_error",
          details: responseData.details,
          request_id: responseData.request_id || requestId,
          retry_after: responseData.retry_after,
          fallback_available: responseData.fallback_available || false,
        };

        console.error("Topic delete API error:", {
          error_code: errorResponse.error_code,
          status_code: response.status,
          request_id: errorResponse.request_id,
          topic_ids: topicIds,
        });

        throw errorResponse;
      }

      console.log("Topic delete success:", {
        deleted_count: responseData.deleted_count,
        failed_count: responseData.failed_count,
        request_id: responseData.request_id,
        processing_time_ms: responseData.processing_time_ms,
      });

      return responseData;
    },

    onMutate: async (topicIds) => {
      const requestId = generateRequestId("topic_delete");

      // Optimistically remove topics from queries
      queryClient.setQueryData<TopicData[]>(["topics"], (old) => {
        if (!old) return old;
        return old.filter((topic) => !topicIds.includes(topic.id));
      });

      console.log(
        `Optimistically deleting ${topicIds.length} topics (${requestId})`,
      );

      return { requestId };
    },

    onError: (error, topicIds, context) => {
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      const errorInfo = getErrorInfo(error.error_code);

      console.error("Topic delete failed:", {
        error_code: error.error_code,
        topic_ids: topicIds,
        request_id: error.request_id,
        correlation_id: context?.requestId,
        category: errorInfo.category,
      });

      toast.error("Failed to delete topics", {
        description: errorInfo.userMessage,
        duration: 6000,
      });
    },

    onSuccess: (data, _topicIds, context) => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      console.log(
        `✅ Successfully deleted ${data.deleted_count}/${data.total_requested} topics`,
        {
          request_id: data.request_id,
          correlation_id: context?.requestId,
          processing_time_ms: data.processing_time_ms,
        },
      );

      if (data.failed_count > 0) {
        toast.warning("Partial deletion success", {
          description: `${data.deleted_count} topics deleted, ${data.failed_count} failed`,
          duration: 6000,
        });
      } else {
        toast.success(`Successfully deleted ${data.deleted_count} topics`, {
          duration: 3000,
        });
      }
    },

    // Enhanced retry configuration
    retry: (failureCount, error) => {
      const errorInfo = getErrorInfo(error.error_code);

      if (!errorInfo.retryable) {
        return false;
      }

      if (
        ["validation", "authentication", "authorization"].includes(
          errorInfo.category,
        )
      ) {
        return false;
      }

      return failureCount < 2; // More conservative retry for delete operations
    },

    retryDelay: (attemptIndex, error) => {
      if (error?.retry_after) {
        return error.retry_after * 1000;
      }

      const errorInfo = getErrorInfo(error?.error_code || "unknown_error");
      const baseDelay = errorInfo.category === "external_service" ? 2000 : 1000;

      return Math.min(baseDelay * 2 ** attemptIndex, 20000); // Lower max delay for delete
    },
  });
}
