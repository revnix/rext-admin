/**
 * Workspaces API Namespace
 *
 * Handles workspace CRUD operations and brand voice
 *
 * @note Migrated to use centralized ENDPOINTS registry.
 * @see lib/api-client/endpoints.ts for path conventions.
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
import { ENDPOINTS } from "./endpoints";
import {
  workspaceResponseSchema,
  workspaceListResponseSchema,
  createWorkspaceResponseSchema,
} from "@/schemas/workspace-schemas";
import { validateResponse } from "@/lib/api-response-validator";

export function createWorkspacesNamespace(client: ApiClient) {
  return {
    /**
     * List all workspaces
     */
    // Then wrap existing return values. For example, in the list method:
    list: async () => {
      const data = await client.request<WorkspaceListResponse>(
        ENDPOINTS.WORKSPACES.BASE_ALL,
        {
          method: "GET",
        });
      return validateResponse(workspaceListResponseSchema, data, "workspaces.list");
    },

    // In the get method:
    get: async (workspaceId: string) => {
      const data = await client.request<WorkspaceResponse>(
        ENDPOINTS.WORKSPACES.byId(workspaceId),
        { method: "GET" },
      );
      return validateResponse(workspaceResponseSchema, data, "workspaces.get");
    },



    /**
     * Get workspace by slug
     */
    getBySlug: async (slug: string) => {
      const data = await client.request<WorkspaceResponse>(
        ENDPOINTS.WORKSPACES.bySlug(slug),
        {
          method: "GET",
        },
      );
      return validateResponse(workspaceResponseSchema, data, "workspaces.getBySlug");
    },
    // In the create method:
    create: async (data: { title: string; timezone?: string; url: string }) => {
      const payload = {
        name: data.title,
        timezone: data.timezone,
        url: data.url,
      };
      const response = await client.request<CreateWorkspaceResponse>(
        ENDPOINTS.WORKSPACES.BASE,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return validateResponse(createWorkspaceResponseSchema, response, "workspaces.create");
    },

    /**
     * Update workspace
     */
    update: async (
      workspaceId: string,
      data: {
        name?: string;
        timezone?: string;
        url?: string;
      },
    ) => {
      const payload = {
        name: data.name,
        timezone: data.timezone,
        url: data.url,
      };
      const response = await client.request<WorkspaceResponse>(
        ENDPOINTS.WORKSPACES.byId(workspaceId),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      return validateResponse(workspaceResponseSchema, response, "workspaces.update");
    },

    /**
     * Delete workspace
     */
    delete: async (workspaceId: string) => {
      const response = await client.request<void>(ENDPOINTS.WORKSPACES.byId(workspaceId), {
        method: "DELETE",
      });
      return validateResponse(workspaceResponseSchema, response, "workspaces.delete");
    },

    /**
     * Trigger background refresh of workspace brand voice.
     * Returns operation identifier for SSE tracking.
     */
    refreshBrandVoice: async (workspaceId: string) => {
      const response = await client.request<{
        operation_id: string;
      }>(ENDPOINTS.WORKSPACES.refreshBrandVoice(workspaceId), {
        method: "POST",
      });
      return validateResponse(workspaceResponseSchema, response, "workspaces.refreshBrandVoice");
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

      const response = await client.request<{
        brand_voice: BrandVoice;
      }>(ENDPOINTS.WORKSPACES.brandVoice(workspaceId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return validateResponse(workspaceResponseSchema, response, "workspaces.updateBrandVoice");
    },

    /**
     * Get current user's permissions in a specific workspace
     *
     * Returns workspace-scoped permissions using dot notation (e.g., "topic.create")
     * Note: Response format updated to match Phase 1 backend changes
     */
    getPermissions: async (workspaceId: string) => {
      const response = await client.request<{
        workspace_id: string;
        workspace_slug: string;
        user_role: string; // Simplified: single role name instead of array
        permissions: string[]; // Dot notation: "topic.create", "content.read", etc.
      }>(ENDPOINTS.WORKSPACES.permissions.me(workspaceId), {
        method: "GET",
      });
      return validateResponse(workspaceResponseSchema, response, "workspaces.getPermissions");
    },

    /**
     * Check if current user has a specific permission in a workspace
     */
    checkPermission: async (workspaceId: string, permission: string) => {
      const response = await client.request<{
        has_permission: boolean;
        permission: string;
        workspace_id: string;
      }>(
        `${ENDPOINTS.WORKSPACES.permissions.check(workspaceId)}?permission=${permission}`,
        {
          method: "GET",
        },
      );
      return validateResponse(workspaceResponseSchema, response, "workspaces.checkPermission");
    },

    /**
     * Refresh current user's permissions in a workspace
     *
     * Forces fresh permission retrieval from database
     */
    refreshPermissions: async (workspaceId: string) => {
      const response = await client.request<{
        workspace_id: string;
        workspace_slug: string;
        user_role: string;
        permissions: string[];
      }>(ENDPOINTS.WORKSPACES.permissions.refresh(workspaceId), {
        method: "POST",
      });

      return validateResponse(workspaceResponseSchema, response, "workspaces.refreshPermissions");
    },

    /**
     * Get a workspace member's permissions (admin only)
     */
    getMemberPermissions: async (workspaceId: string, userId: string) => {
      const response = await client.request<{
        user_id: string;
        workspace_id: string;
        roles: Array<{
          name: string;
          display_name: string;
          workspace_scoped: boolean;
          workspace_id: string | null;
        }>;
        permissions: string[];
      }>(ENDPOINTS.WORKSPACES.permissions.member(workspaceId, userId), {
        method: "GET",
      });

      return validateResponse(workspaceResponseSchema, response, "workspaces.getMemberPermissions");
    },

    /**
     * Get workspace statistics for onboarding tracking
     *
     * Returns real-time counts of topics, content, knowledge items, and members
     * Used for tracking onboarding progress on dashboard
     */
    getStats: async (workspaceId: string) => {
      const response = await client.request<WorkspaceStats>(
        ENDPOINTS.WORKSPACES.stats(workspaceId),
        {
          method: "GET",
        },
      );
      return validateResponse(workspaceResponseSchema, response, "workspaces.getStats");
    },

    /**
     * Get available roles for workspace member invitations
     *
     * Returns non-system roles that can be assigned to workspace members.
     * Does not require special permissions - any authenticated user can call this.
     */
    getAvailableRoles: async () => {
      const response = await client.request<{
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
      }>(ENDPOINTS.WORKSPACES.availableRoles, {
        method: "GET",
      });

      return validateResponse(workspaceResponseSchema, response, "workspaces.getAvailableRoles");
    },
  };
}
