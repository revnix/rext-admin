"use client";

import type React from "react";
import { Suspense } from "react";
import { usePermissionDecision } from "@/hooks/use-permission";
import { useCurrentWorkspaceId } from "@/providers/workspace-permission-provider";
import { LockedFeatureTooltip } from "./locked-feature-tooltip";
import { PermissionLoading } from "./permission-loading";

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
  /** Show loading state while checking permissions */
  showLoading?: boolean;
  /** Loading variant */
  loadingVariant?: "skeleton" | "spinner" | "minimal";
  /** Custom loading message */
  loadingMessage?: string;
  /** Show tooltip on fallback explaining permission requirement (default: false) */
  showTooltip?: boolean;
  /** Custom tooltip message (if showTooltip is true) */
  tooltipMessage?: string;
  /** Required role hint for tooltip (e.g., "Workspace Owner") */
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
  requireAll = false,
  workspaceId: propWorkspaceId,
  fallback = null,
  children,
  showLoading = true, // Changed default to true for better UX
  loadingVariant = "skeleton",
  loadingMessage,
  showTooltip = false,
  tooltipMessage,
  requiredRole,
}: PermissionGuardProps) {
  const permissions = Array.isArray(permission) ? permission : [permission];

  // Get workspace ID from context (if in workspace route) or props
  const contextWorkspaceId = useCurrentWorkspaceId();
  const effectiveWorkspaceId = propWorkspaceId || contextWorkspaceId;

  // Determine if user has required permissions and if still loading
  const { hasAccess, isLoading } = usePermissionDecision({
    mode: permissions.length === 1 ? "single" : requireAll ? "all" : "any",
    permissions,
    workspaceId: effectiveWorkspaceId,
  });

  // Show loading state while permissions are being fetched (prevents flash!)
  if (isLoading && showLoading) {
    return (
      <PermissionLoading variant={loadingVariant} message={loadingMessage} />
    );
  }

  // Permission check failed - show fallback
  if (!hasAccess) {
    // If showTooltip is true and fallback is a React element, wrap it in LockedFeatureTooltip
    if (
      showTooltip &&
      fallback &&
      typeof fallback === "object" &&
      "type" in fallback
    ) {
      const firstPermission = permissions[0]; // Use first permission for tooltip
      return (
        <LockedFeatureTooltip
          permission={firstPermission}
          requiredRole={requiredRole}
          message={tooltipMessage}
        >
          {fallback as React.ReactElement}
        </LockedFeatureTooltip>
      );
    }

    return <>{fallback}</>;
  }

  // Permission granted - show children
  // Optionally wrap in Suspense for component-level loading
  if (showLoading) {
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
