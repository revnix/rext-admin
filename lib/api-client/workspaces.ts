/**
 * Workspaces API Namespace
 *
 * Handles workspace CRUD operations and brand voice
 */

import type {
  BrandVoice,
  WorkspaceListResponse,
  WorkspaceResponse,
} from "@/types/workspace";
import type { ApiClient } from "./core";

export function createWorkspacesNamespace(client: ApiClient) {
  return {
    /**
     * List all workspaces
     */
    list: async () => {
      return client.request<WorkspaceListResponse>("/api/v1/workspaces", {
        method: "GET",
      });
    },

    /**
     * Get workspace by ID
     */
    get: async (workspaceId: string) => {
      return client.request<WorkspaceResponse>(
        `/api/v1/workspaces/${workspaceId}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get workspace by slug
     */
    getBySlug: async (slug: string) => {
      return client.request<WorkspaceResponse>(
        `/api/v1/workspaces/slug/${slug}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Create workspace
     */
    create: async (data: {
      title: string;
      description?: string;
      url: string;
    }) => {
      return client.request<WorkspaceResponse>("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Update workspace
     */
    update: async (
      workspaceId: string,
      data: {
        title?: string;
        description?: string;
        url?: string;
      },
    ) => {
      return client.request<WorkspaceResponse>(
        `/api/v1/workspaces/${workspaceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Delete workspace
     */
    delete: async (workspaceId: string) => {
      return client.request<void>(`/api/v1/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
    },

    /**
     * Duplicate workspace
     */
    duplicate: async (sourceWorkspaceId: string) => {
      return client.request<WorkspaceResponse>(
        `/api/v1/workspaces/${sourceWorkspaceId}/duplicate`,
        {
          method: "POST",
        },
      );
    },

    /**
     * Refresh brand voice for workspace
     */
    refreshBrandVoice: async (workspaceId: string) => {
      return client.request<{
        success: boolean;
        message: string;
        brand_voice?: BrandVoice;
        previous_brand_voice?: BrandVoice;
        changes_detected: boolean;
      }>(`/api/v1/workspaces/${workspaceId}/brand-voice/refresh`, {
        method: "POST",
      });
    },
  };
}
