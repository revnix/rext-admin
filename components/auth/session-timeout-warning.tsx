"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout-utils";
import { useEffect, useState } from "react";
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

/**
 * Session Timeout Warning Component
 *
 * Displays a warning modal when the user's session is about to expire,
 * with options to extend the session or logout.
 */
export function SessionTimeoutWarning() {
  const { showWarning, formattedTime, sessionExpired } = useSessionTimeout();
  const { data: session, update } = useSession();
  const [isExtending, setIsExtending] = useState(false);

  // Handle session expiry
  useEffect(() => {
    if (sessionExpired && session) {
      performLogout("/login?session=expired");
    }
  }, [sessionExpired, session]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      log.info("[Auth] Extending session...");

      const refreshToken = session?.user?.refreshToken;

      if (!refreshToken) {
        log.error("[Auth] No refresh token available in session");
        // Force logout if we can't refresh
        await performLogout("/login?error=SessionExpired");
        return;
      }

      // 1. Call the official refresh endpoint directly as requested
      // This is more reliable than automatic session update in some environments
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
        log.error("[Auth] Token refresh API failed:", response.status);
        await performLogout("/login?error=SessionExpired");
        return;
      }

      const resData = await response.json();
      // Backend pattern: data is wrapped in { data: ... } or returned directly
      // biome-ignore lint/suspicious/noExplicitAny: dynamic backend response
      const refreshedTokens = (resData.data || resData) as any;

      if (!refreshedTokens.access_token) {
        log.error("[Auth] No access token in refresh response");
        await performLogout("/login?error=SessionExpired");
        return;
      }

      // 2. Update the NextAuth session with the new tokens.
      // We pass the data to update() which triggers the jwt callback in auth.config.ts
      log.info("[Auth] Updating NextAuth session with refreshed tokens...");

      // Calculate new expiry for the client-side timer
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
        log.error("[Auth] Session extension failed: Token refresh error");
        await performLogout("/login?error=SessionExpired");
        return;
      }

      log.info("[Auth] Session extended successfully");
    } catch (error) {
      log.error("[Auth] Failed to extend session:", error);
      // Fallback: still try a simple update if fetch failed for some network reason
      try {
        await update();
      } catch (e) {
        log.error("[Auth] Fallback update also failed", e);
      }
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = async () => {
    await performLogout("/login");
  };

  // Don't render if session doesn't exist or has error
  if (!session || session.error) {
    return null;
  }

  return (
    <>
      {/* Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={() => { }}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <DialogTitle>Session Expiring Soon</DialogTitle>
            </div>
            <DialogDescription>
              Your session will expire in <strong>{formattedTime}</strong>. Do
              you want to extend your session?
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
              {isExtending ? "Extending..." : "Extend Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
