"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
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
      log.info("[Auth] Session expired, redirecting to login");
      signOut({ redirect: true, callbackUrl: "/login?session=expired" });
    }
  }, [sessionExpired, session]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      log.info("[Auth] Extending session...");
      // Force session update which will trigger token refresh
      await update();
      log.info("[Auth] Session extended successfully");
    } catch (error) {
      log.error("[Auth] Failed to extend session:", error);
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = async () => {
    log.info("[Auth] User chose to logout");
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  // Don't render if session doesn't exist or has error
  if (!session || session.error) {
    return null;
  }

  return (
    <>
      {/* Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={() => {}}>
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
