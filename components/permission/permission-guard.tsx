"use client";

import type React from "react";
import {
  useAllPermissions,
  useAllWorkspacePermissions,
  useAnyPermission,
  useAnyWorkspacePermission,
  usePermission,
  useWorkspacePermission,
} from "@/hooks/use-permission";
import { useCurrentWorkspaceId } from "@/providers/workspace-permission-provider";

/**
 * Permission guard component props
 */
interface PermissionGuardProps {
  /** Single permission or array of permissions to check */
  permission: string | string[];
  /** If true, requires ALL permissions. If false, requires ANY permission (default: false) */
  requireAll?: boolean;
  /** Workspace ID for workspace-scoped permission checks */
  workspaceId?: string;
  /** Fallback content to show when permission is denied */
  fallback?: React.ReactNode;
  /** Children to render when permission is granted */
  children: React.ReactNode;
}

/**
 * Permission Guard Component
 *
 * Show/hide content based on user permissions.
 * By default, checks if user has ANY of the permissions.
 * Use `requireAll={true}` to check if user has ALL permissions.
 *
 * @example
 * // Single permission
 * <PermissionGuard permission="user:delete">
 *   <DeleteButton />
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions (ANY)
 * <PermissionGuard permission={["content:update", "content:publish"]}>
 *   <EditButton />
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions (ALL required)
 * <PermissionGuard
 *   permission={["content:update", "content:publish"]}
 *   requireAll={true}
 * >
 *   <PublishButton />
 * </PermissionGuard>
 *
 * @example
 * // With fallback
 * <PermissionGuard
 *   permission="user:delete"
 *   fallback={<p>You don't have permission to delete users</p>}
 * >
 *   <DeleteButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  workspaceId: propWorkspaceId,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const permissions = Array.isArray(permission) ? permission : [permission];

  // Get workspace ID from context (if in workspace route) or props
  const contextWorkspaceId = useCurrentWorkspaceId();
  const effectiveWorkspaceId = propWorkspaceId || contextWorkspaceId;

  // Choose workspace or global permission hooks based on workspace presence
  const useWorkspaceHooks = !!effectiveWorkspaceId;

  // Check permissions based on workspace context and requireAll flag
  const hasSingleGlobalPermission = usePermission(permissions[0]);
  const hasAnyGlobalPermission = useAnyPermission(permissions);
  const hasAllGlobalPermissions = useAllPermissions(permissions);

  const hasSingleWorkspacePermission = useWorkspacePermission(
    permissions[0],
    effectiveWorkspaceId,
  );
  const hasAnyWorkspacePermission = useAnyWorkspacePermission(
    permissions,
    effectiveWorkspaceId,
  );
  const hasAllWorkspacePermissions = useAllWorkspacePermissions(
    permissions,
    effectiveWorkspaceId,
  );

  // Determine if user has required permissions
  let hasAccess = false;

  if (useWorkspaceHooks) {
    // Use workspace-scoped permission checks
    if (permissions.length === 1) {
      hasAccess = hasSingleWorkspacePermission;
    } else if (requireAll) {
      hasAccess = hasAllWorkspacePermissions;
    } else {
      hasAccess = hasAnyWorkspacePermission;
    }
  } else {
    // Use global permission checks
    if (permissions.length === 1) {
      hasAccess = hasSingleGlobalPermission;
    } else if (requireAll) {
      hasAccess = hasAllGlobalPermissions;
    } else {
      hasAccess = hasAnyGlobalPermission;
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
