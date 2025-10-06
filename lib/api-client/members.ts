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
            email: string;
            display_name: string;
            is_verified: boolean;
          };
        }>;
        total_count: number;
      }>(`/api/v1/workspace/${workspaceId}/members`, {
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
      }>(`/api/v1/workspace/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    },

    /**
     * Remove workspace member
     */
    remove: async (workspaceId: string, memberId: string) => {
      return client.request<void>(
        `/api/v1/workspace/${workspaceId}/members/${memberId}`,
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
      }>(`/api/v1/workspace/${workspaceId}/members/${memberId}/role`, {
        method: "PUT",
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
    create: async (data: {
      workspace_id: string;
      email: string;
      role_id: string;
      expires_in_days?: number;
    }) => {
      return client.request<{
        invitation: {
          id: string;
          token: string;
          email: string;
          workspace_id: string;
          role_id: string;
          expires_at: string;
        };
      }>("/api/v1/workspace/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Create bulk invitations
     */
    createBulk: async (data: {
      workspace_id: string;
      emails: string[];
      role_id: string;
      expires_in_days?: number;
    }) => {
      return client.request<{
        invitations: Array<{
          id: string;
          email: string;
          status: string;
        }>;
        success_count: number;
        failed_count: number;
      }>("/api/v1/workspace/invitations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * List sent invitations
     */
    listSent: async (workspaceId?: string) => {
      const endpoint = workspaceId
        ? `/api/v1/workspace/invitations/sent?workspace_id=${encodeURIComponent(workspaceId)}`
        : "/api/v1/workspace/invitations/sent";

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
      }>(endpoint, {
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
    revoke: async (invitationId: string) => {
      return client.request<void>(
        `/api/v1/workspace/invitations/${invitationId}`,
        {
          method: "DELETE",
        },
      );
    },
  };
}
