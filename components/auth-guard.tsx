"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { Route } from "next";

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
        router.push(redirectTo as Route);
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
  const searchParams = useSearchParams();
  // Signed in when the page opened: the page isn't for them, so it sends them on. Signed in on
  // this page (its form just logged them in): the form navigates on its own and stays on screen
  // until it does. Blanking it and sending them to "/" as well left an empty page for seconds and
  // a second navigation racing the form's (C11 #554).
  const signedInOnArrival = useRef<boolean | null>(null);
  if (signedInOnArrival.current === null && !isLoading) {
    signedInOnArrival.current = isAuthenticated;
  }
  const sendOn = isAuthenticated && signedInOnArrival.current === true;

  useEffect(() => {
    if (!isLoading) {
      // CRITICAL: Prevent redirect loop if we are on the login page with an error
      const hasError =
        searchParams.get("error") ||
        searchParams.get("session") ||
        searchParams.get("reason");
      if (hasError) {
        return;
      }

      if (sendOn) {
        router.push(redirectTo as Route);
      }
    }
  }, [isLoading, sendOn, redirectTo, router, searchParams]);

  // Show loading state. Only while the session is unknown: the root layout seeds it from the server,
  // so a signed-out visitor gets the page in the first render, with no spinner swapped out after it
  // (which moved the page's elements: Lighthouse measured a layout shift of 0.24, task C10).
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Signed in on arrival: don't render the page (the redirect happens in useEffect).
  if (sendOn) {
    return null;
  }

  // Render children if not authenticated
  return <>{children}</>;
}
