/**
 * Members & Invitations API Namespace
 *
 * Handles workspace member management and invitations
 */

import type { ApiClient } from "./core";

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
      }>(`/api/v1/workspaces/${workspaceId}/members`, {
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
      }>(`/api/v1/workspaces/${workspaceId}/members`, {
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
        `/api/v1/workspaces/${workspaceId}/members/${memberId}`,
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
      }>(`/api/v1/workspaces/${workspaceId}/members/${memberId}/role`, {
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
      }>(`/api/v1/workspaces/${workspaceId}/invitations`, {
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
      }>(`/api/v1/workspaces/${workspaceId}/invitations/bulk`, {
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
      }>(`/api/v1/workspaces/${workspaceId}/invitations`, {
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
      }>("/api/v1/workspace/invitations/received", {
        method: "GET",
      });
    },

    /**
     * Accept invitation
     */
    accept: async (token: string) => {
      return client.request<{
        workspace_id: string;
        message: string;
      }>(`/api/v1/workspace/invitations/${token}/accept`, {
        method: "POST",
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
      }>(`/api/v1/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "DELETE",
        headers: reason ? { "Content-Type": "application/json" } : undefined,
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
    },
  };
}
