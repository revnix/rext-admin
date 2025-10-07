/**
 * Users API Namespace
 *
 * Handles user management operations
 */

import type { ApiClient } from "./core";

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
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
      return client.request<UsersListResponse>(`/api/v1/user/users${params}`, {
        method: "GET",
      });
    },

    /**
     * Get a single user by ID
     */
    get: async (userId: string): Promise<User> => {
      return client.request<User>(`/api/v1/user/${userId}`, {
        method: "GET",
      });
    },
  };
}
