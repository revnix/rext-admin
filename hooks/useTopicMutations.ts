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
      const response = await fetch("/api/topic/save-topic", {
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
