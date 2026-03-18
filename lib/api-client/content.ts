import { buildUrl } from "../url-utils";
import type {
  ContentCreate,
  ContentDetailResponse,
  ContentListResponse,
  ContentResponse,
  ContentUpdate,
} from "../../types/generated";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

/**
 * Content API Namespace
 *
 * Handles content CRUD operations, publishing, and management for workspace content.
 *
 * ⚠️ KNOWN INCONSISTENCIES (backend-driven):
 * - Uses query parameter `workspace_id` instead of path-based workspace scoping
 * - Endpoint paths not fully RESTful (e.g., /content/retry, /content/save, /content/publish)
 *
 * These will be addressed in a backend API v2 migration.
 */

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
    ): Promise<ContentListResponse> => {
      const endpoint = buildUrl(ENDPOINTS.CONTENT.base, {
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
    get: async (
      workspaceId: string,
      contentId: string,
    ): Promise<ContentResponse> => {
      const url = buildUrl(ENDPOINTS.CONTENT.detail(contentId), {
        workspace_id: workspaceId,
      });

      const response = await client.request<ContentDetailResponse>(url, {
        method: "GET",
      });

      return response.content;
    },

    /**
     * Create new content
     */
    create: async (
      workspaceId: string,
      data: ContentCreate,
    ): Promise<ContentResponse> => {
      const url = buildUrl(ENDPOINTS.CONTENT.base, {
        workspace_id: workspaceId,
      });

      const response = await client.request<ContentDetailResponse>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      return response.content;
    },

    /**
     * Update content
     */
    update: async (
      workspaceId: string,
      contentId: string,
      data: ContentUpdate,
    ): Promise<ContentResponse> => {
      const url = buildUrl(ENDPOINTS.CONTENT.detail(contentId), {
        workspace_id: workspaceId,
      });

      const response = await client.request<ContentDetailResponse>(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      return response.content;
    },

    /**
     * Delete content
     */
    delete: async (workspaceId: string, contentId: string): Promise<void> => {
      const url = buildUrl(ENDPOINTS.CONTENT.detail(contentId), {
        workspace_id: workspaceId,
      });

      return client.request<void>(url, {
        method: "DELETE",
      });
    },

    /**
     * Retry content generation
     */
    retry: async (
      workspaceId: string,
      contentId: string,
    ): Promise<{ content_id: string; status: string }> => {
      const url = buildUrl(ENDPOINTS.CONTENT.retry(contentId), {
        workspace_id: workspaceId,
      });

      return client.request<{ content_id: string; status: string }>(url, {
        method: "POST",
      });
    },

    /**
     * Save draft content
     */
    save: async (
      workspaceId: string,
      data: ContentCreate,
    ): Promise<ContentResponse> => {
      const url = buildUrl(ENDPOINTS.CONTENT.save, {
        workspace_id: workspaceId,
      });

      const response = await client.request<ContentDetailResponse>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      return response.content;
    },

    /**
     * Publish content (Save & Publish)
     */
    save_publish: async (
      workspaceId: string,
      data: ContentCreate,
    ): Promise<ContentResponse> => {
      const url = buildUrl(ENDPOINTS.CONTENT.save_publish, {
        workspace_id: workspaceId,
      });

      const response = await client.request<ContentDetailResponse>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      return response.content;
    },

    /**
     * Publish existing content
     */
    publish: async (
      workspaceId: string,
      data: ContentUpdate,
      contentId: string,
    ): Promise<ContentResponse> => {
      const url = buildUrl(ENDPOINTS.CONTENT.publish(contentId), {
        workspace_id: workspaceId,
      });

      const response = await client.request<ContentDetailResponse>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      return response.content;
    },
  };
}

export type ContentNamespace = ReturnType<typeof createContentNamespace>;
