"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAnyPermission, useIsAdmin, useRole } from "@/hooks/use-permission";
import {
  AUDIT_PERMISSIONS,
  BILLING_PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
  SECURITY_PERMISSIONS,
  USER_PERMISSIONS,
} from "@/lib/permissions";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import type { Route } from "next";

/**
 * The admin area's role check, inside the shell (app/admin/layout.tsx).
 * Redirects non-admin users to the dashboard.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  // Admin role, or any permission that unlocks an /admin page (support holds
  // audit.read for the Audit Logs page). proxy.ts and each page still enforce
  // the specific permission; this only decides whether the area is entered.
  const hasAdminRole = useIsAdmin();
  // The global support role unlocks the admin area for its read-only pages
  // (Audit Logs, Subscriptions, read-only User Management).
  const hasSupportRole = useRole(ROLES.SUPPORT);
  const hasAdminPagePermission = useAnyPermission([
    AUDIT_PERMISSIONS.READ,
    BILLING_PERMISSIONS.READ,
    ROLE_PERMISSIONS.READ,
    SECURITY_PERMISSIONS.READ,
    USER_PERMISSIONS.MANAGE,
  ]);
  const isAdmin = hasAdminRole || hasSupportRole || hasAdminPagePermission;
  const router = useRouter();

  useEffect(() => {
    // Wait for the initial session load. A mid-flight refresh also reports
    // "loading" but keeps the existing session — don't treat that as a
    // reason to re-run the redirect checks.
    if (status === "loading" && !session) return;

    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login" as Route);
      return;
    }

    // Redirect if not admin
    if (status === "authenticated" && !isAdmin) {
      router.push("/" as Route);
    }
  }, [status, session, isAdmin, router]);

  // Only block on the *initial* session load. next-auth's update() flips
  // status to "loading" on every token refresh (~every access-token
  // lifetime); returning the spinner there unmounts the whole admin subtree
  // and looks like a spontaneous page reload.
  if (status === "loading" && !session) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAdmin) {
    return null;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
