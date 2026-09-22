"use client";

import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout-utils";
import { useEffect, useState } from "react";
import { log } from "@/lib/logger";
import { fetchSessionSingleFlight } from "@/lib/auth-utils";

/**
 * Backward-compatible auth hook using AuthJS
 * Provides similar API to old useAuth hook for easier migration
 *
 * Now includes session activity tracking
 */
export function useAuthSession() {
  const { data: session, status } = useSession();

  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [activityCount, setActivityCount] = useState<number>(0);
  const user = session?.user
    ? {
        id: session.user.id || "",
        email: session.user.email || "",
        name: session.user.name || "",
        full_name: session.user.name,
        accessToken: session.user.accessToken || "",
        role: session.user.role || "user",
        permissions: session.user.permissions || [],
      }
    : null;

  // Track user activity
  useEffect(() => {
    if (status !== "authenticated") return;

    const updateActivity = () => {
      setLastActivity(Date.now());
      setActivityCount((prev) => prev + 1);
    };

    // Listen to user interactions
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [status]);

  // Proactively handle session refresh errors to break redirect loops
  useEffect(() => {
    if (
      status !== "authenticated" ||
      session?.error !== "RefreshAccessTokenError"
    ) {
      return;
    }

    let cancelled = false;

    (async () => {
      // This error can be stale: with multiple tabs/requests racing the
      // backend's single-use refresh token, a failed attempt can write
      // itself into the shared session cookie *after* a concurrent attempt
      // (this tab or another) already rotated it successfully. Re-check the
      // current session before logging the user out of a session that may
      // already be valid again.
      const fresh = await fetchSessionSingleFlight();
      if (cancelled) return;

      if (
        fresh &&
        !fresh.error &&
        fresh.accessTokenExpires &&
        fresh.accessTokenExpires > Date.now()
      ) {
        log.info(
          "[Auth] Stale RefreshAccessTokenError superseded by a valid session — ignoring",
        );
        return;
      }

      log.error(
        "[Auth] RefreshAccessTokenError detected in hook, triggering logout...",
        session.error,
      );
      performLogout("/login?error=SessionExpired");
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.error, status]);

  const logout = async () => {
    await performLogout("/login");
  };

  // User is only truly authenticated if status is "authenticated" AND there's no refresh error
  // AND the session hasn't been explicitly marked as invalid by a logout process
  // update() flips status to "loading" while it re-fetches; the session it
  // already holds is still valid, so don't drop to unauthenticated — AuthGuard
  // would unmount the whole page for the duration of that request.
  const isAuthenticated =
    (status === "authenticated" || (status === "loading" && !!session)) &&
    !session?.error &&
    !(
      typeof window !== "undefined" &&
      sessionStorage.getItem("session_invalid") === "true"
    );

  return {
    user,
    isAuthenticated,
    isLoading: status === "loading" && !session,
    logout,
    session,
    activity: {
      lastActivity,
      activityCount,
      lastActivityTime: new Date(lastActivity).toLocaleTimeString(),
    },
  };
}
