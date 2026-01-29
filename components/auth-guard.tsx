"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { log } from "@/lib/logger";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * AuthGuard Component
 *
 * Protects routes by checking authentication status.
 * - If user is not authenticated, redirects to login page
 * - Shows loading state while checking auth
 * - Can be configured to allow public access
 *
 * Usage:
 * ```tsx
 * <AuthGuard>
 *   <YourProtectedPage />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  redirectTo = "/login",
  requireAuth = true,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for initial auth check to complete
    if (!isLoading) {
      setIsChecking(false);

      // If auth is required but user is not authenticated, redirect
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, requireAuth, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Render children if authenticated or auth not required
  return <>{children}</>;
}

/**
 * GuestGuard Component
 *
 * Protects routes that should only be accessible to unauthenticated users
 * (like login, signup pages). Redirects authenticated users away.
 *
 * Usage:
 * ```tsx
 * <GuestGuard>
 *   <LoginPage />
 * </GuestGuard>
 * ```
 */
export function GuestGuard({
  children,
  redirectTo = "/",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { isAuthenticated, isLoading } = useAuthSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);

      if (isAuthenticated) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't render children (redirect happens in useEffect)
  if (isAuthenticated) {
    return null;
  }

  // Render children if not authenticated
  return <>{children}</>;
}
