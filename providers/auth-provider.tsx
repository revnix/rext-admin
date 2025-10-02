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
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      {children}
      <SessionTimeoutWarning />
    </SessionProvider>
  );
}
