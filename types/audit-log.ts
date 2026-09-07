/**
 * Audit Log Types
 *
 * TypeScript interfaces for audit logging and activity tracking.
 * Corresponds to backend audit log API responses.
 */

/**
 * Audit log entry from backend
 */
export interface AuditLog {
  id: string;
  user_id: string | null;
  full_name: string | null;
  user_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  workspace_id: string | null;
  workspace_name?: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  status: "success" | "failed" | "partial";
  created_at: string; // ISO 8601
}

/**
 * Detailed audit log with change tracking
 */
export interface AuditLogDetail extends AuditLog {
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
}

/**
 * Audit log list response from backend
 */
export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  action?: string;
  resource_type?: string;
  status?: string; // "success" | "failed" | "partial"
  date_from?: string; // ISO 8601
  date_to?: string; // ISO 8601
  limit?: number;
  offset?: number;
}

/**
 * Common audit action types
 */
export const AuditActions = {
  // User actions
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  USER_SUSPEND: "user.suspend",
  USER_ACTIVATE: "user.activate",
  USER_BAN: "user.ban",
  USER_DEACTIVATE: "user.deactivate",

  // Authentication actions
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_PASSWORD_RESET: "auth.password_reset",
  AUTH_PASSWORD_CHANGE: "auth.password_change",

  // Role actions
  ROLE_ASSIGN: "role.assign",
  ROLE_REVOKE: "role.revoke",

  // Workspace actions
  WORKSPACE_CREATE: "workspace.create",
  WORKSPACE_UPDATE: "workspace.update",
  WORKSPACE_DELETE: "workspace.delete",

  // Invitation actions
  INVITATION_CREATE: "invitation.create",
  INVITATION_ACCEPT: "invitation.accept",
  INVITATION_REVOKE: "invitation.revoke",

  // Subscription actions
  SUBSCRIPTION_CREATE: "subscription.create",
  SUBSCRIPTION_UPGRADE: "subscription.upgrade",
  SUBSCRIPTION_CANCEL: "subscription.cancel",
} as const;

/**
 * Resource types for filtering
 */
export const AuditResourceTypes = {
  USER: "user",
  ROLE: "role",
  PERMISSION: "permission",
  WORKSPACE: "workspace",
  INVITATION: "invitation",
  SUBSCRIPTION: "subscription",
  SESSION: "session",
} as const;

/**
 * Helper to get human-readable action name
 */
export function getActionDisplayName(action: string): string {
  const actionMap: Record<string, string> = {
    "user.create": "Account Created",
    "user.update": "Profile Updated",
    "user.delete": "User Deleted",
    "user.suspend": "User Suspended",
    "user.activate": "User Activated",
    "user.ban": "User Banned",
    "user.deactivate": "User Deactivated",
    "auth.login": "Login",
    "auth.logout": "Logout",
    "auth.password_reset": "Password Reset",
    "auth.password_change": "Password Changed",
    "role.assign": "Role Assigned",
    "role.revoke": "Role Revoked",
    "workspace.create": "Workspace Created",
    "workspace.update": "Workspace Updated",
    "workspace.delete": "Workspace Deleted",
    "invitation.create": "Invitation Sent",
    "invitation.accept": "Invitation Accepted",
    "invitation.revoke": "Invitation Revoked",
    "subscription.create": "Subscription Created",
    "subscription.upgrade": "Subscription Upgraded",
    "subscription.cancel": "Subscription Cancelled",
  };

  return actionMap[action] || action;
}

/**
 * Helper to get action color variant
 */
export function getActionVariant(
  action: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (
    action.includes("delete") ||
    action.includes("ban") ||
    action.includes("suspend") ||
    action.includes("revoke")
  ) {
    return "destructive";
  }
  if (
    action.includes("create") ||
    action.includes("login") ||
    action.includes("activate")
  ) {
    return "default";
  }
  if (action.includes("update") || action.includes("change")) {
    return "secondary";
  }
  return "outline";
}
