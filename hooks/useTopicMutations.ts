"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import { getQueryClient } from "@/lib/query-client";
import { generateRequestId } from "@/lib/response-utils";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import { getErrorInfo } from "@/types/api";
import type { BackendErrorCode } from "@/types/consistent-response";
import type { GeneratedTopic } from "@/types/topic-builder";

// Helper function to safely extract error information
function extractErrorInfo(error: unknown): {
  message: string;
  statusCode?: number;
  context?: unknown;
  isRetryable?: boolean;
} {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    return {
      message: typeof obj.message === "string" ? obj.message : String(error),
      statusCode:
        typeof obj.statusCode === "number" ? obj.statusCode : undefined,
      context: obj.context,
      isRetryable:
        typeof obj.isRetryable === "boolean" ? obj.isRetryable : undefined,
    };
  }

  return { message: String(error) };
}

const topicSaveLogger = logger.forComponent("useTopicSaveMutation");
const topicBulkSaveLogger = logger.forComponent("useTopicBulkSaveMutation");
const topicDeleteLogger = logger.forComponent("useTopicDeleteMutation");

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
 * TanStack Query mutation hook for saving a single topic
 */
export function useTopicSaveMutation(workspaceId: string) {
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

      try {
        // Use API client to save topics
        const result = await apiClient.topics.save([topic], workspaceId);

        // Transform to expected response format
        const response: SaveTopicResponse = {
          success: result.success,
          bulk_save: false,
          single_save: true,
          total_attempted: 1,
          successful_saves: result.saved_count || 0,
          failed_saves: 1 - (result.saved_count || 0),
          saved_topic_ids: result.saved_count ? [topic.id] : [],
          failed_topics: result.saved_count
            ? []
            : [
                {
                  topic_id: topic.id,
                  reason: result.message || "Unknown error",
                },
              ],
          topic: result.success ? topic : undefined,
          message: result.message,
          saved_count: result.saved_count,
          saved_at: new Date().toISOString(),
          request_id: requestId,
        };

        topicSaveLogger.info("Topic save successful", {
          topic_id: topic.id,
          request_id: requestId,
        });

        return response;
      } catch (error: unknown) {
        const errorInfo = extractErrorInfo(error);

        topicSaveLogger.error("Topic save failed", {
          requestId,
          topic_id: topic.id,
          error: errorInfo.message,
        });

        const errorResponse: TopicMutationError = {
          error: errorInfo.message || "Failed to save topic",
          error_code:
            errorInfo.statusCode === 401
              ? "unauthorized"
              : "external_service_error",
          details: errorInfo.context
            ? JSON.stringify(errorInfo.context)
            : undefined,
          request_id: requestId,
          retry_after: errorInfo.isRetryable ? 5000 : undefined,
          fallback_available: false,
        };

        throw errorResponse;
      }
    },

    onMutate: async (topic) => {
      const requestId = generateRequestId("topic_save");
      // Optimistically mark the topic as saved
      optimisticallyMarkTopicSaved(topic.id);
      topicSaveLogger.debug("Optimistically saving topic", {
        topic_id: topic.id,
        request_id: requestId,
      });
      return {
        topicId: topic.id,
        requestId,
      };
    },

    onSuccess: (data, topic, context) => {
      // Invalidate and refetch topics list
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      updateTopicSaveState(topic.id, false); // Mark as no longer being saved

      topicSaveLogger.info("Topic save mutation success", {
        topic_id: topic.id,
        request_id: data.request_id,
        correlation_id: context.requestId,
      });

      toast.success(`Topic "${topic.title}" saved successfully`, {
        description: `Request ID: ${data.request_id}`,
        duration: 3000,
      });
    },

    onError: (error, topic, context) => {
      // Revert optimistic update
      if (context) {
        revertOptimisticSave(context.topicId);
      }

      const { userMessage } = getErrorInfo(error.error_code);

      topicSaveLogger.error("Topic save mutation error", {
        error_code: error.error_code,
        error_message: error.error,
        topic_id: topic.id,
        request_id: error.request_id,
        correlation_id: context?.requestId,
      });

      toast.error(userMessage, {
        description: `Error code: ${error.error_code}`,
        duration: 5000,
      });
    },
  });
}

/**
 * TanStack Query mutation hook for saving multiple topics
 */
