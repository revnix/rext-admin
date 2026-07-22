"use client";

import { SessionProvider } from "next-auth/react";
import { SessionTimeoutWarning } from "@/components/auth/session-timeout-warning";
import { useEffect } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider with SessionProvider and session management features
 *
 * Wraps the app with NextAuth SessionProvider and includes:
 * - Session timeout warnings
 * - Automatic session refresh
 * - Refetch on window focus so a backgrounded tab picks up the latest
 *   rotated refresh token instead of retrying its own stale one (which the
 *   backend has already permanently revoked) and getting logged out.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Clean up legacy token storage from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }, []);

  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={0}>
      {children}
      <SessionTimeoutWarning />
    </SessionProvider>
  );
}
