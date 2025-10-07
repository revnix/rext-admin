/**
 * Topics API Namespace
 *
 * Handles topic generation, CRUD operations, and management
 */

import type { GeneratedTopic } from "@/types/topic-builder";
import type { ApiClient } from "./core";

export function createTopicsNamespace(client: ApiClient) {
  return {
    /**
     * List all topics for a workspace
     */
    list: async (workspaceId: string) => {
      const response = await client.request<{
        topics: GeneratedTopic[];
        total_count: number;
      }>(
        `/api/v1/topic/get-topics?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "GET",
        },
      );
      return response.topics;
    },

    /**
     * Get a single topic by ID
     */
    get: async (topicId: string, workspaceId: string) => {
      return client
        .request<GeneratedTopic | null>(
          `/api/v1/topic/get-topic/${topicId}?workspace_id=${encodeURIComponent(workspaceId)}`,
          {
            method: "GET",
          },
        )
        .catch((error) => {
          if (error instanceof Error && error.message.includes("404")) {
            return null;
          }
          throw error;
        });
    },

    /**
     * Generate topics using AI
     */
    generate: async (
      formData: {
        wizardMode?: string;
        industry: string;
        industry_other?: string | null;
        audience: string[]; // Required field (matches backend schema)
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

      // Ensure audience field is always present (required by backend)
      const payload = {
        ...formData,
        audience: formData.audience || [], // Ensure audience is always an array
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
      return client.request<{
        success: boolean;
        saved_count: number;
        message: string;
        saved_topic_ids?: string[];
      }>(
        `/api/v1/topic/save-topic?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topics: topics.map((topic) => ({
              ...topic,
              workspace_id: workspaceId,
            })),
          }),
        },
      );
    },

    /**
     * Update a topic
     */
    update: async (
      topicId: string,
      updateData: {
        title?: string;
        angle?: string;
        description?: string;
        channel_fit?: string[];
        audience_fit?: string[];
        why_it_works?: string;
        tags?: string[];
        approved?: boolean;
      },
      workspaceId: string,
    ) => {
      return client.request<{
        success: boolean;
        updated_count: number;
        topic_id: string;
        topic_title: string;
        updated_fields: string[];
        approved?: boolean;
        message: string;
      }>(
        `/api/v1/topic/update-topic?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic_id: topicId,
            ...updateData,
          }),
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
      }>(
        `/api/v1/topic/delete-topic?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic_ids: topicIds }),
        },
      );
    },
  };
}
