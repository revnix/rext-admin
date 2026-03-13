"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout-utils";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [refreshFailed, setRefreshFailed] = useState(false);

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
        setRefreshFailed(true);
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
        setRefreshFailed(true);
        return;
      }

      const resData = await response.json();
      const refreshedTokens = (resData.data || resData) as RefreshResponse;

      if (!refreshedTokens.access_token) {
        log.error("[Auth] No access token in refresh response");
        setRefreshFailed(true);
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
        setRefreshFailed(true);
        return;
      }

      log.info("[Auth] Session refreshed automatically");
      setRefreshFailed(false);
    } catch (error) {
      log.error("[Auth] Failed to extend session:", error);
      setRefreshFailed(true);
    } finally {
      setIsExtending(false);
    }
  }, [isExtending, session, update]);

  // Handle automatic refresh when session is about to expire
  useEffect(() => {
    if (
      showWarning &&
      !isExtending &&
      !refreshFailed &&
      session?.user?.refreshToken
    ) {
      log.info("[Auth] Session expiring soon, triggering automatic refresh...");
      handleExtendSession();
    }
  }, [showWarning, isExtending, refreshFailed, session, handleExtendSession]);

  const handleLogout = async () => {
    await performLogout("/login");
  };

  // Don't render if session doesn't exist or has error
  if (!session || session.error) {
    return null;
  }

  // Only show the dialog if refreshFailed is true and we are in the warning zone
  // This fulfills "instead of showing dialog call api directly" while "not removing anything"
  return (
    <Dialog open={showWarning && refreshFailed} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Session Expiration Warning</DialogTitle>
          </div>
          <DialogDescription>
            We tried to refresh your session automatically but failed. Your
            session will expire in <strong>{formattedTime}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Time Remaining</AlertTitle>
          <AlertDescription className="text-orange-700 text-2xl font-bold mt-1">
            {formattedTime}
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isExtending}
            className="w-full sm:w-auto"
          >
            Logout Now
          </Button>
          <Button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="w-full sm:w-auto"
          >
            {isExtending ? "Retrying..." : "Try Refresh Again"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
