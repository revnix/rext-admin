/**
 * Workspaces API Namespace
 *
 * Handles workspace CRUD operations and brand voice
 */

import type {
  BrandVoice,
  CreateWorkspaceResponse,
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
    create: async (data: { title: string; timezone?: string; url: string }) => {
      // Backend expects 'name' instead of 'title'
      const payload = {
        name: data.title,
        timezone: data.timezone,
        url: data.url,
      };
      return client.request<CreateWorkspaceResponse>("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    /**
     * Update workspace
     */
    update: async (
      workspaceId: string,
      data: {
        title?: string;
        timezone?: string;
        url?: string;
      },
    ) => {
      // Backend expects 'name' instead of 'title'
      const payload: Record<string, unknown> = {};
      if (data.title !== undefined) payload.name = data.title;
      if (data.timezone !== undefined) payload.timezone = data.timezone;
      if (data.url !== undefined) payload.url = data.url;

      return client.request<WorkspaceResponse>(
        `/api/v1/workspaces/${workspaceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
     * WARNING: Backend endpoint does not exist. Needs implementation.
     */
    duplicate: async (sourceWorkspaceId: string) => {
      // TODO: Backend needs to implement workspace duplication endpoint
      return client.request<WorkspaceResponse>(
        `/api/v1/workspaces/${sourceWorkspaceId}/duplicate`,
        {
          method: "POST",
        },
      );
    },

    /**
     * Trigger background refresh of workspace brand voice.
     * Returns operation identifier for SSE tracking.
     */
    refreshBrandVoice: async (workspaceId: string) => {
      return client.request<{
        operation_id: string;
      }>(`/api/v1/workspaces/${workspaceId}/brand-voice/refresh`, {
        method: "POST",
      });
    },

    /**
     * Update brand voice for workspace
     */
    updateBrandVoice: async (
      workspaceId: string,
      data: {
        about?: string;
        customer_profile?: string;
        selling_position?: string;
        target_audience?: string[];
        brand_voice?: string[];
        competitors?: string[];
        content_strategy?: string[];
      },
    ) => {
      const payload = {
        about: data.about ?? "",
        customer_profile: data.customer_profile ?? "",
        selling_position: data.selling_position ?? "",
        target_audience: data.target_audience ?? [],
        brand_voice: data.brand_voice ?? [],
        competitors: data.competitors ?? [],
        content_pillar: data.content_strategy ?? [],
      };

      return client.request<{
        brand_voice: BrandVoice;
      }>(`/api/v1/workspaces/${workspaceId}/brand-voice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
  };
}
