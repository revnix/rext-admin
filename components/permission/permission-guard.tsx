import type React from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  useAnyRole,
  usePermissionDecision,
  useRole,
} from "@/hooks/use-permission";
import { useCurrentWorkspaceId } from "@/providers/workspace-permission-provider";
import { useWorkspaceOptional } from "@/providers/workspace-provider";
import { LockedFeatureTooltip } from "./locked-feature-tooltip";
import { PermissionLoading } from "./permission-loading";
import { isValidElement } from "react";

/**
 * Permission guard component props
 */
interface PermissionGuardProps {
  permission?: string | string[];
  anyPermission?: string[];
  allPermissions?: string[];
  role?: string;
  anyRole?: string[];
  requireAll?: boolean;
  workspaceId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  invert?: boolean;
  showLoading?: boolean;
  loadingVariant?: "skeleton" | "spinner" | "minimal";
  /** Custom loading message */
  loadingMessage?: string;
  showTooltip?: boolean;
  tooltipMessage?: string;
  requiredRole?: string;
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
 * <PermissionGuard permission="user.delete">
 *   <DeleteButton />
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions (ANY)
 * <PermissionGuard permission={["content.update", "content.publish"]}>
 *   <EditButton />
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions (ALL required)
 * <PermissionGuard
 *   permission={["content.update", "content.publish"]}
 *   requireAll={true}
 * >
 *   <PublishButton />
 * </PermissionGuard>
 *
 * @example
 * // With fallback
 * <PermissionGuard
 *   permission="user.delete"
 *   fallback={<p>You don't have permission to delete users</p>}
 * >
 *   <DeleteButton />
 * </PermissionGuard>
 *
 * @example
 * // With loading state
 * <PermissionGuard
 *   permission="content.update"
 *   showLoading
 *   loadingVariant="spinner"
 *   loadingMessage="Checking permissions..."
 * >
 *   <EditButton />
 * </PermissionGuard>
 *
 * @example
 * // With tooltip (shows disabled button with tooltip explaining why)
 * <PermissionGuard
 *   permission="content.delete"
 *   showTooltip
 *   fallback={<Button>Delete</Button>}
 * >
 *   <Button>Delete</Button>
 * </PermissionGuard>
 *
 * @example
 * // With custom tooltip message and role hint
 * <PermissionGuard
 *   permission="subscription.manage"
 *   showTooltip
 *   tooltipMessage="Only workspace owners can manage subscriptions"
 *   requiredRole="Workspace Owner"
 *   fallback={<Button>Manage Subscription</Button>}
 * >
 *   <Button>Manage Subscription</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  anyPermission,
  allPermissions,
  role,
  anyRole,
  requireAll = false,
  workspaceId: propWorkspaceId,
  fallback = null,
  children,
  invert = false,
  showLoading = true,
  loadingVariant = "skeleton",
  loadingMessage,
  showTooltip = false,
  tooltipMessage,
  requiredRole,
}: PermissionGuardProps) {
  // Track hydration: render loading on both server & client until mounted
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 1. Determine Workspace ID (Try providers, then props)
  const permissionWsId = useCurrentWorkspaceId();
  const workspaceContext = useWorkspaceOptional();
  const contextWorkspaceId =
    permissionWsId ||
    workspaceContext?.workspaceId ||
    workspaceContext?.workspaceSlug;

  const effectiveWorkspaceId = propWorkspaceId || contextWorkspaceId;

  // 2. Normalize Permissions
  const permissions = useMemo(() => {
    if (permission) {
      return Array.isArray(permission) ? permission : [permission];
    }
    if (anyPermission?.length) return anyPermission;
    if (allPermissions?.length) return allPermissions;
    return [];
  }, [permission, anyPermission, allPermissions]);

  const mode = useMemo(() => {
    if (permission) {
      return Array.isArray(permission)
        ? requireAll
          ? ("all" as const)
          : ("any" as const)
        : ("single" as const);
    }
    if (anyPermission?.length) return "any" as const;
    if (allPermissions?.length) return "all" as const;
    return "any" as const;
  }, [permission, anyPermission, allPermissions, requireAll]);

  // 3. Hook calls (Must be top-level)
  const { hasAccess: permissionAccess, isLoading } = usePermissionDecision({
    mode,
    permissions,
    workspaceId: effectiveWorkspaceId,
  });

  const roleCheck = useRole(role || "");
  const anyRoleCheck = useAnyRole(anyRole || []);

  // 4. Access Logic
  let hasAccess = false;

  if (permission || anyPermission?.length || allPermissions?.length) {
    hasAccess = permissionAccess;
  } else if (role) {
    hasAccess = roleCheck;
  } else if (anyRole?.length) {
    hasAccess = anyRoleCheck;
  } else {
    // If no permission/role specified, default to granted
    hasAccess = true;
  }

  if (invert) hasAccess = !hasAccess;

  // Show loading state while permissions are being fetched or before hydration
  // This ensures server and client render the same loading UI to prevent hydration mismatches
  if ((!hasMounted || isLoading) && showLoading) {
    return (
      <PermissionLoading variant={loadingVariant} message={loadingMessage} />
    );
  }

  // Permission check failed - show fallback
  if (!hasAccess) {
    if (showTooltip && isValidElement(fallback)) {
      const firstPermission = permissions[0];
      return (
        <LockedFeatureTooltip
          permission={firstPermission}
          requiredRole={requiredRole}
          message={tooltipMessage}
        >
          {fallback}
        </LockedFeatureTooltip>
      );
    }

    return <>{fallback}</>;
  }

  // Permission granted - show children
  if (showLoading && (permission || anyPermission || allPermissions)) {
    return (
      <Suspense
        fallback={
          <PermissionLoading
            variant={loadingVariant}
            message={loadingMessage}
          />
        }
      >
        {children}
      </Suspense>
    );
  }

  return <>{children}</>;
}
