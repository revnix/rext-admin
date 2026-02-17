/**
 * Members & Invitations API Namespace
 *
 * Handles workspace member management, member invitations, and user-level invitation tracking.
 *
 * ⚠️ KNOWN INCONSISTENCIES (backend-driven):
 *
 * ### User Invitations Section:
 * - `listReceived()` uses singular "workspace": `/api/v1/workspace/invitations/received`
 * - `listPending()` uses singular "user": `/api/v1/user/invitations/pending`
 * - Expected pattern: `/api/v1/workspaces/{id}/invitations` (path-based consistency)
 *
 * ### Root Cause:
 * These endpoints are user-scoped (not workspace-scoped) and use legacy singular naming.
 * The inconsistency arises from mixing workspace-scoped and user-scoped resource patterns.
 *
 * These will be addressed in a backend API v2 migration.
 * See: lib/api-client/endpoints.ts for full path documentation and convention guide.
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createMembersNamespace(client: ApiClient) {
  return {
    /**
     * Get workspace members
     */
    list: async (workspaceId: string) => {
      return client.request<{
        members: Array<{
          id: string;
          user_id: string;
          workspace_id: string;
          role_id: string;
          status: string;
          is_default: boolean;
          joined_at: string | null;
          last_activity_at: string | null;
          user: {
            id: string;
            name: string;
            email: string;
            display_name: string | null;
            avatar: string | null;
            is_verified: boolean;
          };
        }>;
        total_count: number;
      }>(ENDPOINTS.MEMBERS.list(workspaceId), {
        method: "GET",
      });
    },

    /**
     * Add workspace member
     */
    add: async (workspaceId: string, email: string) => {
      return client.request<{
        member: {
          id: string;
          user_id: string;
          email: string;
          display_name: string;
          status: string;
        };
      }>(ENDPOINTS.MEMBERS.add(workspaceId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    },

    /**
     * Remove workspace member
     */
    remove: async (workspaceId: string, memberId: string) => {
      return client.request<{ member_id: string }>(
        ENDPOINTS.MEMBERS.remove(workspaceId, memberId),
        {
          method: "DELETE",
        },
      );
    },

    /**
     * Change member role
     */
    changeRole: async (
      workspaceId: string,
      memberId: string,
      roleId: string,
    ) => {
      return client.request<{
        member: {
          id: string;
          role_id: string;
        };
      }>(ENDPOINTS.MEMBERS.changeRole(workspaceId, memberId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: roleId }),
      });
    },
  };
}

export function createInvitationsNamespace(client: ApiClient) {
  return {
    /**
     * Validate invitation token (public - no auth required)
     */
    validate: async (token: string) => {
      return client.request<{
        invitation: {
          id: string;
          email: string;
          workspace: {
            id: string;
            title: string;
            name: string;
            slug: string;
          };
          role: {
            id: string;
            name: string;
            display_name: string;
          };
          invited_by: {
            id: string;
            full_name: string;
            display_name?: string;
          };
          expires_at: string;
          status: string;
          token: string;
        };
      }>(ENDPOINTS.INVITATIONS.validate(token), {
        method: "GET",
      });
    },

    /**
     * Accept workspace invitation (requires auth)
     * Uses public invitation endpoint
     */
    accept: async (token: string) => {
      return client.request<{
        membership_id: string;
        workspace_id: string;
        workspace_name: string;
        workspace_slug: string;
        role: string;
        message: string;
      }>(ENDPOINTS.INVITATIONS.accept(token), {
        method: "POST",
      });
    },

    /**
     * Decline a pending invitation
     */
    decline: async (invitationId: string, reason?: string) => {
      return client.request<{
        invitation_id: string;
        status: string;
      }>(`/api/v1/user/invitations/${invitationId}/decline`, {
        method: "POST",
        headers: reason ? { "Content-Type": "application/json" } : undefined,
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
    },

    /**
     * Create invitation
     */
    create: async (
      workspaceId: string,
      data: {
        email: string;
        role_id: string;
        expiry_days?: number;
      },
    ) => {
      return client.request<{
        invitation: {
          id: string;
          email: string;
          workspace_id: string;
          role_id: string;
          expires_at: string;
        };
      }>(ENDPOINTS.INVITATIONS.create(workspaceId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          role_id: data.role_id,
          expiry_days: data.expiry_days,
        }),
      });
    },

    /**
     * Create bulk invitations
     */
    createBulk: async (
      workspaceId: string,
      data: {
        emails: string[];
        role_id: string;
        expiry_days?: number;
      },
    ) => {
      return client.request<{
        total_requested: number;
        successful: number;
        failed: number;
        results: Array<{
          email: string;
          success: boolean;
          invitation_id?: string;
          error_message?: string;
        }>;
      }>(ENDPOINTS.INVITATIONS.createBulk(workspaceId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: data.emails,
          role_id: data.role_id,
          expiry_days: data.expiry_days,
        }),
      });
    },

    /**
     * List sent invitations
     */
    listSent: async (workspaceId: string) => {
      return client.request<{
        invitations: Array<{
          id: string;
          email: string;
          workspace_id: string;
          role_id: string;
          status: string;
          expires_at: string;
          created_at: string;
          workspace_name?: string;
          role_name?: string;
        }>;
        total_count: number;
      }>(ENDPOINTS.INVITATIONS.listSent(workspaceId), {
        method: "GET",
      });
    },

    /**
     * List received invitations
     */
    listReceived: async () => {
      return client.request<{
        invitations: Array<{
          id: string;
          workspace_id: string;
          workspace_name: string;
          role_id: string;
          status: string;
          expires_at: string;
        }>;
      }>(ENDPOINTS.INVITATIONS.listReceived, {
        method: "GET",
      });
    },

    /**
     * Get pending invitations for the current user
     */
    pending: async () => {
      return client.request<{
        invitations: Array<{
          id: string;
          email: string;
          workspace_id: string;
          workspace_name: string;
          role_id: string;
          role_name: string;
          invited_by:
          | string
          | {
            name: string;
            email: string;
          };
          token: string;
          expires_at: string;
          status: string;
          created_at: string;
        }>;
        count: number;
      }>(ENDPOINTS.INVITATIONS.pending, {
        method: "GET",
      });
    },

    /**
     * Revoke invitation
     */
    revoke: async (
      workspaceId: string,
      invitationId: string,
      reason?: string,
    ) => {
      return client.request<{
        invitation_id: string;
        status: string;
      }>(ENDPOINTS.INVITATIONS.revoke(workspaceId, invitationId), {
        method: "DELETE",
        headers: reason ? { "Content-Type": "application/json" } : undefined,
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
    },

    /**
     * Resend invitation
     */
    resend: async (workspaceId: string, invitationId: string) => {
      return client.request<{
        invitation: {
          id: string;
          email: string;
          workspace_id: string;
          role_id: string;
          status: string;
          expires_at: string;
          created_at: string;
          role_name?: string;
        };
      }>(ENDPOINTS.INVITATIONS.resend(workspaceId, invitationId), {
        method: "POST",
      });
    },
  };
}
