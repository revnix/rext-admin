import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getQueryClient } from "@/lib/query-client";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import type { SaveTopicResponse } from "@/types/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Response type for topic deletion operations
 */
interface DeleteTopicResponse {
  success: boolean;
  deleted_count: number;
  message: string;
  topic_ids: string[];
}

/**
 * TanStack Query mutation hook for saving topics with optimistic updates
 *
 * Provides:
 * - Optimistic UI updates (topic appears saved immediately)
 * - Automatic rollback on API errors
 * - Cache invalidation for saved topics
 * - Integration with Zustand store for state management
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
    Error,
    GeneratedTopic,
    { topicId: string }
  >({
    mutationFn: async (topic: GeneratedTopic): Promise<SaveTopicResponse> => {
      // Call the Next.js API route which handles backend communication server-side
      const response = await fetch("/api/topics/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onMutate: async (topic) => {
      // Start optimistic update
      console.log(`Starting optimistic save for topic ${topic.id}`);

      updateTopicSaveState(topic.id, true);
      optimisticallyMarkTopicSaved(topic.id);

      return { topicId: topic.id };
    },
    onError: (error, topic, context) => {
      // Rollback optimistic changes
      console.error(
        `Topic save failed for ${topic.id}, reverting optimistic changes:`,
        error,
      );

      if (context?.topicId) {
        revertOptimisticSave(context.topicId);
      }

      // Show error toast
      toast.error(`Failed to save topic "${topic.title}": ${error.message}`);
    },
    onSuccess: (data, topic) => {
      console.log(
        `Topic ${topic.id} saved successfully - ${data.saved_count} topics saved`,
      );

      // Show success toast
      if (data.success && data.saved_count > 0) {
        toast.success(`Topic "${topic.title}" saved successfully!`);
      } else {
        toast.error(`Failed to save topic "${topic.title}"`);
      }
    },
    onSettled: (_data, _error, topic) => {
      // Always clear loading state
      updateTopicSaveState(topic.id, false);

      // Invalidate queries that might list saved topics
      queryClient.invalidateQueries({
        queryKey: ["saved-topics"],
      });
    },
  });
}

/**
 * TanStack Query mutation hook for bulk saving multiple topics with optimistic updates
 *
 * Provides:
 * - Bulk optimistic UI updates (all topics appear saved immediately)
 * - Automatic rollback on API errors
 * - Cache invalidation for saved topics
 * - Integration with Zustand store for state management
 * - Efficient handling of multiple topics in a single API call
 *
 * @example
 * ```tsx
 * const bulkSaveMutation = useBulkTopicSaveMutation();
 *
 * const handleBulkSave = async (topics) => {
 *   try {
 *     await bulkSaveMutation.mutateAsync(topics);
 *     toast.success(`Saved ${topics.length} topics`);
 *   } catch (error) {
 *     toast.error(`Failed to save topics: ${error.message}`);
 *   }
 * };
 * ```
 */
