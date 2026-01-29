"use client";

import { useQueryClient } from "@tanstack/react-query";

import { signOut, useSession } from "next-auth/react";
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
  const queryClient = useQueryClient();

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

  const logout = async () => {
    try {
      log.info("[Auth] Initiating comprehensive logout...");

      // 1. Reset Analytics
      try {
        const { analytics } = await import("@/lib/analytics");
        analytics.reset();
        analytics.clearStoredEvents();
      } catch (e) {
        log.error("[Auth] Failed to reset analytics", e);
      }

      // 2. Clear and cancel all React Query operations
      // We DON'T set queries.enabled = false here because it persists across
      // navigation if a hard reload doesn't occur, breaking the next login.
      queryClient.cancelQueries();
      queryClient.clear();

      // 3. Perform NextAuth sign out
      // This reliably handles its own session cookies.
      await signOut({ redirect: false, callbackUrl: "/login" });

      // 4. Clear Storage
      if (typeof window !== "undefined") {
        const theme = localStorage.getItem("theme");
        const sidebarState = localStorage.getItem("sidebar:state");

        // Clear all sensitive data
        localStorage.clear();
        sessionStorage.clear();

        // Restore UI preferences
        if (theme) localStorage.setItem("theme", theme);
        if (sidebarState) localStorage.setItem("sidebar:state", sidebarState);
      }

      // 5. Force a hard reload to ensure all in-memory state is wiped.
      // This is the only way to guarantee Zinc (Zustand) and NextAuth internal
      // states are completely reset and don't interfere with the next login.
      // Using router.push or router.refresh is insufficient for a secure/clean logout.
      window.location.href = "/login";
    } catch (error) {
      log.error("[Auth] Logout failed", error);
      window.location.href = "/login";
    }
  };

  return {
    user,
    isAuthenticated: status === "authenticated",
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
