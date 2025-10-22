"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect } from "react";
import {
  useAllPermissions,
  useAnyPermission,
  useIsAdmin,
  usePermission,
} from "@/hooks/use-permission";

/**
 * Protected route component props
 */
interface ProtectedRouteProps {
  /** Permission(s) required to access the route */
  permission?: string | string[];
  /** If true, requires ALL permissions. If false, requires ANY permission (default: false) */
  requireAll?: boolean;
  /** Require admin access (any admin) */
  requireAdmin?: boolean;
  /** Workspace ID for workspace-scoped permission checks */
  workspaceId?: string;
  /** Path to redirect to when access is denied (default: "/unauthorized") */
  redirectTo?: string;
  /** Fallback content to show while checking permissions */
  fallback?: React.ReactNode;
  /** Children to render when access is granted */
  children: React.ReactNode;
}

/**
 * Protected Route Component
 *
 * Protects a route/page based on permissions or admin status.
 * Redirects to unauthorized page if access is denied.
 *
 * @example
 * // Protect with single permission
 * <ProtectedRoute permission="user.read">
 *   <UsersPage />
 * </ProtectedRoute>
 *
 * @example
 * // Protect with admin requirement
 * <ProtectedRoute requireAdmin={true}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * @example
 * // Protect with multiple permissions (ANY)
 * <ProtectedRoute permission={["content.read", "content.update"]}>
 *   <ContentEditor />
 * </ProtectedRoute>
 *
 * @example
 * // Protect with workspace-scoped permission
 * <ProtectedRoute
 *   permission="workspace.manage_settings"
 *   workspaceId={workspaceId}
 * >
 *   <WorkspaceSettings />
 * </ProtectedRoute>
 *
 * @example
 * // Custom redirect and fallback
 * <ProtectedRoute
 *   permission="user.delete"
 *   redirectTo="/"
 *   fallback={<div>Checking permissions...</div>}
 * >
 *   <DeleteUserPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  permission,
  requireAll = false,
  requireAdmin = false,
  redirectTo = "/unauthorized",
  fallback,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  // Always call hooks at the top level
  const permissions = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : [];
  const hasSinglePermission = usePermission(permissions[0] || "");
  const hasAnyPermission = useAnyPermission(permissions);
  const hasAllPermissions = useAllPermissions(permissions);

  // Determine access based on requirements
  let hasAccess = true;

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    hasAccess = false;
  }

  // Check permission requirement
  if (hasAccess && permission && permissions.length > 0) {
    if (permissions.length === 1) {
      hasAccess = hasSinglePermission;
    } else if (requireAll) {
      hasAccess = hasAllPermissions;
    } else {
      hasAccess = hasAnyPermission;
    }
  }

  // Handle redirect with useEffect (always at top level)
  useEffect(() => {
    if (!hasAccess) {
      router.push(redirectTo);
    }
  }, [hasAccess, router, redirectTo]);

  // Show fallback or nothing if no access
  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  return <>{children}</>;
}
