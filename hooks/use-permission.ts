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
import { usePermissionStore } from "@/stores/permission-store";

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
 * **BREAKING CHANGE (Phase 2):** Now returns an object with `hasPermission` and `isLoading`
 * to prevent permission flash during initial load.
 *
 * @param permission - Permission string to check
 * @param workspaceId - Workspace ID for scoped permission check
 * @returns Object with hasPermission (boolean) and isLoading (boolean)
 *
 * @example
 * // OLD (deprecated):
 * const canManage = useWorkspacePermission("workspace.update", workspaceId);
 *
 * @example
 * // NEW (Phase 2):
 * const { hasPermission: canManage, isLoading } = useWorkspacePermission("workspace.update", workspaceId);
 * if (isLoading) return <Skeleton />;
 * if (!canManage) return <AccessDenied />;
 */
export function useWorkspacePermission(
  permission: string,
  workspaceId?: string,
): { hasPermission: boolean; isLoading: boolean } {
  const { data: session, status } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  // Subscribe to workspace permissions store (reactive)
  const workspacePermissions = usePermissionStore(
    (state) => state.workspacePermissions,
  );
  const isWorkspaceLoading = usePermissionStore(
    (state) => state.isWorkspaceLoading,
  );

  // Session still loading
  const isSessionLoading = status === "loading";

  // If no workspace ID, fall back to global permission check
  if (!workspaceId) {
    return {
      hasPermission: checkPermission(user, permission),
      isLoading: isSessionLoading,
    };
  }

  // Check if workspace permissions are currently loading
  const isLoadingPermissions = isWorkspaceLoading(workspaceId);

  // Super admin has all permissions (no loading needed)
  if (isSuperAdmin(user)) {
    return { hasPermission: true, isLoading: false };
  }

  // Check workspace-specific permissions from store (reactive)
  const wsPerms = workspacePermissions.get(workspaceId);

  // If permissions not loaded yet and still loading, indicate loading state
  if (!wsPerms && isLoadingPermissions) {
    return { hasPermission: false, isLoading: true };
  }

  // Permissions loaded (or failed to load), check permission
  const hasPermission =
    wsPerms?.permissions.includes(permission) ||
    checkPermission(user, permission); // Fallback to global

  return { hasPermission, isLoading: false };
}

/**
 * Hook to check if user has any workspace-scoped permissions
 *
 * Checks permissions from workspace permission store.
 *
 * **BREAKING CHANGE (Phase 2):** Now returns an object with `hasPermission` and `isLoading`
 *
 * @param permissions - Array of permission strings
 * @param workspaceId - Workspace ID for scoped permission check
 * @returns Object with hasPermission (boolean) and isLoading (boolean)
 */
export function useAnyWorkspacePermission(
  permissions: string[],
  workspaceId?: string,
): { hasPermission: boolean; isLoading: boolean } {
  const { data: session, status } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  // Subscribe to workspace permissions store (reactive)
  const workspacePermissions = usePermissionStore(
    (state) => state.workspacePermissions,
  );
  const isWorkspaceLoading = usePermissionStore(
    (state) => state.isWorkspaceLoading,
  );

  const isSessionLoading = status === "loading";

  if (!workspaceId) {
    return {
      hasPermission: checkAnyPermission(user, permissions),
      isLoading: isSessionLoading,
    };
  }

  const isLoadingPermissions = isWorkspaceLoading(workspaceId);

  if (isSuperAdmin(user)) {
    return { hasPermission: true, isLoading: false };
  }

  // Check workspace permissions from store (reactive)
  const wsPerms = workspacePermissions.get(workspaceId);

  // If permissions not loaded yet and still loading, indicate loading state
  if (!wsPerms && isLoadingPermissions) {
    return { hasPermission: false, isLoading: true };
  }

  // Check if user has ANY of the permissions
  const hasPermission =
    (wsPerms &&
      permissions.some((perm) => wsPerms.permissions.includes(perm))) ||
    checkAnyPermission(user, permissions); // Fallback to global

  return { hasPermission, isLoading: false };
}

/**
 * Hook to check if user has all workspace-scoped permissions
 *
 * Checks permissions from workspace permission store.
 *
 * **BREAKING CHANGE (Phase 2):** Now returns an object with `hasPermission` and `isLoading`
 *
 * @param permissions - Array of permission strings
 * @param workspaceId - Workspace ID for scoped permission check
 * @returns Object with hasPermission (boolean) and isLoading (boolean)
 */
export function useAllWorkspacePermissions(
  permissions: string[],
  workspaceId?: string,
): { hasPermission: boolean; isLoading: boolean } {
  const { data: session, status } = useSession();
  const user = sessionUserToPermissionUser(session?.user);

  // Subscribe to workspace permissions store (reactive)
  const workspacePermissions = usePermissionStore(
    (state) => state.workspacePermissions,
  );
  const isWorkspaceLoading = usePermissionStore(
    (state) => state.isWorkspaceLoading,
  );

  const isSessionLoading = status === "loading";

  if (!workspaceId) {
    return {
      hasPermission: checkAllPermissions(user, permissions),
      isLoading: isSessionLoading,
    };
  }

  const isLoadingPermissions = isWorkspaceLoading(workspaceId);

  if (isSuperAdmin(user)) {
    return { hasPermission: true, isLoading: false };
  }

  // Check workspace permissions from store (reactive)
  const wsPerms = workspacePermissions.get(workspaceId);

  // If permissions not loaded yet and still loading, indicate loading state
  if (!wsPerms && isLoadingPermissions) {
    return { hasPermission: false, isLoading: true };
  }

  // Check if user has ALL of the permissions
  const hasPermission =
    (wsPerms &&
      permissions.every((perm) => wsPerms.permissions.includes(perm))) ||
    checkAllPermissions(user, permissions); // Fallback to global

  return { hasPermission, isLoading: false };
}
