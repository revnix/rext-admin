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

  const logout = async () => {
    await performLogout("/login");
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
