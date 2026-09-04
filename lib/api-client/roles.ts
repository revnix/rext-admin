/**
 * Roles & Permissions API Namespace
 *
 * Handles role and permission management
 */

import type {
  AssignPermissionsRequest,
  CreateRoleRequest,
  PermissionWithRoles,
  UpdatePermissionRequest,
  UpdateRoleRequest,
} from "@/types/role";
import type { ApiClient } from "./core";
import { buildUrl } from "@/lib/url-utils";
import { ENDPOINTS } from "./endpoints";

export function createRolesNamespace(client: ApiClient) {
  return {
    /**
     * List all roles with optional permissions — fetches all pages automatically
     *
     * The backend paginates this endpoint (default 50, max 100 per page), so a
     * single unparameterised request silently truncates once the system has
     * more than 50 roles. Same page-walking approach as listPermissions below.
     */
    list: async (includePermissions = false) => {
      const PER_PAGE = 100;
      type RoleListResponse = {
        roles: Array<{
          id: string;
          name: string;
          display_name: string;
          description?: string;
          is_system_role: boolean;
          is_workspace_role?: boolean;
          hierarchy_level: number;
          created_at: string;
          updated_at: string;
          permissions?: Array<{
            id: string;
            name: string;
            display_name: string;
            resource: string;
            action: string;
          }>;
        }>;
        count: number;
        pagination?: {
          page: number;
          per_page: number;
          total: number;
          total_pages: number;
          has_next: boolean;
          has_prev: boolean;
        };
      };

      const pageUrl = (page: number) =>
        buildUrl(ENDPOINTS.ROLES.list, {
          include_permissions: includePermissions ? "true" : "false",
          page,
          per_page: PER_PAGE,
        });

      const firstPage = await client.request<RoleListResponse>(pageUrl(1), {
        method: "GET",
      });

      const totalPages = firstPage.pagination?.total_pages ?? 1;
      if (totalPages <= 1) {
        return {
          roles: firstPage.roles,
          count: firstPage.pagination?.total ?? firstPage.count,
        };
      }

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          client.request<RoleListResponse>(pageUrl(i + 2), { method: "GET" }),
        ),
      );

      const allRoles = [
        ...firstPage.roles,
        ...remainingPages.flatMap((p) => p.roles),
      ];

      return {
        roles: allRoles,
        count: firstPage.pagination?.total ?? allRoles.length,
      };
    },

    /**
     * Create a new role
     *
     * Note: The backend returns the new role's fields directly in `data` (flat),
     * not nested under a `role` key. core.ts unwraps `result.data`, so the
     * resolved value is the role object itself.
     */
    create: async (data: CreateRoleRequest) => {
      return client.request<{
        id: string;
        name: string;
        display_name: string;
        description?: string;
        is_system_role: boolean;
        hierarchy_level: number;
        created_at: string;
        updated_at: string;
      }>(ENDPOINTS.ROLES.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Update a role
     */
    update: async (roleId: string, data: UpdateRoleRequest) => {
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
      }>(ENDPOINTS.ROLES.update(roleId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete a role
     *
     * The backend refuses to delete a role that is still assigned to users
     * unless `reassignTo` names another role to move those users to first.
     */
    delete: async (roleId: string, reassignTo?: string) => {
      return client.request<{
        role_id: string;
      }>(
        buildUrl(ENDPOINTS.ROLES.delete(roleId), { reassign_to: reassignTo }),
        {
          method: "DELETE",
        },
      );
    },

    /**
     * Assign permissions to a role
     */
    assignPermissions: async (
      roleId: string,
      data: AssignPermissionsRequest,
    ) => {
      return client.request<{
        role_id: string;
        role_name: string;
        added_count: number;
        skipped_count: number;
        invalid_count: number;
      }>(ENDPOINTS.ROLES.permissions.assign(roleId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Atomically update/replace permissions assigned to a role
     */
    updatePermissions: async (
      roleId: string,
      data: AssignPermissionsRequest,
    ) => {
      return client.request<{
        role_id: string;
        role_name: string;
        added_count: number;
        skipped_count: number;
        invalid_count: number;
      }>(ENDPOINTS.ROLES.permissions.update(roleId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Revoke a permission from a role
     */
    revokePermission: async (roleId: string, permissionId: string) => {
      return client.request<{
        role_id: string;
        role_name: string;
        permission_id: string;
        permission_name: string;
      }>(ENDPOINTS.ROLES.permissions.revoke(roleId, permissionId), {
        method: "DELETE",
      });
    },

    /**
     * List all permissions with optional roles — fetches all pages automatically
     */
    listPermissions: async (resource?: string, includeRoles = false) => {
      const PER_PAGE = 100;
      type PermissionListResponse = {
        // Canonical shape — an inline duplicate here silently drifted from
        // types/role.ts when is_system was added, breaking the roles page build.
        permissions: PermissionWithRoles[];
        count: number;
        page?: number;
        per_page?: number;
        total_pages?: number;
        pagination?: {
          page: number;
          per_page: number;
          total: number;
          total_pages: number;
          has_next: boolean;
          has_prev: boolean;
        };
      };

      const firstPage = await client.request<PermissionListResponse>(
        buildUrl(ENDPOINTS.PERMISSIONS.list, {
          resource,
          include_roles: includeRoles ? "true" : undefined,
          page: 1,
          per_page: PER_PAGE,
        }),
        { method: "GET" },
      );

      const totalPages =
        firstPage.pagination?.total_pages ?? firstPage.total_pages ?? 1;
      if (totalPages <= 1) {
        return {
          permissions: firstPage.permissions,
          count: firstPage.pagination?.total ?? firstPage.count,
        };
      }

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          client.request<PermissionListResponse>(
            buildUrl(ENDPOINTS.PERMISSIONS.list, {
              resource,
              include_roles: includeRoles ? "true" : undefined,
              page: i + 2,
              per_page: PER_PAGE,
            }),
            { method: "GET" },
          ),
        ),
      );

      const allPermissions = [
        ...firstPage.permissions,
        ...remainingPages.flatMap((p) => p.permissions),
      ];

      return {
        permissions: allPermissions,
        count: firstPage.pagination?.total ?? allPermissions.length,
      };
    },

    /**
     * Update a permission
     */
    updatePermission: async (
      permissionId: string,
      data: UpdatePermissionRequest,
    ) => {
      return client.request<{
        permission: {
          id: string;
          name: string;
          display_name: string;
          description?: string;
          resource: string;
          action: string;
          created_at: string;
        };
      }>(ENDPOINTS.PERMISSIONS.update(permissionId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete a permission
     */
    deletePermission: async (permissionId: string) => {
      return client.request<{
        permission_id: string;
      }>(ENDPOINTS.PERMISSIONS.delete(permissionId), {
        method: "DELETE",
      });
    },
  };
}
