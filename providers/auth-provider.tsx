"use client";

import { SessionProvider } from "next-auth/react";
import { SessionTimeoutWarning } from "@/components/auth/session-timeout-warning";

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
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
      <SessionTimeoutWarning />
    </SessionProvider>
  );
}
