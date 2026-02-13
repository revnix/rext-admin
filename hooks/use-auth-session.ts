"use client";

import { useQueryClient } from "@tanstack/react-query";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { log } from "@/lib/logger";
import { useRouter } from "next/navigation";
import { resetAllStores } from "@/lib/store-registry";
import { clearAuthHeadersCache, resetAuthRedirectState } from "@/lib/auth-utils";

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
  const router = useRouter();
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
      queryClient.cancelQueries();
      queryClient.clear();

      // 3. Perform NextAuth sign out (clears session cookies)
      await signOut({ redirect: false, callbackUrl: "/login" });

      // 4. Clear Storage (preserve UI preferences)
      if (typeof window !== "undefined") {
        const theme = localStorage.getItem("theme");
        const sidebarState = localStorage.getItem("sidebar:state");

        localStorage.clear();
        sessionStorage.clear();

        if (theme) localStorage.setItem("theme", theme);
        if (sidebarState) localStorage.setItem("sidebar:state", sidebarState);
      }

      // 5. Reset all Zustand stores to initial state
      resetAllStores();

      // 6. Clear auth utility caches
      clearAuthHeadersCache();
      resetAuthRedirectState();

      // 7. Navigate to login page (smooth client-side transition)
      router.push("/login");
    } catch (error) {
      log.error("[Auth] Logout failed", error);
      // Fallback: hard reload as safety net if programmatic cleanup fails
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
