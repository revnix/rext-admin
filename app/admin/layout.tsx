"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useIsAdmin } from "@/hooks/use-permission";
import { APIErrorBoundary } from "@/components/ui/error-boundary";

/**
 * Admin layout with role-based access control
 * Redirects non-admin users to dashboard
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const isAdmin = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") return;

    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Redirect if not admin
    if (status === "authenticated" && !isAdmin) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  // Show loading state while checking permissions
  if (status === "loading") {
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
