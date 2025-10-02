"use client";

import type { ReactNode } from "react";
import {
  useAllPermissions,
  useAnyPermission,
  useAnyRole,
  usePermission,
  useRole,
} from "@/hooks/use-permission";

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
 * // Show button only if user has "user:create" permission
 * <CanAccess permission="user:create">
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
 * <CanAccess permission="user:delete" fallback={<p>No access</p>}>
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
  // Check permissions
  const hasSinglePermission = usePermission(permission || "");
  const hasAnyPermission = useAnyPermission(anyPermission || []);
  const hasAllPermissions = useAllPermissions(allPermissions || []);

  // Check roles
  const hasSingleRole = useRole(role || "");
  const hasAnyRole = useAnyRole(anyRole || []);

  // Determine if user has access based on provided props
  let hasAccess = false;

  if (permission) {
    hasAccess = hasSinglePermission;
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission;
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions;
  } else if (role) {
    hasAccess = hasSingleRole;
  } else if (anyRole && anyRole.length > 0) {
    hasAccess = hasAnyRole;
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
