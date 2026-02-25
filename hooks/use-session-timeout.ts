"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/**
 * Hook for monitoring session timeout and showing warnings
 */
export function useSessionTimeout() {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (!session?.expires) {
      setShowWarning(false);
      setSessionExpired(false);
      return;
    }

    const checkTimeout = () => {
      // Prioritize backend accessTokenExpires for accuracy, fall back to NextAuth session expiry
      const expiresAt = session.accessTokenExpires
        ? session.accessTokenExpires
        : new Date(session.expires).getTime();
      const now = Date.now();
      const remaining = expiresAt - now;

      // Session expired
      if (remaining <= 0) {
        setSessionExpired(true);
        setShowWarning(false);
        setTimeRemaining(0);
        return;
      }

      // Show warning 2 minutes before expiry
      const warningThreshold = 2 * 60 * 1000; // 2 minutes in milliseconds
      if (remaining < warningThreshold) {
        setShowWarning(true);
        setTimeRemaining(Math.floor(remaining / 1000)); // Convert to seconds
      } else {
        setShowWarning(false);
        setTimeRemaining(Math.floor(remaining / 1000));
      }
    };

    // Check immediately
    checkTimeout();

    // Check every 10 seconds
    const interval = setInterval(checkTimeout, 10000);

    return () => clearInterval(interval);
  }, [session]);

  /**
   * Format time remaining as human-readable string
   */
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    showWarning,
    timeRemaining,
    sessionExpired,
    formattedTime: formatTimeRemaining(timeRemaining),
  };
}
