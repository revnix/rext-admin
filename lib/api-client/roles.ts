/**
 * Roles & Permissions API Namespace
 *
 * Handles role and permission management
 */

import type {
  AssignPermissionsRequest,
  CreatePermissionRequest,
  CreateRoleRequest,
  UpdatePermissionRequest,
  UpdateRoleRequest,
} from "@/types/role";
import type { ApiClient } from "./core";
import { buildUrl } from "@/lib/url-utils";
import { ENDPOINTS } from "./endpoints";

export function createRolesNamespace(client: ApiClient) {
  return {
    /**
     * List all roles with optional permissions
     */
    list: async (includePermissions = false) => {
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
          permissions?: Array<{
            id: string;
            name: string;
            display_name: string;
            resource: string;
            action: string;
          }>;
        }>;
        count: number;
      }>(`${ENDPOINTS.ROLES.list}?include_permissions=${includePermissions}`, {
        method: "GET",
      });
    },

    /**
     * Get role by ID with optional permissions
     */
    get: async (roleId: string, includePermissions = false) => {
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
          permissions?: Array<{
            id: string;
            name: string;
            display_name: string;
            resource: string;
            action: string;
          }>;
        };
      }>(
        `${ENDPOINTS.ROLES.get(roleId)}?include_permissions=${includePermissions}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Create a new role
     */
    create: async (data: CreateRoleRequest) => {
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
     */
    delete: async (roleId: string) => {
      return client.request<{
        role_id: string;
      }>(ENDPOINTS.ROLES.delete(roleId), {
        method: "DELETE",
      });
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
     * List permissions for a single page
     */
    listPermissionsPage: async (
      resource?: string,
      includeRoles = false,
      page = 1,
      perPage = 100,
    ) => {
      const url = buildUrl(ENDPOINTS.PERMISSIONS.list, {
        resource,
        include_roles: includeRoles ? "true" : undefined,
        page,
        per_page: perPage,
      });

      return client.request<{
        permissions: Array<{
          id: string;
          name: string;
          display_name: string;
          description?: string;
          resource: string;
          action: string;
          created_at: string;
          roles?: Array<{
            id: string;
            name: string;
            display_name: string;
            hierarchy_level: number;
          }>;
        }>;
        count: number;
        page: number;
        per_page: number;
        total_pages: number;
      }>(url, {
        method: "GET",
      });
    },

    /**
     * List all permissions with optional roles — fetches all pages automatically
     */
    listPermissions: async (resource?: string, includeRoles = false) => {
      const PER_PAGE = 100;
      const firstPage = await client.request<{
        permissions: Array<{
          id: string;
          name: string;
          display_name: string;
          description?: string;
          resource: string;
          action: string;
          created_at: string;
          roles?: Array<{
            id: string;
            name: string;
            display_name: string;
            hierarchy_level: number;
          }>;
        }>;
        count: number;
        page: number;
        per_page: number;
        total_pages: number;
      }>(
        buildUrl(ENDPOINTS.PERMISSIONS.list, {
          resource,
          include_roles: includeRoles ? "true" : undefined,
          page: 1,
          per_page: PER_PAGE,
        }),
        { method: "GET" },
      );

      const totalPages = firstPage.total_pages ?? 1;
      if (totalPages <= 1) {
        return { permissions: firstPage.permissions, count: firstPage.count };
      }

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          client.request<{
            permissions: Array<{
              id: string;
              name: string;
              display_name: string;
              description?: string;
              resource: string;
              action: string;
              created_at: string;
              roles?: Array<{
                id: string;
                name: string;
                display_name: string;
                hierarchy_level: number;
              }>;
            }>;
            count: number;
            page: number;
            per_page: number;
            total_pages: number;
          }>(
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

      return { permissions: allPermissions, count: firstPage.count };
    },

    /**
     * Get permission by ID
     */
    getPermission: async (permissionId: string, includeRoles = false) => {
      return client.request<{
        permission: {
          id: string;
          name: string;
          display_name: string;
          description?: string;
          resource: string;
          action: string;
          created_at: string;
          roles?: Array<{
            id: string;
            name: string;
            display_name: string;
            hierarchy_level: number;
          }>;
        };
      }>(
        `${ENDPOINTS.PERMISSIONS.get(permissionId)}?include_roles=${includeRoles}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Create a new permission
     */
    createPermission: async (data: CreatePermissionRequest) => {
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
      }>(ENDPOINTS.PERMISSIONS.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
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
