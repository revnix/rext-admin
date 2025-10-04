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
 * const canCreateUser = usePermission("user:create");
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
 * const canManageUsers = useAnyPermission(["user:create", "user:update", "user:delete"]);
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
 * const canFullyManageRoles = useAllPermissions(["role:create", "role:update", "role:delete"]);
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
