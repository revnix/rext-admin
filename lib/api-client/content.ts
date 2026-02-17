/**
 * Content API Namespace
 *
 * Handles content CRUD operations, publishing, and management for workspace content.
 *
 * ⚠️ KNOWN INCONSISTENCIES (backend-driven):
 * - Uses query parameter `workspace_id` instead of path-based workspace scoping: `/api/v1/content/?workspace_id=...`
 * - Expected pattern: `/api/v1/workspaces/{id}/content` (path-based like other workspace resources)
 * - Endpoint paths not fully RESTful (e.g., /content/retry, /content/save, /content/publish)
 *
 * These will be addressed in a backend API v2 migration.
 * See: lib/api-client/endpoints.ts for full path documentation and convention guide.
 */

import type {
  ContentListResponse,
  ContentResponse,
  CreateContentRequest,
  UpdateContentRequest,
} from "@/types/content";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createContentNamespace(client: ApiClient) {
  return {
    /**
     * List content for workspace
     */
    list: async (
      workspaceId: string,
      options?: {
        status?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      const params = new URLSearchParams();
      params.append("workspace_id", workspaceId);
      if (options?.status) params.append("status", options.status);
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());

      return client.request<ContentListResponse>(
        `${ENDPOINTS.CONTENT.base}?${params.toString()}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get single content item
     */
    get: async (workspaceId: string, contentId: string) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.detail(contentId)}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Create new content
     */
    create: async (workspaceId: string, data: CreateContentRequest) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.base}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Update content
     */
    update: async (
      workspaceId: string,
      contentId: string,
      data: UpdateContentRequest,
    ) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.detail(contentId)}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Delete content
     */
    delete: async (workspaceId: string, contentId: string) => {
      return client.request<void>(
        `${ENDPOINTS.CONTENT.detail(contentId)}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "DELETE",
        },
      );
    },

    /**
     * Retry content generation
     */
    retry: async (workspaceId: string, contentId: string) => {
      return client.request<{ content_id: string; status: string }>(
        `${ENDPOINTS.CONTENT.retry(contentId)}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
        },
      );
    },

    /**
     * Save draft content
     */
    save: async (workspaceId: string, data: Record<string, unknown>) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.save}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Publish content
     */
    publish: async (workspaceId: string, data: Record<string, unknown>) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.publish}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },
  };
}
