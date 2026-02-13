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
import { buildUrl } from "../url-utils";

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

      const endpoint = buildUrl("/api/v1/content", {
        workspace_id: workspaceId,
        status: options?.status,
        limit: options?.limit,
        offset: options?.offset,
      });

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
      data: Record<string, unknown>,
    ) => {
      return client.request<ContentResponse>(
        `/api/v1/content/${contentId}?workspace_id=${encodeURIComponent(workspaceId)}`,
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
        `/api/v1/content/${contentId}?workspace_id=${encodeURIComponent(workspaceId)}`,
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
        `/api/v1/content/${contentId}/retry?workspace_id=${encodeURIComponent(workspaceId)}`,
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
        `/api/v1/content/save?workspace_id=${encodeURIComponent(workspaceId)}`,
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
        `/api/v1/content/publish?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },
  };
}
