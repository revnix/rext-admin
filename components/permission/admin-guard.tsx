"use client";

import type React from "react";
import { useIsAdmin, useIsSuperAdmin } from "@/hooks/use-permission";

/**
 * Admin guard component props
 */
interface AdminGuardProps {
  /** If true, requires super admin. If false, requires any admin (default: false) */
  superAdminOnly?: boolean;
  /** Fallback content to show when not admin */
  fallback?: React.ReactNode;
  /** Children to render when user is admin */
  children: React.ReactNode;
}

/**
 * Admin Guard Component
 *
 * Show/hide content based on admin status.
 * By default, shows content for any admin (admin or super_admin).
 * Use `superAdminOnly={true}` to restrict to super admins only.
 *
 * @example
 * // Any admin
 * <AdminGuard>
 *   <AdminDashboard />
 * </AdminGuard>
 *
 * @example
 * // Super admin only
 * <AdminGuard superAdminOnly={true}>
 *   <UserManagement />
 * </AdminGuard>
 *
 * @example
 * // With fallback
 * <AdminGuard fallback={<p>Admin access required</p>}>
 *   <AdminPanel />
 * </AdminGuard>
 */
export function AdminGuard({
  superAdminOnly = false,
  fallback = null,
  children,
}: AdminGuardProps) {
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();

  const hasAccess = superAdminOnly ? isSuperAdmin : isAdmin;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