export function useBulkTopicSaveMutation() {
  const queryClient = getQueryClient();
  const {
    optimisticallyMarkTopicSaved,
    revertOptimisticSave,
    updateTopicSaveState,
  } = useTopicBuilderStore();

  return useMutation<
    SaveTopicResponse,
    Error,
    GeneratedTopic[],
    { topicIds: string[] }
  >({
    mutationFn: async (
      topics: GeneratedTopic[],
    ): Promise<SaveTopicResponse> => {
      // Call the Next.js API route which handles backend communication server-side
      const response = await fetch("/api/topics/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topics,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onMutate: async (topics) => {
      const topicIds = topics.map((t) => t.id);
      console.log(`Starting bulk save for ${topics.length} topics:`, topicIds);

      // Mark all topics as being saved and optimistically saved
      for (const id of topicIds) {
        updateTopicSaveState(id, true);
        optimisticallyMarkTopicSaved(id);
      }

      return { topicIds };
    },
    onError: (error, topics, context) => {
      console.error(`Bulk save failed for ${topics.length} topics:`, error);

      // Rollback all optimistic changes
      if (context?.topicIds) {
        for (const id of context.topicIds) {
          revertOptimisticSave(id);
        }
      }

      // Show error toast
      toast.error(`Failed to save ${topics.length} topics: ${error.message}`);
    },
    onSuccess: (data, topics) => {
      console.log(
        `Bulk save completed - ${data.saved_count} of ${topics.length} topics saved`,
      );

      // Show success toast
      if (data.success && data.saved_count > 0) {
        if (data.saved_count === topics.length) {
          toast.success(`Successfully saved all ${topics.length} topics!`);
        } else {
          toast.success(
            `Saved ${data.saved_count} of ${topics.length} topics successfully`,
          );
        }
      } else {
        toast.error(`Failed to save topics`);
      }
    },
    onSettled: (_data, _error, topics) => {
      // Clear loading state for all topics
      for (const topic of topics) {
        updateTopicSaveState(topic.id, false);
      }

      // Invalidate queries that might list saved topics
      queryClient.invalidateQueries({
        queryKey: ["saved-topics"],
      });
    },
  });
}

/**
 * TanStack Query mutation hook for deleting topics with optimistic updates
 *
 * Provides:
 * - Optimistic UI updates (topics disappear immediately)
 * - Automatic rollback on API errors
 * - Cache invalidation for saved topics
 * - Support for single or multiple topic deletion
 *
 * @example
 * ```tsx
 * const deleteMutation = useTopicDeleteMutation();
 *
 * const handleDelete = async (topicIds) => {
 *   try {
 *     await deleteMutation.mutateAsync(topicIds);
 *     toast.success(`Deleted ${topicIds.length} topics`);
 *   } catch (error) {
 *     toast.error(`Failed to delete topics: ${error.message}`);
 *   }
 * };
 * ```
 */
export function useTopicDeleteMutation() {
  const queryClient = getQueryClient();

  return useMutation<
    DeleteTopicResponse,
    Error,
    string[],
    { originalTopics?: unknown[] }
  >({
    mutationFn: async (topicIds: string[]): Promise<DeleteTopicResponse> => {
      // Call the Next.js API route which handles backend communication server-side
      const response = await fetch("/api/topics/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic_ids: topicIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onMutate: async (topicIds) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["topics"] });

      // Snapshot the previous value
      const previousTopics = queryClient.getQueryData(["topics"]);

      // Optimistically update by removing deleted topics from cache
      queryClient.setQueryData(["topics"], (old: unknown) => {
        if (!old || typeof old !== "object" || !("topics" in old)) return old;
        const typedOld = old as {
          topics: Array<{ id: string }>;
          total_count?: number;
        };
        if (!typedOld.topics) return old;
        return {
          ...typedOld,
          topics: typedOld.topics.filter(
            (topic) => !topicIds.includes(topic.id),
          ),
          total_count: Math.max(
            0,
            (typedOld.total_count || 0) - topicIds.length,
          ),
        };
      });

      console.log(
        `Starting optimistic delete for ${topicIds.length} topics:`,
        topicIds,
      );

      return { originalTopics: previousTopics as unknown[] };
    },
    onError: (error, topicIds, context) => {
      console.error(`Delete failed for ${topicIds.length} topics:`, error);

      // Rollback optimistic changes
      if (context?.originalTopics) {
        queryClient.setQueryData(["topics"], context.originalTopics);
      }

      // Show error toast
      const topicsText = topicIds.length === 1 ? "topic" : "topics";
      toast.error(
        `Failed to delete ${topicIds.length} ${topicsText}: ${error.message}`,
      );
    },
    onSuccess: (data, topicIds) => {
      console.log(
        `Successfully deleted ${data.deleted_count} of ${topicIds.length} topics`,
      );

      // Show success toast
      if (data.success && data.deleted_count > 0) {
        const topicsText = data.deleted_count === 1 ? "topic" : "topics";
        if (data.deleted_count === topicIds.length) {
          toast.success(
            `Successfully deleted ${data.deleted_count} ${topicsText}!`,
          );
        } else {
          toast.success(
            `Deleted ${data.deleted_count} of ${topicIds.length} topics`,
          );
        }
      } else {
        toast.error(`Failed to delete topics`);
      }
    },
    onSettled: () => {
      // Invalidate and refetch topics to ensure UI is in sync
      queryClient.invalidateQueries({
        queryKey: ["topics"],
      });
    },
  });
}
