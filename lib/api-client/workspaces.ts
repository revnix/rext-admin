import { log } from "@/lib/logger";
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

interface DeletedWorkspaceResponse {
  total_count: number;
  workspaces: Array<{
    id: string;
    user_id: string;
    name: string;
    slug: string;
    timezone: string | null;
    url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
    recovery_deadline: string;
    days_remaining: number;
  }>;
}
import type { WorkspaceStats } from "@/types/workspace-stats";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";
import {
  workspaceResponseSchema,
  workspaceListResponseSchema,
  createWorkspaceResponseSchema,
  refreshBrandVoiceResponseSchema,
  availableRolesResponseSchema,
  workspacePermissionsResponseSchema,
  workspaceStatsSchema,
  memberPermissionsResponseSchema,
  updateBrandVoiceResponseSchema,
} from "@/schemas/workspace-schemas";
import { validateResponse } from "@/lib/api-response-validator";

interface WorkspaceCreatePayload {
  name: string;
  timezone?: string;
  url: string;
}

interface WorkspaceUpdatePayload {
  name?: string;
  timezone?: string;
  url?: string;
}

function toCreatePayload(data: {
  name: string;
  timezone?: string;
  url: string;
}): WorkspaceCreatePayload {
  return {
    name: data.name,
    timezone: data.timezone,
    url: data.url,
  };
}

function toUpdatePayload(data: {
  title?: string;
  name?: string;
  timezone?: string;
  url?: string;
}): WorkspaceUpdatePayload {
  const payload: WorkspaceUpdatePayload = {};
  if (data.title !== undefined) payload.name = data.title;
  if (data.name !== undefined) payload.name = data.name;
  if (data.timezone !== undefined) payload.timezone = data.timezone;
  if (data.url !== undefined) payload.url = data.url;
  return payload;
}

interface BrandVoicePayload {
  brand_name: string;
  about: string;
  customer_profile: string;
  selling_position: string;
  target_audience: string[];
  brand_voice: string[];
  competitors: string[];
  content_pillar: string[];
  personas: Persona[];
}

