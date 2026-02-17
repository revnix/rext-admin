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
  Persona,
} from "@/types/workspace";
import type { WorkspaceStats } from "@/types/workspace-stats";
import type { ApiClient } from "./core";

export function createWorkspacesNamespace(client: ApiClient) {
  return {
    /**
     * List all workspaces
     */
    list: async () => {
      return client.request<WorkspaceListResponse>("/api/v1/workspaces/", {
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
      return client.request<CreateWorkspaceResponse>("/api/v1/workspaces/", {
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
        personas?: Persona[];
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
        personas: data.personas ?? [],
      };

      return client.request<{
        brand_voice: BrandVoice;
      }>(`/api/v1/workspaces/${workspaceId}/brand-voice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    /**
     * Get current user's permissions in a specific workspace
     *
     * Returns workspace-scoped permissions using dot notation (e.g., "topic.create")
     * Note: Response format updated to match Phase 1 backend changes
     */
    getPermissions: async (workspaceId: string) => {
      return client.request<{
        workspace_id: string;
        workspace_slug: string;
        user_role: string; // Simplified: single role name instead of array
        permissions: string[]; // Dot notation: "topic.create", "content.read", etc.
      }>(`/api/v1/workspaces/${workspaceId}/permissions/me`, {
        method: "GET",
      });
    },

    /**
     * Check if current user has a specific permission in a workspace
     */
    checkPermission: async (workspaceId: string, permission: string) => {
      return client.request<{
        has_permission: boolean;
        permission: string;
        workspace_id: string;
      }>(
        `/api/v1/workspaces/${workspaceId}/permissions/check?permission=${permission}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Refresh current user's permissions in a workspace
     *
     * Forces fresh permission retrieval from database
     */
    refreshPermissions: async (workspaceId: string) => {
      return client.request<{
        workspace_id: string;
        workspace_slug: string;
        user_role: string;
        permissions: string[];
      }>(`/api/v1/workspaces/${workspaceId}/permissions/refresh`, {
        method: "POST",
      });
    },

    /**
     * Get a workspace member's permissions (admin only)
     */
    getMemberPermissions: async (workspaceId: string, userId: string) => {
      return client.request<{
        user_id: string;
        workspace_id: string;
        roles: Array<{
          name: string;
          display_name: string;
          workspace_scoped: boolean;
          workspace_id: string | null;
        }>;
        permissions: string[];
      }>(`/api/v1/workspaces/${workspaceId}/members/${userId}/permissions`, {
        method: "GET",
      });
    },

    /**
     * Get workspace statistics for onboarding tracking
     *
     * Returns real-time counts of topics, content, knowledge items, and members
     * Used for tracking onboarding progress on dashboard
     */
    getStats: async (workspaceId: string) => {
      return client.request<WorkspaceStats>(
        `/api/v1/workspaces/${workspaceId}/stats`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get available roles for workspace member invitations
     *
     * Returns non-system roles that can be assigned to workspace members.
     * Does not require special permissions - any authenticated user can call this.
     */
    getAvailableRoles: async () => {
      return client.request<{
        roles: Array<{
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          is_system_role: boolean;
          hierarchy_level: number;
          created_at: string;
          updated_at: string;
        }>;
        total_count: number;
      }>("/api/v1/workspaces/available-roles", {
        method: "GET",
      });
    },
  };
}
