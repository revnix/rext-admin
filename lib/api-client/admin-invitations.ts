/**
 * Admin Invitations API Namespace
 *
 * Handles platform-level admin invitation operations.
 * Only accessible to super_admin users.
 */

import type {
  AdminInvitation,
  AdminInvitationListResponse,
  CreateAdminInvitationRequest,
  ValidateAdminInvitationResponse,
} from "@/types/admin-invitation";
import type { ApiClient } from "./core";
import { buildUrl } from "../url-utils";

export function createAdminInvitationsNamespace(client: ApiClient) {
  return {
    /**
     * Create a new admin invitation (super_admin only)
     */
    create: async (data: CreateAdminInvitationRequest) => {
      return client.request<AdminInvitation>(
        "/api/v1/admin/platform/invitations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * List all admin invitations with optional filtering
     */
    list: async (filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const endpoint = buildUrl("/api/v1/admin/platform/invitations", {
        status: filters?.status,
        limit: filters?.limit,
        offset: filters?.offset,
      });
      
      return client.request<AdminInvitationListResponse>(endpoint, {
        method: "GET",
      });
    },

    /**
     * Get details of a specific admin invitation
     */
    get: async (invitationId: string) => {
      return client.request<AdminInvitation>(
        `/api/v1/admin/platform/invitations/${invitationId}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Resend an admin invitation with new token
     */
    resend: async (invitationId: string, expiryDays?: number) => {
      return client.request<AdminInvitation>(
        `/api/v1/admin/platform/invitations/${invitationId}/resend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expiry_days: expiryDays || 7 }),
        },
      );
    },

    /**
     * Revoke (cancel) an admin invitation
     */
    revoke: async (invitationId: string, reason?: string) => {
      return client.request<{ success: boolean; message: string }>(
        `/api/v1/admin/platform/invitations/${invitationId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );
    },

    /**
     * Validate an admin invitation token (public endpoint)
     */
    validateToken: async (token: string) => {
      return client.request<ValidateAdminInvitationResponse>(
        `/api/v1/admin-invitations/${token}/validate`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Accept an admin invitation (requires authentication)
     */
    accept: async (token: string) => {
      return client.request<AdminInvitation>(
        `/api/v1/admin-invitations/${token}/accept`,
        {
          method: "POST",
        },
      );
    },

    /**
     * Decline an admin invitation (public endpoint)
     */
    decline: async (token: string, reason?: string) => {
      return client.request<{ success: boolean; message: string }>(
        `/api/v1/admin-invitations/${token}/decline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );
    },
  };
}
