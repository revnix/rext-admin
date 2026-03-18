/**
 * Topics API Namespace
 *
 * Handles topic creation, generation, and management for workspace content.
 *
 * ⚠️ KNOWN INCONSISTENCIES (backend-driven):
 * - Uses singular "topic" instead of plural "topics" in path: `/api/v1/topic/*`
 * - Uses verb-based paths (get-topics, save-topic, update-topic, delete-topic) instead of RESTful resources
 * - Uses query parameter `workspace_id` instead of path-based workspace scoping
 *
 * These will be addressed in a backend API v2 migration.
 * See: lib/api-client/endpoints.ts for full path documentation and convention guide.
 */

import type { GeneratedTopic } from "@/types/topic-builder";
import { type ApiClient, ApiError } from "./core";

export function createTopicsNamespace(client: ApiClient) {
  return {
    /**
     * List all topics for a workspace
     */
    list: async (workspaceId: string) => {
      const response = await client.request<{
        topics: GeneratedTopic[];
        total_count: number;
      }>(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/topics`, {
        method: "GET",
      });
      return response.topics;
    },

    /**
     * Get a single topic by ID
     */
    get: async (topicId: string, workspaceId: string) => {
      return client
        .request<GeneratedTopic | null>(
          `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/topics/${encodeURIComponent(topicId)}`,
          {
            method: "GET",
          },
        )
        .catch((error) => {
          if (error instanceof ApiError && error.statusCode === 404) {
            return null;
          }
          // Fallback for non-ApiError errors (e.g. network layer) that may contain "404"
          if (
            !(error instanceof ApiError) &&
            error instanceof Error &&
            error.message.includes("404")
          ) {
            return null;
          }
          throw error;
        });
    },

    /**
     * Generate topics using AI (Legacy flow, retained for backward compatibility)
     */
    generate: async (
      formData: {
        wizardMode?: string;
        industry: string;
        industry_other?: string | null;
        audience: string[];
        purpose?: string[];
        purpose_other?: string | null;
        num_topics: number;
        subject?: string | null;
      },
      workspaceId?: string,
    ) => {
      const endpoint = workspaceId
        ? `/api/v1/topic/generate-topic?workspace_id=${encodeURIComponent(workspaceId)}`
        : "/api/v1/topic/generate-topic";

      const payload = {
        ...formData,
        audience: formData.audience || [],
        timestamp: new Date().toISOString(),
      };

      return client.request<{
        topics: GeneratedTopic[];
        total_count: number;
        generation_time_ms?: number;
        model_used?: string;
        request_id?: string;
      }>(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    /**
     * Save topics to workspace
     */
    save: async (topics: GeneratedTopic[], workspaceId: string) => {
      const payload = {
        topics: topics.map((topic) => ({
          id: topic.id,
          workspace_id: workspaceId,
          topic_name: topic.topic_name || topic.title || "",
          description: topic.description || "",
        })),
      };

      return client.request<{
        success: boolean;
        saved_count: number;
        message: string;
        saved_topic_ids?: string[];
      }>(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    /**
     * Update a topic
     */
    update: async (
      topicId: string,
      updateData: {
        topic_name?: string;
        description?: string;
      },
      workspaceId: string,
    ) => {
      return client.request<{
        success: boolean;
        updated_count: number;
        topic_id: string;
        topic_name: string;
        updated_fields: string[];
        message: string;
      }>(
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/topics/${encodeURIComponent(topicId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        },
      );
    },

    /**
     * Delete topics
     */
    delete: async (topicIds: string[], workspaceId: string) => {
      return client.request<{
        success: boolean;
        deleted_count: number;
        message: string;
        topic_ids: string[];
      }>(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/topics`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_ids: topicIds }),
      });
    },
  };
}
