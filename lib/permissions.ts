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
 * Permission constants matching backend RBAC system
 * Format: resource.action (e.g., user.read, content.create)
 *
 * IMPORTANT: Must use dot notation to match backend database schema
 */

// User Management
export const USER_PERMISSIONS = {
  READ: "user.read",
  CREATE: "user.create",
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
  MANAGE_MEMBERS: "workspace.manage_members",
  MANAGE_SETTINGS: "workspace.manage_settings",
} as const;

// Content Management
export const CONTENT_PERMISSIONS = {
  CREATE: "content.create",
  READ: "content.read",
  UPDATE: "content.update",
  DELETE: "content.delete",
  PUBLISH: "content.publish",
  MANAGE_WORKFLOW: "content.manage_workflow",
} as const;

// Topic Management
export const TOPIC_PERMISSIONS = {
  CREATE: "topic.create",
  READ: "topic.read",
  UPDATE: "topic.update",
  DELETE: "topic.delete",
  MANAGE: "topic.manage",
} as const;

// Knowledge Base
export const KNOWLEDGE_PERMISSIONS = {
  CREATE: "knowledge.create",
  READ: "knowledge.read",
  UPDATE: "knowledge.update",
  DELETE: "knowledge.delete",
  MANAGE: "knowledge.manage",
} as const;

// Subscription Management
export const SUBSCRIPTION_PERMISSIONS = {
  READ: "subscription.read",
  CREATE: "subscription.create",
  UPDATE: "subscription.update",
  CANCEL: "subscription.cancel",
  ANALYTICS: "subscription.analytics",
} as const;

// Media Management
export const MEDIA_PERMISSIONS = {
  UPLOAD: "media.create", // 'create' = upload in backend
  READ: "media.view", // 'view' = read in backend
  UPDATE: "media.update",
  DELETE: "media.delete",
} as const;

// Member Management
export const MEMBER_PERMISSIONS = {
  READ: "member.read",
  UPDATE: "member.update",
  UPDATE_ROLE: "member.update_role",
  INVITE: "member.invite",
  REMOVE: "member.remove",
  RESEND_INVITATION: "member.resend_invitation",
  REVOKE_INVITATION: "member.revoke_invitation",
} as const;

// System/Admin
export const ADMIN_PERMISSIONS = {
  ROLE_READ: "role.read",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",
  AUDIT_READ: "audit.read",
  SYSTEM_MANAGE: "system.manage",
} as const;

// Legacy permission constants (deprecated, use resource-specific ones above)
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
 * Helper to get all permissions for a category
 */
export const ALL_PERMISSIONS = {
  USER: Object.values(USER_PERMISSIONS),
  WORKSPACE: Object.values(WORKSPACE_PERMISSIONS),
  CONTENT: Object.values(CONTENT_PERMISSIONS),
  TOPIC: Object.values(TOPIC_PERMISSIONS),
  KNOWLEDGE: Object.values(KNOWLEDGE_PERMISSIONS),
  SUBSCRIPTION: Object.values(SUBSCRIPTION_PERMISSIONS),
  MEDIA: Object.values(MEDIA_PERMISSIONS),
  ADMIN: Object.values(ADMIN_PERMISSIONS),
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
