"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect } from "react";
import {
  useAllPermissions,
  useAllWorkspacePermissions,
  useAnyPermission,
  useAnyWorkspacePermission,
  useIsAdmin,
  usePermission,
  useWorkspacePermission,
} from "@/hooks/use-permission";
import { PermissionLoading } from "./permission-loading";
import type { Route } from "next";

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
  workspaceId,
  redirectTo = "/unauthorized",
  fallback,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  const permissions = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : [];
  const useWorkspaceChecks = Boolean(workspaceId);

  const hasSingleGlobalPermission = usePermission(permissions[0] || "");
  const hasAnyGlobalPermission = useAnyPermission(permissions);
  const hasAllGlobalPermissions = useAllPermissions(permissions);

  const singleWorkspaceResult = useWorkspacePermission(
    permissions[0] || "",
    workspaceId,
  );
  const anyWorkspaceResult = useAnyWorkspacePermission(permissions, workspaceId);
  const allWorkspaceResult = useAllWorkspacePermissions(permissions, workspaceId);

  let hasAccess = true;
  let isLoading = false;

  if (requireAdmin && !isAdmin) {
    hasAccess = false;
  }

  if (hasAccess && permission && permissions.length > 0) {
    if (useWorkspaceChecks) {
      if (permissions.length === 1) {
        hasAccess = singleWorkspaceResult.hasPermission;
        isLoading = singleWorkspaceResult.isLoading;
      } else if (requireAll) {
        hasAccess = allWorkspaceResult.hasPermission;
        isLoading = allWorkspaceResult.isLoading;
      } else {
        hasAccess = anyWorkspaceResult.hasPermission;
        isLoading = anyWorkspaceResult.isLoading;
      }
    } else if (permissions.length === 1) {
      hasAccess = hasSingleGlobalPermission;
    } else if (requireAll) {
      hasAccess = hasAllGlobalPermissions;
    } else {
      hasAccess = hasAnyGlobalPermission;
    }
  }

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      router.replace(redirectTo as Route);
    }
  }, [hasAccess, isLoading, redirectTo, router]);

  if (isLoading) {
    if (fallback) return <>{fallback}</>;
    return <PermissionLoading variant="minimal" message="Checking access..." />;
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}