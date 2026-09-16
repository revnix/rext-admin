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

// Note: Content endpoints use query param (?workspace_id=) instead of path param.

import type {
  ContentListResponse,
  ContentResponse,
  CreateContentRequest,
  UpdateContentRequest,
  WordPressPostStatus,
} from "@/types/content";
import type { ApiClient } from "./core";
import { buildUrl } from "../url-utils";
import { ENDPOINTS } from "./endpoints";

export interface BlogImageUpload {
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  storage_backend: "minio";
  storage_path: string;
  storage_bucket: string;
  public_url: string;
  width: number | null;
  height: number | null;
}

export function createContentNamespace(client: ApiClient) {
  return {
    async uploadBlogImage(workspaceId: string, file: File): Promise<BlogImageUpload> {
      const formData = new FormData();
      formData.append("file", file);
      return client.request<BlogImageUpload>(ENDPOINTS.CONTENT.uploadBlogImage(workspaceId), {
        method: "POST", body: formData,
      });
    },
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
    save_publish: async (
      workspaceId: string,
      data: Record<string, unknown>,
      publishStatus: WordPressPostStatus = "publish",
    ) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.save_publish}?workspace_id=${encodeURIComponent(workspaceId)}&publish_status=${encodeURIComponent(publishStatus)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    publish: async (
      workspaceId: string,
      data: Record<string, unknown>,
      contentId: string,
      publishStatus: WordPressPostStatus = "publish",
    ) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.publish(contentId)}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            status: publishStatus,
          }),
        },
      );
    },

    /**
     * Schedule existing content for future publication
     */
    schedule: async (
      workspaceId: string,
      contentId: string,
      scheduledAt: string,
      siteId?: string,
    ) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.publish(contentId)}?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "future",
            scheduled_at: scheduledAt,
            ...(siteId ? { site_id: siteId } : {}),
          }),
        },
      );
    },

    /**
     * Save new content and schedule for future publication
     */
    saveAndSchedule: async (
      workspaceId: string,
      data: Record<string, unknown>,
      scheduledAt: string,
    ) => {
      return client.request<ContentResponse>(
        `${ENDPOINTS.CONTENT.save_publish}?workspace_id=${encodeURIComponent(workspaceId)}&scheduled_at=${encodeURIComponent(scheduledAt)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Cancel a pending scheduled publish — resets content to draft
     */
    cancelSchedule: async (workspaceId: string, contentId: string) => {
      return client.request<{
        content_id: string;
        status: string;
        cancelled_records: number;
      }>(
        `${ENDPOINTS.CONTENT.cancel_schedule(contentId)}?workspace_id=${encodeURIComponent(workspaceId)}`,
        { method: "DELETE" },
      );
    },

    /**
     * Fetch published + scheduled content grouped by day for a given month
     */
    calendar: async (workspaceId: string, year: number, month: number) => {
      return client.request<import("@/types/content").CalendarResponse>(
        `${ENDPOINTS.CONTENT.calendar}?workspace_id=${encodeURIComponent(workspaceId)}&year=${year}&month=${month}`,
        { method: "GET" },
      );
    },
  };
}
