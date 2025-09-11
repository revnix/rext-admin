import { useMutation } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import type { SaveTopicResponse } from "@/types/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

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
          topics: [topic],
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
    },
    onSuccess: (data, topic) => {
      console.log(
        `Topic ${topic.id} saved successfully - ${data.saved_count} topics saved`,
      );
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
    },
    onSuccess: (data, topics) => {
      console.log(
        `Bulk save completed - ${data.saved_count} of ${topics.length} topics saved`,
      );
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
