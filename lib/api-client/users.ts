/**
 * Users API Namespace
 *
 * Handles user profile, session, and account management operations.
 *
 * ⚠️ KNOWN INCONSISTENCIES (backend-driven):
 *
 * ### User List Endpoint:
 * - Uses singular "user" as base: `/api/v1/user/users` (plural "users" under singular "user")
 * - Expected pattern: `/api/v1/users` (consistent plural naming) or `/api/v1/admin/users` (if admin-only)
 * - This violates REST convention of plural resource names
 *
 * ### Root Cause:
 * The endpoint nests a plural resource under a singular namespace, creating ambiguity
 * about whether it's user-scoped or platform-scoped.
 *
 * These will be addressed in a backend API v2 migration.
 * See: lib/api-client/endpoints.ts for full path documentation and convention guide.
 */

import type {
  SessionListResponse,
  SessionItem,
  SessionRevokeResponse,
  BulkSessionRevokeResponse,
} from "@/types/generated/types.gen";
import type {
  UserListResponse,
  UserResponse,
} from "@/types/generated/types.gen";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export type User = UserResponse;

export type UsersListResponse = UserListResponse;

export function createUsersNamespace(client: ApiClient) {
  return {
    /**
     * List all users (optionally filtered by workspace)
     */
    list: async (workspaceId?: string): Promise<UsersListResponse> => {
      const params = workspaceId
        ? `?workspace_id=${encodeURIComponent(workspaceId)}`
        : "";
      const response = await client.request<UserListResponse>(
        `${ENDPOINTS.USERS.list}${params}`,
        {
          method: "GET",
        },
      );

      // Backend returns users as Record<string, unknown>[]; we cast to UserResponse[] for UI safety
      return {
        ...response,
        users: (response?.users || []) as UserResponse[],
      };
    },

    /**
     * Get a single user by ID
     */
    get: async (userId: string): Promise<User> => {
      return client.request<UserResponse>(ENDPOINTS.USERS.byId(userId), {
        method: "GET",
      });
    },

    /**
     * Register a new user
     */
    register: async (data: Record<string, unknown>) => {
      const response = await client.request<{
        user: UserResponse;
        message: string;
      }>(ENDPOINTS.USERS.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      return response;
    },

    /**
     * Register a new user with an invitation token
     */
    registerWithInvitation: async (data: Record<string, unknown>) => {
      return client.request<{
        user: User;
        message: string;
      }>(ENDPOINTS.USERS.registerWithInvitation, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Get all active sessions for current user
     */
    getSessions: async (): Promise<SessionListResponse> => {
      return client.request<SessionListResponse>(
        ENDPOINTS.USERS.sessions.list,
        {
          method: "GET",
        },
      );
    },

    /**
     * Revoke a specific session (logout from that device)
     */
    revokeSession: async (
      sessionId: string,
    ): Promise<SessionRevokeResponse> => {
      return client.request<SessionRevokeResponse>(
        ENDPOINTS.USERS.sessions.detail(sessionId),
        {
          method: "DELETE",
        },
      );
    },

    /**
     * Revoke all other sessions (logout from all other devices)
     */
    revokeAllOtherSessions: async (): Promise<BulkSessionRevokeResponse> => {
      return client.request<BulkSessionRevokeResponse>(
        ENDPOINTS.USERS.sessions.revokeAll,
        {
          method: "DELETE",
        },
      );
    },
  };
}
