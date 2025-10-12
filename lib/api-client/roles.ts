/**
 * Roles & Permissions API Namespace
 *
 * Handles role and permission management
 */

import type { ApiClient } from "./core";

export function createRolesNamespace(client: ApiClient) {
  return {
    /**
     * List all roles (available roles for invitations)
     */
    list: async () => {
      return client.request<{
        roles: Array<{
          id: string;
          name: string;
          display_name: string;
          description?: string;
          is_system_role: boolean;
          hierarchy_level: number;
          created_at: string;
          updated_at: string;
        }>;
        total_count: number;
      }>("/api/v1/workspaces/available-roles", {
        method: "GET",
      });
    },

    /**
     * Get role by ID
     */
    get: async (roleId: string) => {
      return client.request<{
        role: {
          id: string;
          name: string;
          display_name: string;
          description?: string;
          is_system_role: boolean;
          hierarchy_level: number;
          created_at: string;
          updated_at: string;
        };
      }>(`/api/v1/roles/${roleId}`, {
        method: "GET",
      });
    },

    /**
     * List all permissions
     */
    listPermissions: async () => {
      return client.request<{
        permissions: Array<{
          id: string;
          name: string;
          display_name: string;
          description?: string;
          resource: string;
          action: string;
          created_at: string;
        }>;
        count: number;
      }>("/api/v1/permissions", {
        method: "GET",
      });
    },
  };
}
