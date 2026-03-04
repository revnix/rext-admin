"use client";

import type React from "react";
import { ROLES } from "@/lib/permissions";
import { RoleGuard } from "./role-guard";

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
 * Convenience wrapper around RoleGuard for admin role checks.
 */
export function AdminGuard({
  superAdminOnly = false,
  fallback = null,
  children,
}: AdminGuardProps) {
  const requiredRole = superAdminOnly
    ? ROLES.SUPER_ADMIN
    : [ROLES.ADMIN, ROLES.SUPER_ADMIN];

  return (
    <RoleGuard role={requiredRole} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
