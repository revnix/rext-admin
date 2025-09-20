"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveTopic,
  updateTopic,
  type UpdateTopicData,
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
 * Modern TanStack Query v5 mutation hook for updating topics using Server Actions
 *
 * Features:
 * - Uses Next.js 15 Server Actions for direct backend communication
 * - Optimistic updates with automatic rollback on error
 * - Enhanced error handling with user-friendly messages
 * - Flexible field updates (title, angle, approved, etc.)
 *
 * @example
 * ```tsx
 * const updateTopicMutation = useTopicUpdateServerAction()
 *
 * // Update any topic field
 * updateTopicMutation.mutate({
 *   topic_id: 'topic_123',
 *   approved: true,
 *   title: 'New Title'
 * })
 * ```
 */
export function useTopicUpdateServerAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateData: UpdateTopicData) => {
      const formData = new FormData();
      formData.set("updateData", JSON.stringify(updateData));
      return await updateTopic(formData);
    },

    // Optimistic update using new TanStack Query v5 cache manipulation
    onMutate: async (updateData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["topics"] });

      // Snapshot previous value for rollback
      const previousTopics = queryClient.getQueryData(["topics"]);

      // Optimistically update topic
      queryClient.setQueryData(["topics"], (old: TopicData[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((topic: TopicData) => {
          if (topic.id === updateData.topic_id) {
            const updatedTopic = { ...topic };

            // Update fields that were provided
            if (updateData.title !== undefined)
              updatedTopic.name = updateData.title;
            if (updateData.approved !== undefined) {
              updatedTopic.status = updateData.approved
                ? "approved"
                : "pending";
            }
            if (updateData.tags !== undefined)
              updatedTopic.tags = updateData.tags;
            if (updateData.angle !== undefined)
              updatedTopic.angle = updateData.angle;
            if (updateData.description !== undefined)
              updatedTopic.description = updateData.description;
            if (updateData.audience_fit !== undefined)
              updatedTopic.audience_fit = updateData.audience_fit;
            if (updateData.channel_fit !== undefined)
              updatedTopic.channel_fit = updateData.channel_fit;
            if (updateData.why_it_works !== undefined)
              updatedTopic.why_it_works = updateData.why_it_works;

            return updatedTopic;
          }
          return topic;
        });
      });

      logger.info("Applied optimistic topic update", {
        topicId: updateData.topic_id,
        fields: Object.keys(updateData).filter((key) => key !== "topic_id"),
      });

      return { previousTopics, updateData };
    },

    onError: (err, updateData, context) => {
      // Rollback optimistic update
      if (context?.previousTopics) {
        queryClient.setQueryData(["topics"], context.previousTopics);
      }

      logger.error("Failed to update topic - rolled back", {
        topicId: updateData.topic_id,
        error: err.message,
      });

      toast.error("Failed to update topic", {
        description: err.message,
        duration: 5000,
      });
    },

    onSuccess: (data, updateData) => {
      logger.info("Successfully updated topic", {
        topicId: updateData.topic_id,
        updated_count: data.updated_count,
        updated_fields: data.updated_fields,
      });

      const fieldNames =
        data.updated_fields
          ?.filter((f: string) => f !== "updated_at")
          .join(", ") || "topic";
      toast.success("Topic updated successfully", {
        description: `Updated ${fieldNames}`,
        duration: 3000,
      });
    },

    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
}

/**
 * Modern TanStack Query v5 mutation hook for approving topics using Server Actions
 *
 * This is a convenience wrapper around useTopicUpdateServerAction for approval-specific operations
 *
 * @example
 * ```tsx
 * const approveTopicMutation = useTopicApproveServerAction()
 *
 * // Approve topic
 * approveTopicMutation.mutate('topic_123')
 * ```
 */
export function useTopicApproveServerAction() {
  const updateMutation = useTopicUpdateServerAction();

  return useMutation({
    mutationFn: async (topicId: string) => {
      return await updateMutation.mutateAsync({
        topic_id: topicId,
        approved: true,
      });
    },

    onError: (err, topicId) => {
      logger.error("Failed to approve topic", {
        topicId,
        error: err.message,
      });

      toast.error("Failed to approve topic", {
        description: err.message,
        duration: 5000,
      });
    },

    onSuccess: (data, topicId) => {
      logger.info("Successfully approved topic", {
        topicId,
        updated_count: data.updated_count,
      });

      toast.success("Topic approved successfully", {
        description: "Topic status has been updated to approved",
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
