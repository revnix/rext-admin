"use client";

import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout-utils";
import { useCallback, useEffect, useState } from "react";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { log } from "@/lib/logger";

interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: string;
}

/**
 * Session Manager Component
 *
 * Automatically refreshes the session when it's about to expire.
 * Keeps the UI components for manual fallback if auto-refresh fails.
 */
export function SessionTimeoutWarning() {
  const { showWarning, formattedTime, sessionExpired } = useSessionTimeout();
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
      const refreshToken = session?.user?.refreshToken;

      if (!refreshToken) {
        log.error("[Auth] No refresh token available for automatic refresh");
        performLogout("/login?session=expired");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
      );

      if (!response.ok) {
        log.error(
          "[Auth] Automatic token refresh API failed:",
          response.status,
        );
        performLogout("/login?session=expired");
        return;
      }

      const resData = await response.json();
      const refreshedTokens = (resData.data || resData) as RefreshResponse;

      if (!refreshedTokens.access_token) {
        log.error("[Auth] No access token in refresh response");
        performLogout("/login?session=expired");
        return;
      }

      const expiresIn = refreshedTokens.expires_in;
      const expiresAt = refreshedTokens.expires_at;
      const accessTokenExpires = expiresIn
        ? Date.now() + expiresIn * 1000
        : expiresAt
          ? new Date(expiresAt).getTime()
          : session?.accessTokenExpires;

      const updatedSession = await update({
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token ?? refreshToken,
        accessTokenExpires,
      });

      if (updatedSession?.error === "RefreshAccessTokenError") {
        log.error("[Auth] Session update failed after refresh");
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
    if (
      showWarning &&
      !isExtending &&
      session?.user?.refreshToken
    ) {
      log.info("[Auth] Session expiring soon, triggering automatic refresh...");
      handleExtendSession();
    }
  }, [showWarning, isExtending, session, handleExtendSession]);

  const handleLogout = async () => {
    await performLogout("/login");
  };

  // Don't render if session doesn't exist or has error
  if (!session || session.error) {
    return null;
  }

  // No modal is shown if refresh fails; user is logged out instead
  return null;
}