function toBrandVoicePayload(data: {
  brand_name?: string;
  about?: string;
  customer_profile?: string;
  selling_position?: string;
  target_audience?: string[];
  brand_voice?: string[];
  competitors?: string[];
  content_strategy?: string[];
  personas?: Persona[];
}): BrandVoicePayload {
  return {
    brand_name: data.brand_name ?? "",
    about: data.about ?? "",
    customer_profile: data.customer_profile ?? "",
    selling_position: data.selling_position ?? "",
    target_audience: data.target_audience ?? [],
    brand_voice: data.brand_voice ?? [],
    competitors: data.competitors ?? [],
    content_pillar: data.content_strategy ?? [],
    personas: data.personas ?? [],
  };
}
import { InputSanitizer } from "@/lib/sanitization";

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
        },
      );
      return validateResponse(
        workspaceListResponseSchema,
        data,
        "workspaces.list",
      );
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
     * List the caller's own soft-deleted workspaces that are still recoverable.
     */
    getDeleted: async () => {
      const data = await client.request<DeletedWorkspaceResponse>(
        ENDPOINTS.WORKSPACES.deleted(),
        { method: "GET" },
      );

      return data;
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
      return validateResponse(
        workspaceResponseSchema,
        data,
        "workspaces.getBySlug",
      );
    },

    /**
     * Create workspace
     */
    create: async (data: { name: string; timezone?: string; url: string }) => {
      const payload = {
        name: InputSanitizer.sanitizeText(data.name.trim()),
        timezone: data.timezone,
        url: data.url.trim(),
      };
      const response = await client.request<CreateWorkspaceResponse>(
        ENDPOINTS.WORKSPACES.BASE,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toCreatePayload(payload)),
        },
      );

      const result = validateResponse(
        createWorkspaceResponseSchema,
        response,
        "workspaces.create",
      );

      return result;
    },

    update: async (
      workspaceId: string,
      data: { title?: string; name?: string; timezone?: string; url?: string },
    ) => {
      const payload: Record<string, unknown> = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.name !== undefined)
        payload.name = InputSanitizer.sanitizeText(data.name.trim());
      if (data.timezone !== undefined) payload.timezone = data.timezone;
      if (data.url !== undefined) payload.url = data.url.trim();
      const response = await client.request<WorkspaceResponse>(
        ENDPOINTS.WORKSPACES.byId(workspaceId),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toUpdatePayload(payload)),
        },
      );

      const result = validateResponse(
        workspaceResponseSchema,
        response,
        "workspaces.update",
      );

      return result;
    },

    /**
     * Delete workspace
     */
    delete: async (workspaceId: string) => {
      const response = await client.request<void>(
        ENDPOINTS.WORKSPACES.byId(workspaceId),
        {
          method: "DELETE",
        },
      );

      const result = validateResponse(
        workspaceResponseSchema,
        response,
        "workspaces.delete",
      );

      // Store in localStorage for frontend synthesis since backend API might fail
      try {
        if (typeof window !== "undefined") {
          const deleted = JSON.parse(
            localStorage.getItem("rext_deleted_workspaces") || "[]",
          );
          deleted.push({
            id: workspaceId,
            deleted_at: new Date().toISOString(),
          });
          localStorage.setItem(
            "rext_deleted_workspaces",
            JSON.stringify(deleted),
          );
        }
      } catch (e) {
        log.error("Failed to store deleted workspace in localStorage", e);
      }

      return result;
    },

    /**
     * Restore a soft-deleted workspace within its 30-day recovery window
     */
    restore: async (workspaceId: string) => {
      const response = await client.request<WorkspaceResponse>(
        ENDPOINTS.WORKSPACES.restore(workspaceId),
        {
          method: "POST",
        },
      );

      const result = validateResponse(
        workspaceResponseSchema,
        response,
        "workspaces.restore",
      );

      return result;
    },

    /**
     * Permanently delete a workspace that is already in trash.
     *
     * Irreversible — there is no restore after this. Only ever called from the
     * trash page, on a workspace the caller has already soft-deleted.
     */
    deletePermanently: async (workspaceId: string) => {
      await client.request<void>(
        ENDPOINTS.WORKSPACES.permanentDelete(workspaceId),
        {
          method: "DELETE",
        },
      );
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

      return validateResponse(
        refreshBrandVoiceResponseSchema,
        response,
        "workspaces.refreshBrandVoice",
      );
    },

    /**
     * Get brand voice for workspace
     */
    getBrandVoice: async (workspaceId: string) => {
      const response = await client.request<{
        brand_voice: BrandVoice;
      }>(ENDPOINTS.WORKSPACES.brandVoice(workspaceId), {
        method: "GET",
      });

      return validateResponse(
        updateBrandVoiceResponseSchema,
        response,
        "workspaces.getBrandVoice",
      );
    },

    /**
     * Update brand voice for workspace
     */
    updateBrandVoice: async (
      workspaceId: string,
      data: {
        brand_name?: string;
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
        brand_name: data.brand_name ?? "",
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
        body: JSON.stringify(toBrandVoicePayload(payload)),
      });
      return validateResponse(
        updateBrandVoiceResponseSchema,
        response,
        "workspaces.updateBrandVoice",
      );
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
      return validateResponse(
        workspacePermissionsResponseSchema,
        response,
        "workspaces.getPermissions",
      );
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
      return response; // checkPermission doesn't have a matching schema yet, returning as is for now or we should define one.
      // Actually let's just return response and not validate with the wrong schema.
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

      return validateResponse(
        workspacePermissionsResponseSchema,
        response,
        "workspaces.refreshPermissions",
      );
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

      return validateResponse(
        memberPermissionsResponseSchema,
        response,
        "workspaces.getMemberPermissions",
      );
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
      return validateResponse(
        workspaceStatsSchema,
        response,
        "workspaces.getStats",
      );
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

      return validateResponse(
        availableRolesResponseSchema,
        response,
        "workspaces.getAvailableRoles",
      );
    },
  };
}
