/**
 * Permission and role checking utilities
 */

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  role?: string;
  permissions?: string[];
}

/**
 * Check if user has a specific permission
 */
export function checkPermission(
  user: UserWithPermissions | null,
  permission: string,
): boolean {
  if (!user) return false;
  if (!user.permissions) return false;

  return user.permissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function checkAnyPermission(
  user: UserWithPermissions | null,
  permissions: string[],
): boolean {
  if (!user) return false;
  if (!user.permissions || user.permissions.length === 0) return false;
  if (permissions.length === 0) return false;

  return permissions.some((permission) =>
    user.permissions?.includes(permission),
  );
}

/**
 * Check if user has ALL of the specified permissions
 */
export function checkAllPermissions(
  user: UserWithPermissions | null,
  permissions: string[],
): boolean {
  if (!user) return false;
  if (!user.permissions || user.permissions.length === 0) return false;
  if (permissions.length === 0) return false;

  return permissions.every((permission) =>
    user.permissions?.includes(permission),
  );
}

/**
 * Check if user has a specific role
 */
export function checkRole(
  user: UserWithPermissions | null,
  role: string,
): boolean {
  if (!user) return false;
  if (!user.role) return false;

  return user.role === role;
}

/**
 * Check if user has ANY of the specified roles
 */
export function checkAnyRole(
  user: UserWithPermissions | null,
  roles: string[],
): boolean {
  if (!user) return false;
  if (!user.role) return false;
  if (roles.length === 0) return false;

  return roles.includes(user.role);
}

/**
 * Common role constants
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  DEVELOPER: "developer",
  VIEWER: "viewer",
  USER: "user",
  GUEST: "guest",
} as const;

/**
 * Common permission constants
 * These should match backend permission definitions
 */
export const PERMISSIONS = {
  // User management
  USER_CREATE: "user.create",
  USER_READ: "user.read",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",

  // Role management
  ROLE_CREATE: "role.create",
  ROLE_READ: "role.read",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",

  // Permission management
  PERMISSION_CREATE: "permission.create",
  PERMISSION_READ: "permission.read",
  PERMISSION_UPDATE: "permission.update",
  PERMISSION_DELETE: "permission.delete",

  // Workspace management
  WORKSPACE_CREATE: "workspace.create",
  WORKSPACE_READ: "workspace.read",
  WORKSPACE_UPDATE: "workspace.update",
  WORKSPACE_DELETE: "workspace.delete",

  // System administration
  SYSTEM_SETTINGS_READ: "system.settings.read",
  SYSTEM_SETTINGS_UPDATE: "system.settings.update",
  SYSTEM_AUDIT_LOG_READ: "system.audit_log.read",
} as const;

/**
 * Check if user is admin (either super_admin or admin role)
 */
export function isAdmin(user: UserWithPermissions | null): boolean {
  return checkAnyRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: UserWithPermissions | null): boolean {
  return checkRole(user, ROLES.SUPER_ADMIN);
}
