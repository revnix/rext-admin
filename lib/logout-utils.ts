import { signOut } from "next-auth/react";
import { log } from "@/lib/logger";
import { getQueryClient } from "@/lib/query-client";
import { clearAuthHeadersCache } from "@/lib/auth-utils";
import { resetAllStores } from "./store-registry";

let logoutPromise: Promise<void> | null = null;

/**
 * Performs a comprehensive and secure logout operation.
 *
 * This utility ensures that sensitive data is cleared from:
 * 1. Analytics state
 * 2. TanStack Query cache (prevents data leakage across users)
 * 3. Local and Session storage (except UI preferences)
 * 4. NextAuth session
 * 5. All Zustand stores
 *
 * @param callbackUrl - The URL to redirect to after logout. Defaults to "/login"
 */
export function performLogout(callbackUrl: string = "/login"): Promise<void> {
  if (!logoutPromise) {
    logoutPromise = executeLogout(callbackUrl);
  }
  return logoutPromise;
}

async function executeLogout(callbackUrl: string): Promise<void> {
  try {
    log.info("[Auth] Initiating comprehensive logout via utility...");

    // 0. Record the logout event FIRST, while auth tokens are still valid.
    // This must happen before any cache clearing, store resets, or storage
    // wipes — otherwise the API call will fail silently with a 401.
    try {
      const { apiClient } = await import("@/lib/api-client");
      // Fetch user ID for resource_id before tokens are invalidated
      let resourceId: string | undefined;
      try {
        const profileRes = await apiClient.request<{
          profile?: { id?: string };
          id?: string;
        }>("/api/v1/user/profile", { method: "GET" });
        resourceId = profileRes?.profile?.id ?? profileRes?.id;
      } catch {
        // Profile fetch failed — proceed without resource_id
      }
      await apiClient.request("/api/v1/audit-logs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "auth.logout",
          resource_type: "user",
          resource_id: resourceId,
          status: "success",
        }),
      });
    } catch (e) {
      log.error("[Auth] Failed to log logout event", e);
    }

    // Mark session as invalid in sessionStorage to break redirect loops immediately
    if (typeof window !== "undefined") {
      sessionStorage.setItem("session_invalid", "true");
    }

    clearAuthHeadersCache();

    // 1. Reset all Zustand stores
    try {
      resetAllStores();
    } catch (e) {
      log.error("[Auth] Failed to reset stores", e);
    }

    // 2. Reset Analytics
    try {
      const { analytics } = await import("@/lib/analytics");
      analytics.reset();
      analytics.clearStoredEvents();
    } catch (e) {
      log.error("[Auth] Failed to reset analytics", e);
    }

    // 3. Clear and cancel all React Query operations
    const queryClient = getQueryClient();
    queryClient.cancelQueries();
    queryClient.clear();

    // 4. Clear Storage
    if (typeof window !== "undefined") {
      const theme = localStorage.getItem("theme");
      const sidebarState = localStorage.getItem("sidebar:state");

      // Clear all sensitive data
      localStorage.clear();
      // Keep session_invalid flag for a moment to prevent loop on reload
      sessionStorage.clear();
      sessionStorage.setItem("session_invalid", "true");

      // Restore UI preferences
      if (theme) localStorage.setItem("theme", theme);
      if (sidebarState) localStorage.setItem("sidebar:state", sidebarState);
    }

    // 5. Perform NextAuth sign out
    // redirect: false allows us to manually handle the hard reload
    log.info("[Auth] Calling NextAuth signOut...");
    await signOut({ redirect: false });

    // 7. Force a hard reload to ensure all in-memory state is wiped.
    log.info(`[Auth] Redirecting to ${callbackUrl}`);
    window.location.href = callbackUrl;
  } catch (error) {
    log.error("[Auth] Logout failed", error);
    // Fallback force reload even if something failed
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = callbackUrl;
    }
  }
}
