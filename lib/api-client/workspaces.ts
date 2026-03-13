/**
 * Workspaces API Namespace
 *
 * Handles workspace CRUD operations and brand voice
 */

import type {
  WorkspaceListResponse,
  BrandVoiceRefreshResponse,
  AvailableRolesResponse,
  MyWorkspacePermissionsResponse as WorkspacePermissionsResponse,
  WorkspaceStatsResponse as WorkspaceStats,
  BrandVoiceStateResponse,
  BrandVoiceWrapperResponse,
  MemberWorkspacePermissionsResponse as MemberPermissionsResponse,
} from "@/types/generated/types.gen";
import type { Persona, Workspace, BrandVoice as RobustBrandVoice } from "@/types/workspace";

/**
 * Custom response for workspace creation that includes operation_id for SSE tracking.
 * Extending Workspace to ensure type safety for the workspace data itself.
 */
export interface WorkspaceCreateResponse extends Workspace {
  operation_id: string;
}
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";
import { InputSanitizer } from "@/lib/sanitization";

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


export function createWorkspacesNamespace(client: ApiClient) {
  return {
    /**
     * List all workspaces
     */
    list: async () => {
      return client.request<WorkspaceListResponse>(
        ENDPOINTS.WORKSPACES.BASE_ALL,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get workspace by ID
     */
    get: async (workspaceId: string) => {
      return client.request<Workspace>(
        ENDPOINTS.WORKSPACES.byId(workspaceId),
        { method: "GET" },
      );
    },

    /**
     * Get workspace by slug
     */
    getBySlug: async (slug: string) => {
      return client.request<Workspace>(
        ENDPOINTS.WORKSPACES.bySlug(slug),
        {
          method: "GET",
        },
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
      return client.request<WorkspaceCreateResponse>(
        ENDPOINTS.WORKSPACES.BASE,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toCreatePayload(payload)),
        },
      );
    },

    /**
     * Update workspace
     */
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

      return client.request<Workspace>(
        ENDPOINTS.WORKSPACES.byId(workspaceId),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toUpdatePayload(payload)),
        },
      );
    },

    /**
     * Delete workspace
     */
    delete: async (workspaceId: string) => {
      return client.request<Workspace>(
        ENDPOINTS.WORKSPACES.byId(workspaceId),
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
      return client.request<BrandVoiceRefreshResponse>(
        ENDPOINTS.WORKSPACES.refreshBrandVoice(workspaceId),
        {
          method: "POST",
        },
      );
    },

    /**
     * Get brand voice for workspace
     */
    getBrandVoice: async (workspaceId: string) => {
      return client.request<RobustBrandVoice>(
        ENDPOINTS.WORKSPACES.brandVoice(workspaceId),
        {
          method: "GET",
        },
      );
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

      return client.request<RobustBrandVoice>(
        ENDPOINTS.WORKSPACES.brandVoice(workspaceId),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toBrandVoicePayload(payload)),
        },
      );
    },

    /**
     * Get current user's permissions in a specific workspace
     */
    getPermissions: async (workspaceId: string) => {
      return client.request<WorkspacePermissionsResponse>(
        ENDPOINTS.WORKSPACES.permissions.me(workspaceId),
        {
          method: "GET",
        },
      );
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
        `${ENDPOINTS.WORKSPACES.permissions.check(workspaceId)}?permission=${permission}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Refresh current user's permissions in a workspace
     */
    refreshPermissions: async (workspaceId: string) => {
      return client.request<WorkspacePermissionsResponse>(
        ENDPOINTS.WORKSPACES.permissions.refresh(workspaceId),
        {
          method: "POST",
        },
      );
    },

    /**
     * Get a workspace member's permissions (admin only)
     */
    getMemberPermissions: async (workspaceId: string, userId: string) => {
      return client.request<MemberPermissionsResponse>(
        ENDPOINTS.WORKSPACES.permissions.member(workspaceId, userId),
        {
          method: "GET",
        },
      );
    },

    /**
     * Get workspace statistics for onboarding tracking
     */
    getStats: async (workspaceId: string) => {
      return client.request<WorkspaceStats>(
        ENDPOINTS.WORKSPACES.stats(workspaceId),
        {
          method: "GET",
        },
      );
    },

    /**
     * Get available roles for workspace member invitations
     */
    getAvailableRoles: async () => {
      return client.request<AvailableRolesResponse>(
        ENDPOINTS.WORKSPACES.availableRoles,
        {
          method: "GET",
        },
      );
    },
  };

}
