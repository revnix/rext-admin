import { buildUrl } from "../url-utils";
import type { ApiClient } from "./core";

/**
 * Media API Client
 *
 * Handles all media-related API calls for file upload, management, and storage.
 */

export interface Media {
  id: string;
  workspace_id: string;
  user_id: string;

  // File information
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  file_extension: string | null;

  // Storage
  storage_backend: string;
  storage_path: string;
  storage_bucket: string | null;
  cdn_url: string | null;
  public_url: string | null;

  // Metadata
  title: string | null;
  description: string | null;
  alt_text: string | null;
  metadata: Record<string, unknown>;

  // Organization
  folder: string | null;
  tags: string[];

  // Access control
  is_public: boolean;
  access_level: string;

  // Image-specific
  thumbnail_path: string | null;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;

  // Processing
  processing_status: string;
  processing_error: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MediaListResponse {
  items: Media[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

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

export interface StorageUsageResponse {
  total_files: number;
  total_size: number;
  storage_limit: number;
  usage_percentage: number;
  by_type: {
    image: { count: number; size: number };
    document: { count: number; size: number };
    video: { count: number; size: number };
  };
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
        `/api/v1/workspaces/${workspaceId}/media/upload`,
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

      const url = buildUrl(`/api/v1/workspaces/${workspaceId}/media`, {
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
        `/api/v1/workspaces/${workspaceId}/media/${mediaId}`,
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
        `/api/v1/workspaces/${workspaceId}/media/${mediaId}`,
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
    ): Promise<{ message: string }> {
      return client.request<{ message: string }>(
        `/api/v1/workspaces/${workspaceId}/media/${mediaId}`,
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
    ): Promise<{
      data: {
        deleted: number;
        failed: number;
        errors: string[];
      };
      message: string;
    }> {
      return client.request<{
        data: { deleted: number; failed: number; errors: string[] };
        message: string;
      }>(
        `/api/v1/workspaces/${workspaceId}/media/bulk-delete?permanent=${permanent}`,
        {
          method: "POST",
          body: JSON.stringify(mediaIds),
        },
      );
    },

    /**
     * Get storage usage statistics
     */
    async getUsage(workspaceId: string): Promise<StorageUsageResponse> {
      return client.request<StorageUsageResponse>(
        `/api/v1/workspaces/${workspaceId}/media/usage/stats`,
      );
    },

    /**
     * Get media usage information (where it's used in content)
     */
    async getMediaUsage(
      workspaceId: string,
      mediaId: string,
    ): Promise<{
      data: {
        is_used: boolean;
        featured_in: Array<{
          id: string;
          title: string;
          slug: string;
          status: string;
          usage_type: string;
        }>;
        used_in_content: Array<{
          id: string;
          title: string;
          slug: string;
          status: string;
          usage_type: string;
          position?: number;
        }>;
        total_usages: number;
      };
    }> {
      return client.request(
        `/api/v1/workspaces/${workspaceId}/media/${mediaId}/usage`,
      );
    },
  };
}
