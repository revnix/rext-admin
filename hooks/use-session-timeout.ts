"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { log } from "@/lib/logger";

/**
 * Hook for monitoring session timeout and showing warnings.
 *
 * Derives token duration dynamically from the session API's
 * `accessTokenExpires` timestamp — no hardcoded constants.
 *
 * Strategy:
 *   - When `accessTokenExpires` changes (new token issued), we snapshot
 *     `issuedAt = Date.now()` at that exact moment.
 *   - totalDuration = accessTokenExpires - issuedAt  (live from API)
 *   - timeUsed     = Date.now() - issuedAt
 *   - timeRemaining = accessTokenExpires - Date.now()
 */
export function useSessionTimeout() {
  const { data: session } = useSession();

  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeUsed, setTimeUsed] = useState<number>(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(0);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Track when the current access token was issued.
  // We snapshot Date.now() whenever `accessTokenExpires` changes.
  const issuedAtRef = useRef<number | null>(null);
  const prevExpiresRef = useRef<number | null>(null);
  const prevShowWarningRef = useRef<boolean>(false);

  // When accessTokenExpires changes (token refreshed / new login),
  // record the issue timestamp so we can compute total duration.
  useEffect(() => {
    const expiresAt = session?.accessTokenExpires ?? null;

    if (expiresAt !== null && expiresAt !== prevExpiresRef.current) {
      issuedAtRef.current = Date.now();
      prevExpiresRef.current = expiresAt;
    }
  }, [session?.accessTokenExpires]);

  useEffect(() => {
    if (!session?.expires) {
      setShowWarning(false);
      setSessionExpired(false);
      return;
    }

    const checkTimeout = () => {
      // Use accessTokenExpires from the session API for accuracy,
      // fall back to NextAuth session expiry string.
      const expiresAt = session.accessTokenExpires
        ? session.accessTokenExpires
        : new Date(session.expires).getTime();

      const now = Date.now();
      const remaining = expiresAt - now;

      // Compute total duration from API data (no hardcoded constant).
      // issuedAt is set when we first saw this accessTokenExpires value.
      const issuedAt = issuedAtRef.current;
      const totalMs =
        issuedAt !== null && issuedAt < expiresAt ? expiresAt - issuedAt : 0;
      const totalSecs = Math.floor(totalMs / 1000);

      // Session expired
      if (remaining <= 0) {
        setSessionExpired(true);
        setShowWarning(false);
        setTimeRemaining(0);
        setTimeUsed(totalSecs);
        setTotalDurationSeconds(totalSecs);
        return;
      }

      const remainingSeconds = Math.floor(remaining / 1000);
      const usedSeconds =
        issuedAt !== null
          ? Math.max(0, Math.floor((now - issuedAt) / 1000))
          : Math.max(0, totalSecs - remainingSeconds);

      setTimeRemaining(remainingSeconds);
      setTimeUsed(usedSeconds);
      setTotalDurationSeconds(totalSecs);

      // Show warning during the last 2 minutes
      const warningThreshold = 2 * 60 * 1000;
      const nextShowWarning = remaining < warningThreshold;

      if (nextShowWarning !== prevShowWarningRef.current) {
        log.debug(
          `[Auth] Session timeout warning ${nextShowWarning ? "activated" : "cleared"}`,
          {
            remainingMs: remaining,
            accessExpiryIso: new Date(expiresAt).toISOString(),
          },
        );
        prevShowWarningRef.current = nextShowWarning;
      }

      setShowWarning(nextShowWarning);
    };

    // Check immediately
    checkTimeout();

    // Check every 10 seconds
    const interval = setInterval(checkTimeout, 10000);

    return () => clearInterval(interval);
  }, [session]);

  /**
   * Format a number of seconds as M:SS
   */
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    showWarning,
    timeRemaining,
    timeUsed,
    totalDurationSeconds,
    sessionExpired,
    formattedTime: formatTime(timeRemaining),
    formattedTimeUsed: formatTime(timeUsed),
  };
}
