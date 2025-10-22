"use client";

import type { ReactNode } from "react";
import {
  useAllPermissions,
  useAllWorkspacePermissions,
  useAnyPermission,
  useAnyRole,
  useAnyWorkspacePermission,
  usePermission,
  useRole,
  useWorkspacePermission,
} from "@/hooks/use-permission";
import { useWorkspaceOptional } from "@/providers/workspace-provider";

interface CanAccessProps {
  /**
   * Single permission to check
   */
  permission?: string;

  /**
   * Array of permissions - user must have ANY of them
   */
  anyPermission?: string[];

  /**
   * Array of permissions - user must have ALL of them
   */
  allPermissions?: string[];

  /**
   * Single role to check
   */
  role?: string;

  /**
   * Array of roles - user must have ANY of them
   */
  anyRole?: string[];

  /**
   * Content to render if user has access
   */
  children: ReactNode;

  /**
   * Content to render if user doesn't have access (default: null)
   */
  fallback?: ReactNode;

  /**
   * Invert the check (show content if user DOESN'T have permission/role)
   */
  invert?: boolean;
}

/**
 * Wrapper component for conditional rendering based on permissions or roles
 *
 * @example
 * // Show button only if user has "user.create" permission
 * <CanAccess permission="user.create">
 *   <Button>Create User</Button>
 * </CanAccess>
 *
 * @example
 * // Show content if user has admin OR manager role
 * <CanAccess anyRole={["admin", "manager"]}>
 *   <AdminPanel />
 * </CanAccess>
 *
 * @example
 * // Show fallback if user doesn't have permission
 * <CanAccess permission="user.delete" fallback={<p>No access</p>}>
 *   <DeleteButton />
 * </CanAccess>
 *
 * @example
 * // Show content if user does NOT have admin role
 * <CanAccess role="admin" invert>
 *   <p>You are not an admin</p>
 * </CanAccess>
 */
export function CanAccess({
  permission,
  anyPermission,
  allPermissions,
  role,
  anyRole,
  children,
  fallback = null,
  invert = false,
}: CanAccessProps) {
  // Get workspace context (if in workspace route)
  const workspaceContext = useWorkspaceOptional();
  const workspaceId =
    workspaceContext?.workspaceSlug || workspaceContext?.workspaceId;

  // Check if we're in a workspace context
  const isWorkspaceContext = !!workspaceId;

  // Check workspace permissions (if in workspace context)
  const hasSingleWorkspacePermission = useWorkspacePermission(
    permission || "",
    workspaceId,
  );
  const hasAnyWorkspacePermission = useAnyWorkspacePermission(
    anyPermission || [],
    workspaceId,
  );
  const hasAllWorkspacePermissions = useAllWorkspacePermissions(
    allPermissions || [],
    workspaceId,
  );

  // Check global permissions (fallback or when not in workspace)
  const hasSingleGlobalPermission = usePermission(permission || "");
  const hasAnyGlobalPermission = useAnyPermission(anyPermission || []);
  const hasAllGlobalPermissions = useAllPermissions(allPermissions || []);

  // Check roles
  const hasSingleRole = useRole(role || "");
  const hasAnyRoleCheck = useAnyRole(anyRole || []);

  // Determine if user has access based on provided props
  let hasAccess = false;

  if (permission) {
    // Use workspace permissions if in workspace context, otherwise use global
    hasAccess = isWorkspaceContext
      ? hasSingleWorkspacePermission
      : hasSingleGlobalPermission;
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = isWorkspaceContext
      ? hasAnyWorkspacePermission
      : hasAnyGlobalPermission;
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = isWorkspaceContext
      ? hasAllWorkspacePermissions
      : hasAllGlobalPermissions;
  } else if (role) {
    hasAccess = hasSingleRole;
  } else if (anyRole && anyRole.length > 0) {
    hasAccess = hasAnyRoleCheck;
  }

  // Apply invert logic
  if (invert) {
    hasAccess = !hasAccess;
  }

  // Render based on access
  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
