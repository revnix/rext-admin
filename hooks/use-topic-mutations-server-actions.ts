"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteTopic,
  deleteTopics,
  type SaveTopicData,
  saveTopic,
} from "@/app/topics/actions";
import { logger } from "@/lib/logger";
import type { TopicData } from "@/types/data-table";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Modern TanStack Query v5 mutation hook for deleting topics using Server Actions
 *
 * Features:
 * - Uses Next.js 15 Server Actions for direct backend communication
 * - Optimistic updates with automatic rollback on error
 * - Enhanced error handling with user-friendly messages
 * - Variable-based optimistic UI updates (TanStack Query v5 pattern)
 *
 * @example
 * ```tsx
 * const deleteTopicMutation = useTopicDeleteServerAction()
 *
 * // Delete single topic
 * deleteTopicMutation.mutate(['topic_123'])
 * ```
 */
export function useTopicDeleteServerAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicIds: string[]) => {
      const formData = new FormData();

      if (topicIds.length === 1) {
        formData.set("topicId", topicIds[0]);
        return await deleteTopic(formData);
      } else {
        formData.set("topicIds", JSON.stringify(topicIds));
        return await deleteTopics(formData);
      }
    },

    // Optimistic update using new TanStack Query v5 cache manipulation
    onMutate: async (topicIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["topics"] });

      // Snapshot previous value for rollback
      const previousTopics = queryClient.getQueryData(["topics"]);

      // Optimistically remove topics
      queryClient.setQueryData(["topics"], (old: TopicData[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.filter((topic: TopicData) => !topicIds.includes(topic.id));
      });

      logger.info("Applied optimistic topic deletion", {
        topicIds,
        count: topicIds.length,
      });

      return { previousTopics, topicIds };
    },

    onError: (err, topicIds, context) => {
      // Rollback optimistic update
      if (context?.previousTopics) {
        queryClient.setQueryData(["topics"], context.previousTopics);
      }

      logger.error("Failed to delete topics - rolled back", {
        topicIds,
        error: err.message,
        count: topicIds.length,
      });

      const isMultiple = topicIds.length > 1;
      toast.error(
        isMultiple ? "Failed to delete topics" : "Failed to delete topic",
        {
          description: err.message,
          duration: 5000,
        },
      );
    },

    onSuccess: (data, topicIds) => {
      const deletedCount = data.deleted_count || topicIds.length;
      const isMultiple = topicIds.length > 1;

      logger.info("Successfully deleted topics", {
        topicIds,
        deletedCount,
        requested: topicIds.length,
      });

      toast.success(
        isMultiple
          ? `Successfully deleted ${deletedCount} topics`
          : "Topic deleted successfully",
        {
          duration: 3000,
        },
      );
    },

    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
}

/**
 * Modern TanStack Query v5 mutation hook for saving topics using Server Actions
 *
 * Features:
 * - Uses Next.js 15 Server Actions for direct backend communication
 * - Automatic redirect to topics list on success
 * - Enhanced error handling with user-friendly messages
 * - No optimistic updates (save operation redirects immediately)
 *
 * @example
 * ```tsx
 * const saveTopicMutation = useTopicSaveServerAction()
 *
 * // Save topic
 * saveTopicMutation.mutate({
 *   title: 'AI in Healthcare',
 *   description: 'Exploring AI applications...',
 *   tags: ['ai', 'healthcare']
 * })
 * ```
 */
export function useTopicSaveServerAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicData: SaveTopicData) => {
      const formData = new FormData();
      formData.set("topicData", JSON.stringify(topicData));

      // Server action handles the redirect on success
      return await saveTopic(formData);
    },

    onMutate: async (topicData) => {
      logger.info("Starting topic save via server action", {
        title: topicData.title,
      });
    },

    onError: (err, topicData) => {
      logger.error("Failed to save topic", {
        title: topicData.title,
        error: err.message,
      });

      toast.error("Failed to save topic", {
        description: err.message,
        duration: 5000,
      });
    },

    onSuccess: (_data, topicData) => {
      // Note: This may not run if server action redirects
      logger.info("Successfully saved topic", {
        title: topicData.title,
      });

      // Invalidate topics cache for when user returns to topics page
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      toast.success("Topic saved successfully!", {
        description: `"${topicData.title}" has been saved`,
        duration: 3000,
      });
    },
  });
}

/**
 * Transform GeneratedTopic to SaveTopicData format
 */
export function transformGeneratedTopicForSave(
  topic: GeneratedTopic,
): SaveTopicData {
  return {
    title: topic.title,
    description: topic.description,
    angle: topic.angle,
    tags: topic.tags,
    audience_fit: topic.audience_fit,
    channel_fit: topic.channel_fit,
    scores: topic.scores,
    why_it_works: topic.why_it_works,
  };
}
