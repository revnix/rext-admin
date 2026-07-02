"use client";

import { getSession, useSession } from "next-auth/react";
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

      // All open tabs share the same session cookie and poll on the same
      // 10s interval, so they cross the warning threshold within the same
      // tick. Re-read the session first — if another tab already rotated
      // the token in the meantime, its updated expiry is already visible
      // here via the shared cookie, and we skip our own redundant refresh
      // instead of reusing a refresh token that's about to be (or already
      // was) blacklisted by that other tab's rotation.
      const expiryBeforeSync = session.accessTokenExpires;
      const freshSession = await getSession();

      if (
        freshSession?.accessTokenExpires &&
        freshSession.accessTokenExpires !== expiryBeforeSync &&
        freshSession.accessTokenExpires > Date.now()
      ) {
        log.info(
          "[Auth] Token already refreshed by another tab, skipping redundant refresh",
        );
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
