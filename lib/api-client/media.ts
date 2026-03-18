import type {
  MediaItemSchema,
  MediaListData,
  StorageUsageData,
  BulkDeleteMediaData,
  DeleteMediaData,
  MediaUsageData,
} from "@/types/generated/types.gen";
import { buildUrl } from "../url-utils";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

/**
 * Media API Client
 *
 * Handles all media-related API calls for file upload, management, and storage.
 */

export type Media = MediaItemSchema;
export type MediaListResponse = MediaListData;
export type StorageUsageResponse = StorageUsageData;

export interface MediaUploadParams {
  file: File;
  title?: string;
  description?: string;
  folder?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface MediaUpdateParams {
  title?: string;
  description?: string;
  alt_text?: string;
  folder?: string;
  tags?: string[];
}

export interface MediaListParams {
  folder?: string;
  file_type?: "image" | "document" | "video";
  tags?: string[];
  page?: number;
  per_page?: number;
}

/**
 * Create media namespace with API client methods
 */
export function createMediaNamespace(client: ApiClient) {
  return {
    /**
     * Upload a media file
     */
    async upload(
      workspaceId: string,
      params: MediaUploadParams,
    ): Promise<{ data: Media; message: string }> {
      const formData = new FormData();
      formData.append("file", params.file);

      if (params.title) formData.append("title", params.title);
      if (params.description)
        formData.append("description", params.description);
      if (params.folder) formData.append("folder", params.folder);
      if (params.tags?.length) formData.append("tags", params.tags.join(","));
      if (params.is_public !== undefined)
        formData.append("is_public", String(params.is_public));

      return client.request<{ data: Media; message: string }>(
        ENDPOINTS.MEDIA.upload(workspaceId),
        {
          method: "POST",
          body: formData,
        },
      );
    },

    /**
     * List media files
     */
    async list(
      workspaceId: string,
      params?: MediaListParams,
    ): Promise<MediaListResponse> {
      const url = buildUrl(ENDPOINTS.MEDIA.base(workspaceId), {
        folder: params?.folder,
        file_type: params?.file_type,
        tags: params?.tags?.join(","),
        page: params?.page,
        per_page: params?.per_page,
      });

      return client.request<MediaListResponse>(url);
    },

    /**
     * Get media file details
     */
    async get(workspaceId: string, mediaId: string): Promise<{ data: Media }> {
      return client.request<{ data: Media }>(
        ENDPOINTS.MEDIA.detail(workspaceId, mediaId),
      );
    },

    /**
     * Update media metadata
     */
    async update(
      workspaceId: string,
      mediaId: string,
      params: MediaUpdateParams,
    ): Promise<{ data: Media; message: string }> {
      const formData = new FormData();

      if (params.title) formData.append("title", params.title);
      if (params.description)
        formData.append("description", params.description);
      if (params.alt_text) formData.append("alt_text", params.alt_text);
      if (params.folder) formData.append("folder", params.folder);
      if (params.tags?.length) formData.append("tags", params.tags.join(","));

      return client.request<{ data: Media; message: string }>(
        ENDPOINTS.MEDIA.detail(workspaceId, mediaId),
        {
          method: "PATCH",
          body: formData,
        },
      );
    },

    /**
     * Delete media file
     */
    async delete(
      workspaceId: string,
      mediaId: string,
    ): Promise<DeleteMediaData> {
      return client.request<DeleteMediaData>(
        ENDPOINTS.MEDIA.detail(workspaceId, mediaId),
        {
          method: "DELETE",
        },
      );
    },

    /**
     * Bulk delete media files
     */
    async bulkDelete(
      workspaceId: string,
      mediaIds: string[],
      permanent = false,
    ): Promise<BulkDeleteMediaData> {
      const url = `${ENDPOINTS.MEDIA.bulkDelete(workspaceId)}?permanent=${permanent}`;

      return client.request<BulkDeleteMediaData>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaIds),
      });
    },

    /**
     * Get storage usage statistics
     */
    async getUsage(workspaceId: string): Promise<StorageUsageResponse> {
      return client.request<StorageUsageData>(
        ENDPOINTS.MEDIA.usage.stats(workspaceId),
      );
    },

    /**
     * Get media usage information (where it's used in content)
     */
    async getMediaUsage(
      workspaceId: string,
      mediaId: string,
    ): Promise<MediaUsageData> {
      return client.request<MediaUsageData>(
        ENDPOINTS.MEDIA.usage.detail(workspaceId, mediaId),
      );
    },
  };
}