export function useTopicBulkSaveMutation(workspaceId: string) {
  const queryClient = getQueryClient();

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

      try {
        // Use API client to save topics
        const result = await apiClient.topics.save(topics, workspaceId);

        const response: SaveTopicResponse = {
          success: result.success,
          bulk_save: true,
          single_save: false,
          total_attempted: topics.length,
          successful_saves: result.saved_count || 0,
          failed_saves: topics.length - (result.saved_count || 0),
          saved_topic_ids: result.success ? topics.map((t) => t.id) : [],
          failed_topics: [],
          message: result.message,
          saved_count: result.saved_count,
          saved_at: new Date().toISOString(),
          request_id: requestId,
        };

        topicBulkSaveLogger.info("Bulk topic save successful", {
          topics_count: topics.length,
          saved_count: result.saved_count,
          request_id: requestId,
        });

        return response;
      } catch (error: unknown) {
        const errorInfo = extractErrorInfo(error);

        topicBulkSaveLogger.error("Bulk topic save failed", {
          requestId,
          topics_count: topics.length,
          error: errorInfo.message,
        });

        const errorResponse: TopicMutationError = {
          error: errorInfo.message || "Failed to save topics",
          error_code:
            errorInfo.statusCode === 401
              ? "unauthorized"
              : "external_service_error",
          details: errorInfo.context
            ? JSON.stringify(errorInfo.context)
            : undefined,
          request_id: requestId,
          retry_after: errorInfo.isRetryable ? 5000 : undefined,
          fallback_available: false,
        };

        throw errorResponse;
      }
    },

    onMutate: async (_topics) => {
      const requestId = generateRequestId("topic_bulk_save");
      return {
        requestId,
      };
    },

    onSuccess: (data, topics, context) => {
      // Invalidate and refetch topics list
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      topicBulkSaveLogger.info("Bulk topic save mutation success", {
        topics_count: topics.length,
        successful_saves: data.successful_saves,
        request_id: data.request_id,
        correlation_id: context?.requestId,
      });

      toast.success(
        `Saved ${data.successful_saves} of ${topics.length} topics`,
        {
          description: `Request ID: ${data.request_id}`,
          duration: 4000,
        },
      );
    },

    onError: (error, topics, context) => {
      const { userMessage } = getErrorInfo(error.error_code);

      topicBulkSaveLogger.error("Bulk topic save mutation error", {
        error_code: error.error_code,
        error_message: error.error,
        topics_count: topics.length,
        request_id: error.request_id,
        correlation_id: context?.requestId,
      });

      toast.error(userMessage, {
        description: `Failed to save ${topics.length} topics. Error: ${error.error_code}`,
        duration: 6000,
      });
    },
  });
}

/**
 * TanStack Query mutation hook for deleting topics
 */
export function useTopicDeleteMutation(workspaceId: string) {
  const queryClient = getQueryClient();

  return useMutation<
    DeleteTopicResponse,
    TopicMutationError,
    string[],
    { requestId: string }
  >({
    mutationFn: async (topicIds: string[]): Promise<DeleteTopicResponse> => {
      const requestId = generateRequestId("topic_delete");

      try {
        // Use API client to delete topics
        const result = await apiClient.topics.delete(topicIds, workspaceId);

        const response: DeleteTopicResponse = {
          success: result.success,
          total_requested: topicIds.length,
          deleted_count: result.deleted_count,
          failed_count: topicIds.length - result.deleted_count,
          deleted_topic_ids: result.topic_ids || [],
          failed_deletions: [], // Backend doesn't provide this detail currently
          deleted_at: new Date().toISOString(),
          request_id: requestId,
        };

        topicDeleteLogger.info("Topic deletion successful", {
          topic_ids: topicIds,
          deleted_count: result.deleted_count,
          request_id: requestId,
        });

        return response;
      } catch (error: unknown) {
        const errorInfo = extractErrorInfo(error);

        topicDeleteLogger.error("Topic deletion failed", {
          requestId,
          topic_ids: topicIds,
          error: errorInfo.message,
        });

        const errorResponse: TopicMutationError = {
          error: errorInfo.message || "Failed to delete topics",
          error_code:
            errorInfo.statusCode === 401
              ? "unauthorized"
              : "external_service_error",
          details: errorInfo.context
            ? JSON.stringify(errorInfo.context)
            : undefined,
          request_id: requestId,
          retry_after: errorInfo.isRetryable ? 5000 : undefined,
          fallback_available: false,
        };

        throw errorResponse;
      }
    },

    onSuccess: (data, topicIds, context) => {
      // Invalidate and refetch topics list
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      topicDeleteLogger.info("Topic delete mutation success", {
        topic_ids: topicIds,
        deleted_count: data.deleted_count,
        request_id: data.request_id,
        correlation_id: context.requestId,
      });

      const successMessage =
        data.deleted_count === 1
          ? "Topic deleted successfully"
          : `Deleted ${data.deleted_count} topics successfully`;

      toast.success(successMessage, {
        description: `Request ID: ${data.request_id}`,
        duration: 3000,
      });
    },

    onError: (error, topicIds, context) => {
      const { userMessage } = getErrorInfo(error.error_code);

      topicDeleteLogger.error("Topic delete mutation error", {
        error_code: error.error_code,
        error_message: error.error,
        topic_ids: topicIds,
        request_id: error.request_id,
        correlation_id: context?.requestId,
      });

      toast.error(userMessage, {
        description: `Failed to delete ${topicIds.length} topics. Error: ${error.error_code}`,
        duration: 5000,
      });
    },
  });
}
