import { log } from "@/lib/logger";
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
          is_owner?: boolean;
          joined_at: string | null;
          last_activity_at: string | null;
          role?: {
            id: string;
            name: string;
            display_name: string;
          } | null;
          roles?: Array<{
            id: string;
            name: string;
            display_name: string;
          }>;
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
      const response = await client.request<{
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

      // Record audit log
      if (response?.member) {
        client
          .request("/api/v1/audit-logs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "role.assign",
              resource_type: "role",
              resource_id: response.member.user_id,
              workspace_id: workspaceId,
              details: { email },
              status: "success",
            }),
          })
          .catch((e) => log.error("[AuditLog] Failed to log role.assign", e));
      }

      return response;
    },

    /**
     * Remove workspace member
     */
    remove: async (workspaceId: string, memberId: string) => {
      const response = await client.request<{ member_id: string }>(
        ENDPOINTS.MEMBERS.remove(workspaceId, memberId),
        {
          method: "DELETE",
        },
      );

      // Record audit log
      client
        .request("/api/v1/audit-logs/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "role.revoke",
            resource_type: "role",
            resource_id: memberId,
            workspace_id: workspaceId,
            status: "success",
          }),
        })
        .catch((e) => log.error("[AuditLog] Failed to log role.revoke", e));

      return response;
    },

    /**
     * Change member role
     */
    changeRole: async (
      workspaceId: string,
      memberId: string,
      roleId: string,
    ) => {
      const response = await client.request<{
        member: {
          id: string;
          role_id: string;
        };
      }>(ENDPOINTS.MEMBERS.changeRole(workspaceId, memberId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: roleId }),
      });

      // Record audit log
      if (response?.member) {
        client
          .request("/api/v1/audit-logs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "role.assign",
              resource_type: "role",
              resource_id: memberId,
              workspace_id: workspaceId,
              details: { role_id: roleId },
              status: "success",
            }),
          })
          .catch((e) =>
            log.error("[AuditLog] Failed to log role.assign (changeRole)", e),
          );
      }

      return response;
    },
  };
}

export function createInvitationsNamespace(client: ApiClient) {
  return {
    /**
     * Validate invitation token (public - no auth required)
     */
    validate: async (token: string) => {
      // The backend returns the invitation FLAT (workspace_name, role_name,
      // inviter_display_name, ...). This method used to declare it as nested,
      // so TypeScript never caught the mismatch and every consumer read
      // undefined: the signup and login pages crashed on
      // `invitation.workspace.name`, and the accept page silently fell back to
      // "Workspace"/"Member"/"Workspace Admin". Map it here — the one place
      // all three callers go through — and keep the nested shape they expect.
      const response = await client.request<{
        /**
         * Whether an account already exists for the invited email. When true the
         * accept UI should send the user to sign-in rather than sign-up. Optional
         * because older backend builds don't return it.
         */
        user_exists?: boolean;
        invitation: {
          id: string;
          email: string;
          user_exists?: boolean;
          expires_at: string;
          status: string;
          workspace_id: string;
          workspace_name: string;
          workspace_slug: string;
          role_id: string;
          role_name: string;
          inviter_id: string;
          inviter_display_name?: string;
          inviter_username?: string;
          inviter_first_name?: string;
          inviter_last_name?: string;
        };
      }>(ENDPOINTS.INVITATIONS.validate(token), {
        method: "GET",
      });

      const invitation = response.invitation;
      const userExists = response.user_exists ?? invitation.user_exists;
      const inviterFullName =
        [invitation.inviter_first_name, invitation.inviter_last_name]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        invitation.inviter_username ||
        "";

      return {
        user_exists: userExists,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          user_exists: userExists,
          workspace: {
            id: invitation.workspace_id,
            name: invitation.workspace_name,
            slug: invitation.workspace_slug,
          },
          role: {
            id: invitation.role_id,
            name: invitation.role_name,
            // The API sends a single human-readable role name; use it for both
            // so callers reading either field render the same thing.
            display_name: invitation.role_name,
          },
          invited_by: {
            id: invitation.inviter_id,
            full_name: inviterFullName,
            display_name: invitation.inviter_display_name,
          },
          expires_at: invitation.expires_at,
          status: invitation.status,
          token,
        },
      };
    },

    /**
     * Accept workspace invitation (requires auth)
     * Uses public invitation endpoint
     */
    accept: async (token: string) => {
      const response = await client.request<{
        membership_id: string;
        workspace_id: string;
        workspace_name: string;
        workspace_slug: string;
        role: string;
        message: string;
      }>(ENDPOINTS.INVITATIONS.accept(token), {
        method: "POST",
      });

      // Record audit log
      if (response?.workspace_id) {
        client
          .request("/api/v1/audit-logs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "invitation.accept",
              resource_type: "invitation",
              workspace_id: response.workspace_id,
              status: "success",
            }),
          })
          .catch((e) =>
            log.error("[AuditLog] Failed to log invitation.accept", e),
          );
      }

      return response;
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
      const response = await client.request<{
        invitation_id: string;
        status: string;
      }>(ENDPOINTS.INVITATIONS.revoke(workspaceId, invitationId), {
        method: "DELETE",
        headers: reason ? { "Content-Type": "application/json" } : undefined,
        body: reason ? JSON.stringify({ reason }) : undefined,
      });

      // Record audit log
      if (response?.invitation_id) {
        client
          .request("/api/v1/audit-logs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "invitation.revoke",
              resource_type: "invitation",
              resource_id: invitationId,
              workspace_id: workspaceId,
              status: "success",
            }),
          })
          .catch((e) =>
            log.error("[AuditLog] Failed to log invitation.revoke", e),
          );
      }

      return response;
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
