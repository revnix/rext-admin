"use client";

import { useSession } from "next-auth/react";
import {
  checkAllPermissions,
  checkAnyPermission,
  checkAnyRole,
  checkPermission,
  checkRole,
  isAdmin,
  isSuperAdmin,
  type UserWithPermissions,
} from "@/lib/permissions";

/**
 * Convert AuthJS session user to UserWithPermissions format
 */
function sessionUserToPermissionUser(
  sessionUser:
    | {
        id?: string;
        email?: string | null;
        name?: string | null;
        role?: string;
        permissions?: string[];
      }
    | undefined,
): UserWithPermissions | null {
  if (!sessionUser) return null;

  return {
    id: sessionUser.id || "",
    email: sessionUser.email || "",
    name: sessionUser.name || "",
    role: sessionUser.role || undefined,
    permissions: sessionUser.permissions || [],
  };
}

/**
 * Hook to check if user has a specific permission
 * @param permission - Single permission string
 * @returns boolean indicating if user has the permission
 *
 * @example
 * const canCreateUser = usePermission("user.create");
 * if (canCreateUser) {
 *   // Show create user button
 * }
 */
export function usePermission(permission: string): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  return checkPermission(user, permission);
}

/**
 * Hook to check if user has ANY of the specified permissions
 * @param permissions - Array of permission strings
 * @returns boolean indicating if user has at least one permission
 *
 * @example
 * const canManageUsers = useAnyPermission(["user.create", "user.update", "user.delete"]);
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  return checkAnyPermission(user, permissions);
}

/**
 * Hook to check if user has ALL of the specified permissions
 * @param permissions - Array of permission strings
 * @returns boolean indicating if user has all permissions
 *
 * @example
 * const canFullyManageRoles = useAllPermissions(["role.create", "role.update", "role.delete"]);
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  return checkAllPermissions(user, permissions);
}

/**
 * Hook to check if user has a specific role
 * @param role - Role string to check
 * @returns boolean indicating if user has the role
 *
 * @example
 * const isUserAdmin = useRole("admin");
 */
export function useRole(role: string): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  return checkRole(user, role);
}

/**
 * Hook to check if user has ANY of the specified roles
 * @param roles - Array of role strings
 * @returns boolean indicating if user has at least one role
 *
 * @example
 * const isAdminOrManager = useAnyRole(["admin", "manager"]);
 */
export function useAnyRole(roles: string[]): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  return checkAnyRole(user, roles);
}

/**
 * Hook to check if user is an admin (admin or super_admin)
 * @returns boolean indicating if user is an admin
 *
 * @example
 * const userIsAdmin = useIsAdmin();
 * if (userIsAdmin) {
 *   // Show admin panel
 * }
 */
export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  return isAdmin(user);
}

/**
 * Hook to check if user is a super admin
 * @returns boolean indicating if user is a super admin
 *
 * @example
 * const userIsSuperAdmin = useIsSuperAdmin();
 */
export function useIsSuperAdmin(): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  return isSuperAdmin(user);
}

/**
 * Hook to get the current user with permissions
 * @returns UserWithPermissions object or null
 *
 * @example
 * const user = usePermissionUser();
 * if (user) {
 *   log.info(`User ${user.name} has role: ${user.role}`);
 * }
 */
export function usePermissionUser(): UserWithPermissions | null {
  const { data: session } = useSession();
  return sessionUserToPermissionUser(session?.user);
}

/**
 * Hook to check workspace-scoped permission
 *
 * Checks permission from workspace permission store, which is loaded
 * via useWorkspacePermissions hook.
 *
 * @param permission - Permission string to check
 * @param workspaceId - Workspace ID for scoped permission check
 * @returns boolean indicating if user has permission in workspace
 *
 * @example
 * const canManageWorkspace = useWorkspacePermission("workspace:manage_settings", workspaceId);
 */
export function useWorkspacePermission(
  permission: string,
  workspaceId?: string,
): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  // If no workspace ID, fall back to global permission check
  if (!workspaceId) {
    return checkPermission(user, permission);
  }

  // Super admin has all permissions
  if (isSuperAdmin(user)) return true;

  // Import permission store dynamically to avoid circular deps
  // Use workspace permissions from store if available
  if (typeof window !== "undefined") {
    // Access store on client side only
    const { usePermissionStore } = require("@/stores/permission-store");
    const store = usePermissionStore.getState();

    // Check workspace-specific permissions from store
    const wsPerms = store.workspacePermissions.get(workspaceId);
    if (wsPerms?.permissions.includes(permission)) {
      return true;
    }
  }

  // Fallback to global permissions
  return checkPermission(user, permission);
}

/**
 * Hook to check if user has any workspace-scoped permissions
 *
 * Checks permissions from workspace permission store.
 *
 * @param permissions - Array of permission strings
 * @param workspaceId - Workspace ID for scoped permission check
 * @returns boolean indicating if user has at least one permission in workspace
 */
export function useAnyWorkspacePermission(
  permissions: string[],
  workspaceId?: string,
): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  if (!workspaceId) {
    return checkAnyPermission(user, permissions);
  }

  if (isSuperAdmin(user)) return true;

  // Check workspace permissions from store
  if (typeof window !== "undefined") {
    const { usePermissionStore } = require("@/stores/permission-store");
    const store = usePermissionStore.getState();

    const wsPerms = store.workspacePermissions.get(workspaceId);
    if (wsPerms) {
      // Check if user has ANY of the permissions
      const hasAny = permissions.some((perm) =>
        wsPerms.permissions.includes(perm),
      );
      if (hasAny) return true;
    }
  }

  // Fallback to global permissions
  return checkAnyPermission(user, permissions);
}

/**
 * Hook to check if user has all workspace-scoped permissions
 *
 * Checks permissions from workspace permission store.
 *
 * @param permissions - Array of permission strings
 * @param workspaceId - Workspace ID for scoped permission check
 * @returns boolean indicating if user has all permissions in workspace
 */
export function useAllWorkspacePermissions(
  permissions: string[],
  workspaceId?: string,
): boolean {
  const { data: session } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  if (!workspaceId) {
    return checkAllPermissions(user, permissions);
  }

  if (isSuperAdmin(user)) return true;

  // Check workspace permissions from store
  if (typeof window !== "undefined") {
    const { usePermissionStore } = require("@/stores/permission-store");
    const store = usePermissionStore.getState();

    const wsPerms = store.workspacePermissions.get(workspaceId);
    if (wsPerms) {
      // Check if user has ALL of the permissions
      const hasAll = permissions.every((perm) =>
        wsPerms.permissions.includes(perm),
      );
      if (hasAll) return true;
    }
  }

  // Fallback to global permissions
  return checkAllPermissions(user, permissions);
}
