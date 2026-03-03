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
  RevokeAllSessionsResponse,
  SessionListResponse,
  UserSession,
} from "@/types/user-session";
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
     * Register a new user
     */
    register: async (data: any) => {
      return client.request<{
        user: User;
        message: string;
      }>(ENDPOINTS.USERS.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Register a new user with an invitation token
     */
    registerWithInvitation: async (data: any) => {
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
      const response = await client.request<SessionListResponse>(
        ENDPOINTS.USERS.sessions.list,
        {
          method: "GET",
        },
      );

      return {
        ...response,
        sessions: response.sessions.map((s): UserSession => {
          const session = s as UserSession & {
            device?: string;
            browser?: string;
            last_active?: string;
          };
          return {
            ...s,
            device_name:
              session.device_name ?? session.device ?? "Unknown Device",
            device_type: session.device_type ?? null,
            ip_address: session.ip_address ?? null,
            user_agent: session.user_agent ?? session.browser ?? null,
            created_at: session.created_at ?? null,
            last_activity_at:
              session.last_activity_at ?? session.last_active ?? null,
            is_current: Boolean(session.is_current),
          };
        }),
      };
    },

    /**
     * Revoke a specific session (logout from that device)
     */
    revokeSession: async (sessionId: string): Promise<void> => {
      return client.request<void>(ENDPOINTS.USERS.sessions.detail(sessionId), {
        method: "DELETE",
      });
    },

    /**
     * Revoke all other sessions (logout from all other devices)
     */
    revokeAllOtherSessions: async (): Promise<RevokeAllSessionsResponse> => {
      return client.request<RevokeAllSessionsResponse>(
        ENDPOINTS.USERS.sessions.revokeAll,
        {
          method: "DELETE",
        },
      );
    },
  };
}
