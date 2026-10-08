/**
 * Admin Invitations API Namespace
 *
 * Handles platform-level admin invitation operations.
 *
 * Two families of addresses, as the backend has them:
 * - the admin's own (create, list, resend, revoke): `/api/v1/admin/platform/invitations`;
 * - the invited person's (validate, accept, decline): `/api/v1/admin-invitations/…`, each a POST
 *   with the invitation's token in the body. The token is never part of an address: an address is
 *   written to the request and error logs as it is (task 915).
 */

import type {
  AdminInvitation,
  AdminInvitationListResponse,
  CreateAdminInvitationRequest,
  ValidateAdminInvitationResponse,
} from "@/types/admin-invitation";
import type { ApiClient } from "./core";
import { buildUrl } from "../url-utils";
import { ENDPOINTS } from "./endpoints";

export function createAdminInvitationsNamespace(client: ApiClient) {
  return {
    /**
     * Create a new admin invitation (super_admin only)
     */
    create: async (data: CreateAdminInvitationRequest) => {
      return client.request<AdminInvitation>(
        ENDPOINTS.ADMIN_INVITATIONS.create,
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
      const endpoint = buildUrl(ENDPOINTS.ADMIN_INVITATIONS.list, {
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
        ENDPOINTS.ADMIN_INVITATIONS.detail(invitationId),
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
        ENDPOINTS.ADMIN_INVITATIONS.resend(invitationId),
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
        ENDPOINTS.ADMIN_INVITATIONS.revoke(invitationId),
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
        ENDPOINTS.ADMIN_INVITATIONS.validate,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
      );
    },

    /**
     * Accept an admin invitation (requires authentication)
     */
    accept: async (token: string) => {
      return client.request<AdminInvitation>(
        ENDPOINTS.ADMIN_INVITATIONS.accept,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
      );
    },

    /**
     * Decline an admin invitation (public endpoint)
     */
    decline: async (token: string, reason?: string) => {
      return client.request<{ success: boolean; message: string }>(
        ENDPOINTS.ADMIN_INVITATIONS.decline,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, reason }),
        },
      );
    },
  };
}
