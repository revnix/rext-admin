"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useIsAdmin } from "@/hooks/use-permission";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import type { Route } from "next";

/**
 * Admin layout with role-based access control
 * Redirects non-admin users to dashboard
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const isAdmin = useIsAdmin();
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
      <div className="flex items-center justify-center min-h-screen">
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

  // Render admin content
  // Note: PageLayout handles title, description, sidebar, and impersonation banner
  return <APIErrorBoundary>{children}</APIErrorBoundary>;
}
