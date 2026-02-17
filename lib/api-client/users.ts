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

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  display_name?: string;
  status: string;
  email_verified: boolean;
  avatar_url?: string | null;
  language?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UsersListResponse {
  users: User[];
  total_count: number;
  workspace_id?: string | null;
}

export interface UserSession {
  id: string;
  device_name: string;
  device_type: "desktop" | "mobile" | "tablet";
  ip_address: string | null;
  user_agent: string;
  created_at: string;
  last_activity_at: string | null;
  is_current: boolean;
}

export interface SessionsResponse {
  sessions: UserSession[];
  total_count: number;
  active_count: number;
}

export function createUsersNamespace(client: ApiClient) {
  return {
    /**
     * List all users (optionally filtered by workspace)
     */
    list: async (workspaceId?: string): Promise<UsersListResponse> => {
      const params = workspaceId
        ? `?workspace_id=${encodeURIComponent(workspaceId)}`
        : "";
      return client.request<UsersListResponse>(
        `${ENDPOINTS.USERS.list}${params}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get a single user by ID
     */
    get: async (userId: string): Promise<User> => {
      return client.request<User>(ENDPOINTS.USERS.byId(userId), {
        method: "GET",
      });
    },

    /**
     * Get all active sessions for current user
     */
    getSessions: async (): Promise<SessionsResponse> => {
      return client.request<SessionsResponse>(
        ENDPOINTS.USERS.sessions.list,
        {
          method: "GET",
        },
      );
    },

    /**
     * Revoke a specific session (logout from that device)
     */
    revokeSession: async (sessionId: string): Promise<void> => {
      return client.request<void>(
        ENDPOINTS.USERS.sessions.detail(sessionId),
        {
          method: "DELETE",
        },
      );
    },

    /**
     * Revoke all other sessions (logout from all other devices)
     */
    revokeAllOtherSessions: async (): Promise<void> => {
      return client.request<void>(
        ENDPOINTS.USERS.sessions.revokeAll,
        {
          method: "POST",
        },
      );
    },
  };
}