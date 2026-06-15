"use client";

import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout-utils";
import { useCallback, useEffect, useState } from "react";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { log } from "@/lib/logger";

/**
 * Session Manager Component
 *
 * Automatically refreshes the session when it's about to expire.
 * Keeps the UI components for manual fallback if auto-refresh fails.
 */
export function SessionTimeoutWarning() {
  const { showWarning, sessionExpired } = useSessionTimeout();
  const { data: session, update } = useSession();
  const [isExtending, setIsExtending] = useState(false);

  // Handle session expiry - redirect to login
  useEffect(() => {
    if (sessionExpired && session) {
      log.warn("[Auth] Session expired, performing logout");
      performLogout("/login?session=expired");
    }
  }, [sessionExpired, session]);

  const handleExtendSession = useCallback(async () => {
    if (isExtending) return;

    setIsExtending(true);
    try {
      if (!session?.user?.refreshToken) {
        log.error("[Auth] No refresh token available for automatic refresh");
        performLogout("/login?session=expired");
        return;
      }

      // Delegate refresh to NextAuth's JWT callback (trigger === "update" path).
      // Calling update() with no data triggers refreshAccessToken() server-side,
      // keeping one canonical refresh path and preventing races with the 401 handler.
      const updatedSession = await update();

      if (updatedSession?.error === "RefreshAccessTokenError") {
        log.error("[Auth] Session refresh failed");
        performLogout("/login?session=expired");
        return;
      }

      log.info("[Auth] Session refreshed automatically");
    } catch (error) {
      log.error("[Auth] Failed to extend session:", error);
      performLogout("/login?session=expired");
    } finally {
      setIsExtending(false);
    }
  }, [isExtending, session, update]);

  // Handle automatic refresh when session is about to expire
  useEffect(() => {
    if (showWarning && !isExtending && session?.user?.refreshToken) {
      log.info("[Auth] Session expiring soon, triggering automatic refresh...");
      handleExtendSession();
    }
  }, [showWarning, isExtending, session, handleExtendSession]);

  // Don't render if session doesn't exist or has error
  if (!session || session.error) {
    return null;
  }

  // No modal is shown if refresh fails; user is logged out instead
  return null;
}
