"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const queryClient = useQueryClient();

  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [activityCount, setActivityCount] = useState<number>(0);

  const user = session?.user
    ? {
        id: session.user.id || "",
        email: session.user.email || "",
        name: session.user.name || "",
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
      log.info(
        `[Auth] User logging out after ${activityCount} interactions. Last active: ${new Date(lastActivity).toLocaleTimeString()}`,
      );

      // Disable all background queries
      queryClient.setDefaultOptions({
        queries: { enabled: false },
      });

      // Clear all cached React Query data
      queryClient.clear();

      // Perform sign out (don’t auto-redirect)
      await signOut({ redirect: false });

      // Redirect manually to login page
      router.push("/login");
    } catch (error) {
      log.error("[Auth] Logout failed", error);
      // As fallback, still navigate to login
      router.push("/login");
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
