import { signOut } from "next-auth/react";
import { log } from "@/lib/logger";
import { getQueryClient } from "@/lib/query-client";

/**
 * Performs a comprehensive and secure logout operation.
 *
 * This utility ensures that sensitive data is cleared from:
 * 1. Analytics state
 * 2. TanStack Query cache (prevents data leakage across users)
 * 3. Local and Session storage (except UI preferences)
 * 4. NextAuth session
 *
 * @param callbackUrl - The URL to redirect to after logout. Defaults to "/login"
 */
export async function performLogout(callbackUrl: string = "/login") {
  try {
    log.info("[Auth] Initiating comprehensive logout via utility...");

    // 1. Reset Analytics
    try {
      const { analytics } = await import("@/lib/analytics");
      analytics.reset();
      analytics.clearStoredEvents();
    } catch (e) {
      log.error("[Auth] Failed to reset analytics", e);
    }

    // 2. Clear and cancel all React Query operations
    // Access the singleton client to ensure we clear the actual app cache
    const queryClient = getQueryClient();
    queryClient.cancelQueries();
    queryClient.clear();

    // 3. Clear Storage
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

    // 4. Perform NextAuth sign out
    // redirect: false allows us to manually handle the hard reload
    await signOut({ redirect: false });

    // 5. Force a hard reload to ensure all in-memory state is wiped.
    window.location.href = callbackUrl;
  } catch (error) {
    log.error("[Auth] Logout failed", error);
    // Fallback force reload even if something failed
    window.location.href = callbackUrl;
  }
}
