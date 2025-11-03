"use client";

import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
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

  /**
   * Show a tooltip with permission info when access is denied
   * instead of hiding the element entirely. The element will be disabled.
   */
  showLockedTooltip?: boolean;

  /**
   * Custom tooltip message when locked
   */
  tooltipMessage?: string;

  /**
   * Show lock icon next to disabled element
   */
  showLockIcon?: boolean;
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
 *
 * @example
 * // Show disabled button with tooltip when locked
 * <CanAccess permission="content.delete" showLockedTooltip>
 *   <Button>Delete</Button>
 * </CanAccess>
 *
 * @example
 * // Show custom tooltip message
 * <CanAccess
 *   permission="workspace.manage_billing"
 *   showLockedTooltip
 *   tooltipMessage="Upgrade to Pro to access billing"
 *   showLockIcon
 * >
 *   <Button>Manage Billing</Button>
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
  showLockedTooltip = false,
  tooltipMessage,
  showLockIcon = false,
}: CanAccessProps) {
  // Get workspace context (if in workspace route)
  const workspaceContext = useWorkspaceOptional();
  const workspaceId =
    workspaceContext?.workspaceSlug || workspaceContext?.workspaceId;

  // Check if we're in a workspace context
  const isWorkspaceContext = !!workspaceId;

  // Check workspace permissions (if in workspace context)
  // Phase 2: These now return {hasPermission, isLoading}
  const singleWorkspaceResult = useWorkspacePermission(
    permission || "",
    workspaceId,
  );
  const anyWorkspaceResult = useAnyWorkspacePermission(
    anyPermission || [],
    workspaceId,
  );
  const allWorkspaceResult = useAllWorkspacePermissions(
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

  // Determine if user has access and if still loading
  let hasAccess = false;
  let isLoading = false;

  if (permission) {
    // Use workspace permissions if in workspace context, otherwise use global
    if (isWorkspaceContext) {
      hasAccess = singleWorkspaceResult.hasPermission;
      isLoading = singleWorkspaceResult.isLoading;
    } else {
      hasAccess = hasSingleGlobalPermission;
    }
  } else if (anyPermission && anyPermission.length > 0) {
    if (isWorkspaceContext) {
      hasAccess = anyWorkspaceResult.hasPermission;
      isLoading = anyWorkspaceResult.isLoading;
    } else {
      hasAccess = hasAnyGlobalPermission;
    }
  } else if (allPermissions && allPermissions.length > 0) {
    if (isWorkspaceContext) {
      hasAccess = allWorkspaceResult.hasPermission;
      isLoading = allWorkspaceResult.isLoading;
    } else {
      hasAccess = hasAllGlobalPermissions;
    }
  } else if (role) {
    hasAccess = hasSingleRole;
  } else if (anyRole && anyRole.length > 0) {
    hasAccess = hasAnyRoleCheck;
  }

  // Show loading state while permissions are being fetched (prevent flash of unauthorized content)
  if (isLoading) {
    // Render fallback (e.g., Access Restricted card) or nothing while loading
    return <>{fallback || null}</>;
  }

  // Apply invert logic
  if (invert) {
    hasAccess = !hasAccess;
  }

  // Render based on access
  if (hasAccess) {
    return <>{children}</>;
  }

  // If showLockedTooltip is enabled and no custom fallback, show tooltip
  if (showLockedTooltip && !fallback) {
    // Only wrap if children is a single valid React element
    if (isValidElement(children)) {
      return (
        <LockedFeatureTooltip
          permission={permission || anyPermission?.[0]}
          message={tooltipMessage}
          showIcon={showLockIcon}
        >
          {children as ReactElement}
        </LockedFeatureTooltip>
      );
    }
    // If children is not a single element, fallback to hiding it
    return null;
  }

  return <>{fallback}</>;
}
