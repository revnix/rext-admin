"use client";

import { isValidElement, type ReactElement, type ReactNode } from "react";
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
  /** Single permission to check */
  permission?: string;
  /** Array of permissions - user must have ANY of them */
  anyPermission?: string[];
  /** Array of permissions - user must have ALL of them */
  allPermissions?: string[];
  /** Single role to check */
  role?: string;
  /** Array of roles - user must have ANY of them */
  anyRole?: string[];
  /** Content to render if user has access */
  children: ReactNode;
  /** Content to render if user doesn't have access */
  fallback?: ReactNode;
  /** Invert the check (show content if user DOESN'T have access) */
  invert?: boolean;
  /** Show a tooltip instead of hiding restricted elements */
  showLockedTooltip?: boolean;
  /** Custom tooltip message */
  tooltipMessage?: string;
  /** Show lock icon next to disabled element */
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
  const workspaceContext = useWorkspaceOptional();
  const workspaceId =
    workspaceContext?.workspaceSlug || workspaceContext?.workspaceId;
  const isWorkspaceContext = Boolean(workspaceId);

  // === 1️⃣ Determine workspace and global permission states ===
  const singleWorkspace = useWorkspacePermission(permission || "", workspaceId);
  const anyWorkspace = useAnyWorkspacePermission(anyPermission || [], workspaceId);
  const allWorkspace = useAllWorkspacePermissions(allPermissions || [], workspaceId);

  const singleGlobal = usePermission(permission || "");
  const anyGlobal = useAnyPermission(anyPermission || []);
  const allGlobal = useAllPermissions(allPermissions || []);

  const roleCheck = useRole(role || "");
  const anyRoleCheck = useAnyRole(anyRole || []);

  // Determine if user has access and if still loading
  let hasAccess = false;
  let isLoading = false;

  if (permission) {
    hasAccess = isWorkspaceContext ? singleWorkspace.hasPermission : singleGlobal;
    isLoading = isWorkspaceContext ? singleWorkspace.isLoading : false;
  } else if (anyPermission?.length) {
    hasAccess = isWorkspaceContext ? anyWorkspace.hasPermission : anyGlobal;
    isLoading = isWorkspaceContext ? anyWorkspace.isLoading : false;
  } else if (allPermissions?.length) {
    hasAccess = isWorkspaceContext ? allWorkspace.hasPermission : allGlobal;
    isLoading = isWorkspaceContext ? allWorkspace.isLoading : false;
  } else if (role) {
    hasAccess = roleCheck;
  } else if (anyRole?.length) {
    hasAccess = anyRoleCheck;
  }

  // Show loading state while permissions are being fetched (prevent flash of unauthorized content)
  if (isLoading) {
    // Return nothing or fallback while permissions load — avoids flash of Access Denied
    return fallback ? <>{fallback}</> : null;
  }

  // Apply invert logic
  if (invert) {
    hasAccess = !hasAccess;
  }

  // Render based on access
  if (hasAccess) {
    return <>{children}</>;
  }

  // === 6️⃣ Handle locked tooltip display ===
  if (showLockedTooltip && !fallback && isValidElement(children)) {
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

  return <>{fallback}</>;
}
