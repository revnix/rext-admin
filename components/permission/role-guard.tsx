"use client";

import type React from "react";
import { useAnyRole, useRole } from "@/hooks/use-permission";

/**
 * Role guard component props
 */
interface RoleGuardProps {
  /** Single role or array of roles to check */
  role: string | string[];
  /** Fallback content to show when role doesn't match */
  fallback?: React.ReactNode;
  /** Children to render when role matches */
  children: React.ReactNode;
}

/**
 * Role Guard Component
 *
 * Show/hide content based on user role.
 * If multiple roles provided, checks if user has ANY of them.
 *
 * @example
 * // Single role
 * <RoleGuard role="admin">
 *   <AdminPanel />
 * </RoleGuard>
 *
 * @example
 * // Multiple roles (ANY)
 * <RoleGuard role={["admin", "super_admin"]}>
 *   <SystemSettings />
 * </RoleGuard>
 *
 * @example
 * // With fallback
 * <RoleGuard
 *   role="admin"
 *   fallback={<p>Admin access required</p>}
 * >
 *   <AdminDashboard />
 * </RoleGuard>
 */
export function RoleGuard({ role, fallback = null, children }: RoleGuardProps) {
  const roles = Array.isArray(role) ? role : [role];

  // Check role
  const hasSingleRole = useRole(roles[0]);
  const hasAnyRole = useAnyRole(roles);

  const hasAccess = roles.length === 1 ? hasSingleRole : hasAnyRole;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
