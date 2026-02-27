"use client";

import { isValidElement, type ReactElement, type ReactNode } from "react";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import {
  useAnyRole,
  usePermissionDecision,
  useRole,
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
 * ✅ Fixed CanAccess Component
 * - Hooks always called at top level (no early return)
 * - Prevents flash while workspace is loading
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
    workspaceContext?.workspaceId || workspaceContext?.workspaceSlug;
  const isWorkspaceContext = Boolean(workspaceId);

  const decisionInput = permission
    ? { mode: "single" as const, permissions: [permission] }
    : anyPermission?.length
      ? { mode: "any" as const, permissions: anyPermission }
      : { mode: "all" as const, permissions: allPermissions || [] };

  const { hasAccess: permissionAccess, isLoading: permissionLoading } =
    usePermissionDecision({
      ...decisionInput,
      workspaceId: isWorkspaceContext ? workspaceId : undefined,
    });

  const roleCheck = useRole(role || "");
  const anyRoleCheck = useAnyRole(anyRole || []);

  // === Handle early states (after hooks) ===
  if (
    workspaceContext &&
    !workspaceContext.workspaceId &&
    !workspaceContext.workspaceSlug
  ) {
    return null; // Prevent flash while workspace loading
  }

  // === Access logic ===
  let hasAccess = false;
  let isLoading = false;

  if (permission || anyPermission?.length || allPermissions?.length) {
    hasAccess = permissionAccess;
    isLoading = permissionLoading;
  } else if (role) {
    hasAccess = roleCheck;
  } else if (anyRole?.length) {
    hasAccess = anyRoleCheck;
  }

  // Prevent render until permissions are ready
  if (isLoading) return null;

  if (invert) hasAccess = !hasAccess;

  if (hasAccess) return <>{children}</>;

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
