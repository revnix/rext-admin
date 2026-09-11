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

  // Subscription actions (canonical past-tense)
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_UPGRADED: "subscription.upgraded",
  SUBSCRIPTION_DOWNGRADED: "subscription.downgraded",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  SUBSCRIPTION_RESUMED: "subscription.resumed",
  SUBSCRIPTION_PAUSED: "subscription.paused",
  SUBSCRIPTION_EXPIRED: "subscription.expired",
  SUBSCRIPTION_RENEWED: "subscription.renewed",

  // Subscription legacy aliases
  SUBSCRIPTION_CREATE: "subscription.create",
  SUBSCRIPTION_UPGRADE: "subscription.upgrade",
  SUBSCRIPTION_CANCEL: "subscription.cancel",

  // Payment actions
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_RECOVERED: "payment.recovered",
  PAYMENT_REFUNDED: "payment.refunded",

  // Refund actions
  REFUND_REQUESTED: "refund.requested",
  REFUND_APPROVED: "refund.approved",
  REFUND_REJECTED: "refund.rejected",
  REFUND_PROCESSED: "refund.processed",
  REFUND_FAILED: "refund.failed",
  REFUND_CANCELLED: "refund.cancelled",

  // Admin actions
  ADMIN_REFUND_CREATED: "admin.refund_created",
  ADMIN_SUBSCRIPTION_EXTENDED: "admin.subscription_extended",
  ADMIN_SUBSCRIPTION_CANCELLED: "admin.subscription_cancelled",
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
  PAYMENT: "payment",
  REFUND: "refund",
  CHECKOUT: "checkout",
  LICENSE: "license",
  WEBHOOK: "webhook",
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
    // Subscription
    "subscription.created": "Subscription Created",
    "subscription.create": "Subscription Created",
    "subscription.updated": "Subscription Updated",
    "subscription.update": "Subscription Updated",
    "subscription.upgraded": "Subscription Upgraded",
    "subscription.upgrade": "Subscription Upgraded",
    "subscription.downgraded": "Subscription Downgraded",
    "subscription.downgrade": "Subscription Downgraded",
    "subscription.cancelled": "Subscription Cancelled",
    "subscription.cancel": "Subscription Cancelled",
    "subscription.resumed": "Subscription Resumed",
    "subscription.resume": "Subscription Resumed",
    "subscription.paused": "Subscription Paused",
    "subscription.pause": "Subscription Paused",
    "subscription.expired": "Subscription Expired",
    "subscription.renewed": "Subscription Renewed",
    // Payment
    "payment.succeeded": "Payment Succeeded",
    "payment.failed": "Payment Failed",
    "payment.recovered": "Payment Recovered",
    "payment.refunded": "Payment Refunded",
    // Refund
    "refund.requested": "Refund Requested",
    "refund.approved": "Refund Approved",
    "refund.rejected": "Refund Rejected",
    "refund.processed": "Refund Processed",
    "refund.failed": "Refund Failed",
    "refund.cancelled": "Refund Cancelled",
    // Admin
    "admin.refund_created": "Admin Refund Created",
    "admin.subscription_extended": "Subscription Extended",
    "admin.subscription_cancelled": "Subscription Cancelled (Admin)",
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
    action.includes("revoke") ||
    action.includes("failed") ||
    action.includes("reject")
  ) {
    return "destructive";
  }
  if (
    action.includes("create") ||
    action.includes("login") ||
    action.includes("activate") ||
    action.includes("succeeded") ||
    action.includes("approved") ||
    action.includes("recovered") ||
    action.includes("resumed")
  ) {
    return "default";
  }
  if (
    action.includes("update") ||
    action.includes("change") ||
    action.includes("upgraded") ||
    action.includes("upgrade") ||
    action.includes("renewed") ||
    action.includes("processed")
  ) {
    return "secondary";
  }
  return "outline";
}
