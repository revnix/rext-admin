"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { PermissionSync } from "@/components/auth/permission-sync";
import { SessionTimeoutWarning } from "@/components/auth/session-timeout-warning";
import { useEffect } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

/**
 * Auth Provider with SessionProvider and session management features
 *
 * Wraps the app with NextAuth SessionProvider and includes:
 * - Session timeout warnings
 * - Automatic session refresh
 * - A targeted expiry check on resume, without broadcasting a session read
 *   from every focused tab.
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  useEffect(() => {
    // Clean up legacy token storage from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }, []);

  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
      <SessionTimeoutWarning />
      <PermissionSync />
    </SessionProvider>
  );
}
