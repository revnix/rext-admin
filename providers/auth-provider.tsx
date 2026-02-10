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
 * - Disabled automatic refetch to prevent cross-tab interference
 * - Session changes only detected on user interaction (navigation, etc.)
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
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
      <SessionTimeoutWarning />
    </SessionProvider>
  );
}
