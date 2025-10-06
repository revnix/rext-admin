/**
 * Content API Namespace
 *
 * Handles content CRUD operations
 */

import type {
  ContentListResponse,
  ContentResponse,
  CreateContentRequest,
  UpdateContentRequest,
} from "@/types/content";
import type { ApiClient } from "./core";

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

      const endpoint = `/api/v1/content/?${params.toString()}`;

      return client.request<ContentListResponse>(endpoint, {
        method: "GET",
      });
    },

    /**
     * Get single content item
     */
    get: async (workspaceId: string, contentId: string) => {
      return client.request<ContentResponse>(
        `/api/v1/content/${contentId}?workspace_id=${encodeURIComponent(workspaceId)}`,
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
        `/api/v1/content/?workspace_id=${encodeURIComponent(workspaceId)}`,
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
        `/api/v1/content/${contentId}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "PUT",
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
        `/api/v1/content/${contentId}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "DELETE",
        },
      );
    },
  };
}
