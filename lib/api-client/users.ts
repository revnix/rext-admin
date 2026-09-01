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
  display_role?: string;
  last_login_at?: string | null;
  login_count?: number;
  initials?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  display_name?: string;
  password?: string;
  avatar_url?: string | null;
  language?: string;
  timezone?: string;
}

export interface UsersListPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UsersListResponse {
  users: User[];
  total_count: number;
  workspace_id?: string | null;
  pagination?: UsersListPagination;
}

export interface UserListParams {
  workspace_id?: string;
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  role?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  banned: number;
  verified: number;
  unverified: number;
}

/** Admin-initiated status transitions. Mirrors the backend's valid status set. */
export type UserStatusAction = "suspend" | "activate" | "ban";

export interface UserStatusChangeResponse {
  user_id: string;
  full_name?: string | null;
  email: string;
  old_status: string;
  new_status: string;
  changed_by?: string | null;
  reason?: string | null;
  changed_at: string;
}

/**
 * A single role assignment for a user.
 *
 * Shape comes from RoleService.get_user_roles(), which is richer than the
 * route's declared UserRolesListResponse schema. The declared schema is not
 * enforced (routes return a JSONResponse via success(), which bypasses
 * FastAPI response_model validation), so this matches the real payload.
 */
export interface UserRoleAssignment {
  id: string;
  role_id: string;
  role_name: string;
  role_display_name: string;
  hierarchy_level: number;
  is_workspace_role: boolean;
  workspace_id: string | null;
  workspace_name: string | null;
  is_primary: boolean;
  assigned_at: string | null;
}

export interface UserRolesListResponse {
  roles: UserRoleAssignment[];
  count: number;
}

export interface AssignUserRoleRequest {
  role_id: string;
  /** null = platform-wide (global) role */
  workspace_id?: string | null;
  is_primary?: boolean;
}

export function createUsersNamespace(client: ApiClient) {
  return {
    /**
     * List all users (optionally filtered by workspace).
     *
     * The backend paginates this endpoint (max 100 per page), so a single
     * request only ever returns a partial list. Page through every result
     * so consumers (e.g. the admin User Management table and its stat
     * cards) see the complete, accurate user set rather than just page 1.
     */
    /**
     * List users with server-side pagination, search, role & status filtering, and sorting.
     */
    list: async (
      params?: UserListParams | string,
    ): Promise<UsersListResponse> => {
      const searchParams = new URLSearchParams();
      if (typeof params === "string") {
        if (params) searchParams.set("workspace_id", params);
      } else if (params) {
        if (params.workspace_id)
          searchParams.set("workspace_id", params.workspace_id);
        if (params.page) searchParams.set("page", String(params.page));
        if (params.per_page)
          searchParams.set("per_page", String(params.per_page));
        if (params.search?.trim())
          searchParams.set("search", params.search.trim());
        if (params.status && params.status !== "all")
          searchParams.set("status", params.status);
        if (params.role && params.role !== "all")
          searchParams.set("role", params.role);
        if (params.sort_by) searchParams.set("sort_by", params.sort_by);
        if (params.sort_order)
          searchParams.set("sort_order", params.sort_order);
      }

      const queryString = searchParams.toString();
      const url = queryString
        ? `${ENDPOINTS.USERS.list}?${queryString}`
        : ENDPOINTS.USERS.list;

      return client.request<UsersListResponse>(url, { method: "GET" });
    },

    /**
     * Get aggregate statistics for users (backing the stat cards).
     */
    stats: async (): Promise<UserStats> => {
      return client.request<UserStats>(ENDPOINTS.USERS.stats, {
        method: "GET",
      });
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
     * Change a user's account status (admin).
     *
     * Requires `user.update`. The backend records an audit log entry with the
     * old status, new status and reason, so always pass a reason where the
     * action is punitive.
     */
    setStatus: async (
      userId: string,
      action: UserStatusAction,
      reason?: string,
    ): Promise<UserStatusChangeResponse> => {
      return client.request<UserStatusChangeResponse>(
        ENDPOINTS.USERS[action](userId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The body is required even though `reason` itself is optional.
          body: JSON.stringify({ reason: reason?.trim() || null }),
        },
      );
    },

    /**
     * Update user details (admin).
     * Requires `user.update`.
     */
    updateUser: async (
      userId: string,
      data: UpdateUserRequest,
    ): Promise<User> => {
      return client.request<User>(ENDPOINTS.USERS.update(userId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Soft delete a user (admin).
     * Requires `user.delete`.
     */
    deleteUser: async (userId: string): Promise<{ id: string }> => {
      return client.request<{ id: string }>(ENDPOINTS.USERS.delete(userId), {
        method: "DELETE",
      });
    },

    /**
     * List every role assigned to a user, global and workspace-scoped.
     */
    listRoles: async (
      userId: string,
      workspaceId?: string,
    ): Promise<UserRolesListResponse> => {
      const query = workspaceId
        ? `?${new URLSearchParams({ workspace_id: workspaceId })}`
        : "";
      return client.request<UserRolesListResponse>(
        `${ENDPOINTS.USERS.roles.list(userId)}${query}`,
        { method: "GET" },
      );
    },

    /**
     * Assign a role to a user. Requires `user.manage_roles`.
     *
     * Omit `workspace_id` (or pass null) for a platform-wide role. A
     * workspace-scoped assignment is rejected unless the user is already a
     * member of that workspace.
     */
    assignRole: async (userId: string, data: AssignUserRoleRequest) => {
      return client.request<{
        assignment: Record<string, unknown>;
        role_name: string;
        role_display_name: string;
        workspace_name: string | null;
      }>(ENDPOINTS.USERS.roles.assign(userId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: data.role_id,
          workspace_id: data.workspace_id ?? null,
          is_primary: data.is_primary ?? false,
        }),
      });
    },

    /**
     * Revoke a role from a user. Requires `user.manage_roles`.
     *
     * `workspaceId` must match the scope the role was assigned under,
     * otherwise the assignment will not be found.
     */
    revokeRole: async (
      userId: string,
      roleId: string,
      workspaceId?: string | null,
    ) => {
      const query = workspaceId
        ? `?${new URLSearchParams({ workspace_id: workspaceId })}`
        : "";
      return client.request<{
        user_id: string;
        role_id: string;
        workspace_id: string | null;
        role_name: string;
      }>(`${ENDPOINTS.USERS.roles.revoke(userId, roleId)}${query}`, {
        method: "DELETE",
      });
    },

    /**
     * Register a new user
     */
    register: async (data: Record<string, unknown>) => {
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

    /**
     * Notify the backend of logout so the access token is blacklisted
     * and the event is recorded in the security activity log.
     */
    logout: async (): Promise<void> => {
      return client.request<void>(ENDPOINTS.USERS.logout, {
        method: "POST",
      });
    },
  };
}
