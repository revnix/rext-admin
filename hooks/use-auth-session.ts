"use client";

import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout-utils";
import { useEffect, useState } from "react";
import { log } from "@/lib/logger";

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
      status === "authenticated" &&
      session?.error === "RefreshAccessTokenError"
    ) {
      log.error(
        "[Auth] RefreshAccessTokenError detected in hook, triggering logout...",
        session.error,
      );
      performLogout("/login?error=SessionExpired");
    }
  }, [session?.error, status]);

  const logout = async () => {
    await performLogout("/login");
  };

  // User is only truly authenticated if status is "authenticated" AND there's no refresh error
  // AND the session hasn't been explicitly marked as invalid by a logout process
  const isAuthenticated =
    status === "authenticated" &&
    !session?.error &&
    !(
      typeof window !== "undefined" &&
      sessionStorage.getItem("session_invalid") === "true"
    );

  return {
    user,
    isAuthenticated,
    isLoading: status === "loading",
    logout,
    session,
    activity: {
      lastActivity,
      activityCount,
      lastActivityTime: new Date(lastActivity).toLocaleTimeString(),
    },
  };
}
