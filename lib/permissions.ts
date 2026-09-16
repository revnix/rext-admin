import type { UserWithPermissions } from "@/types/role";

/**
 * Check if user has a specific permission
 * Super admin has all permissions
 */
export function checkPermission(
  user: UserWithPermissions | null,
  permission: string,
): boolean {
  if (!user) return false;

  // Super admin bypass - has all permissions
  if (user.role === ROLES.SUPER_ADMIN) return true;

  if (!user.permissions) return false;

  return user.permissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 * Super admin has all permissions
 */
export function checkAnyPermission(
  user: UserWithPermissions | null,
  permissions: string[],
): boolean {
  if (!user) return false;

  // Super admin bypass - has all permissions
  if (user.role === ROLES.SUPER_ADMIN) return true;

  if (!user.permissions || user.permissions.length === 0) return false;
  if (permissions.length === 0) return false;

  return permissions.some((permission) =>
    user.permissions?.includes(permission),
  );
}

/**
 * Check if user has ALL of the specified permissions
 * Super admin has all permissions
 */
export function checkAllPermissions(
  user: UserWithPermissions | null,
  permissions: string[],
): boolean {
  if (!user) return false;

  // Super admin bypass - has all permissions
  if (user.role === ROLES.SUPER_ADMIN) return true;

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
  WORKSPACE_OWNER: "workspace_owner",
  WORKSPACE_ADMIN: "workspace_admin",
  EDITOR: "editor",
  VIEWER: "viewer",
  USER: "user",
} as const;

/**
 * Permission constants matching backend RBAC system
 * Format: resource.action (e.g., user.read, content.create)
 *
 * IMPORTANT: Must use dot notation to match backend database schema
 */

// User Management
export const USER_PERMISSIONS = {
  READ: "user.read",
  INVITE: "user.invite",
  UPDATE: "user.update",
  DELETE: "user.delete",
  MANAGE_ROLES: "user.manage_roles",
  IMPERSONATE: "user.impersonate",
} as const;

// Workspace Management
export const WORKSPACE_PERMISSIONS = {
  CREATE: "workspace.create",
  READ: "workspace.read",
  UPDATE: "workspace.update",
  DELETE: "workspace.delete",
} as const;

// Content Management
export const CONTENT_PERMISSIONS = {
  CREATE: "content.create",
  READ: "content.read",
  UPDATE: "content.update",
  DELETE: "content.delete",
  PUBLISH: "content.publish",
} as const;

// Member Management
export const MEMBER_PERMISSIONS = {
  READ: "member.read",
  UPDATE_ROLE: "member.update_role",
  INVITE: "member.invite",
  REMOVE: "member.remove",
} as const;

// Role Management
export const ROLE_PERMISSIONS = {
  READ: "role.read",
  CREATE: "role.create",
  UPDATE: "role.update",
  DELETE: "role.delete",
  MANAGE_PERMISSIONS: "role.manage_permissions",
} as const;

// Billing Management
export const BILLING_PERMISSIONS = {
  READ: "billing.read",
  MANAGE: "billing.manage",
} as const;

// Security
export const SECURITY_PERMISSIONS = {
  READ: "security.read",
  MANAGE: "security.manage",
} as const;

export const INTEGRATION_PERMISSIONS = {
  READ: "integration.read",
  CREATE: "integration.create",
  UPDATE: "integration.update",
  DELETE: "integration.delete",
} as const;

export const BRAND_VOICE_PERMISSIONS = {
  READ: "brand_voice.read",
  UPDATE: "brand_voice.update",
  DELETE: "brand_voice.delete",
} as const;

export const PERSONA_PERMISSIONS = {
  READ: "persona.read",
  CREATE: "persona.create",
  UPDATE: "persona.update",
  DELETE: "persona.delete",
} as const;

export const AUDIT_PERMISSIONS = {
  READ: "audit.read",
  EXPORT: "audit.export",
} as const;

/**
 * Helper to get all permissions for a category
 */
export const ALL_PERMISSIONS = {
  USER: Object.values(USER_PERMISSIONS),
  WORKSPACE: Object.values(WORKSPACE_PERMISSIONS),
  CONTENT: Object.values(CONTENT_PERMISSIONS),
  MEMBER: Object.values(MEMBER_PERMISSIONS),
  ROLE: Object.values(ROLE_PERMISSIONS),
  BILLING: Object.values(BILLING_PERMISSIONS),
  SECURITY: Object.values(SECURITY_PERMISSIONS),
  INTEGRATION: Object.values(INTEGRATION_PERMISSIONS),
  BRAND_VOICE: Object.values(BRAND_VOICE_PERMISSIONS),
  PERSONA: Object.values(PERSONA_PERMISSIONS),
  AUDIT: Object.values(AUDIT_PERMISSIONS),
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

/**
 * Standard workspace roles the backend refuses to update or delete.
 *
 * Mirrors `RoleService.PROTECTED_WORKSPACE_ROLES` in rext-backend
 * (src/services/role_service.py). These roles carry `is_system_role = false`,
 * so checking that flag alone lets the UI offer Edit/Delete on roles the API
 * will always reject. Matched by name, not by `is_workspace_role` — that flag
 * is also true for user-created workspace roles, which are not protected.
 */
export const PROTECTED_WORKSPACE_ROLES = new Set([
  "workspace_owner",
  "workspace_admin",
  "editor",
  "viewer",
]);

/**
 * Whether a role is protected from modification or deletion by the backend.
 */
export function isProtectedRole(role: {
  name: string;
  is_system_role: boolean;
}): boolean {
  return role.is_system_role || PROTECTED_WORKSPACE_ROLES.has(role.name);
}
