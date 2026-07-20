import { signOut } from "next-auth/react";
import { log } from "@/lib/logger";
import { getQueryClient } from "@/lib/query-client";
import { clearAuthHeadersCache } from "@/lib/auth-utils";
import { resetAllStores } from "./store-registry";

// `performLogout` is called independently from several uncoordinated places
// (use-auth-session.ts's error effect, SessionTimeoutWarning's definitive-
// rejection path, auth-utils.ts's redirectToLogin) whenever they each notice
// the same dead session. Without a shared guard, a single expired/invalid
// session triggers several concurrent full logout sequences — duplicate
// store resets, duplicate signOut() calls, and re-rendered components that
// can re-trigger their own refresh/logout effects mid-flight. Since
// performLogout always ends by navigating away, this flag only needs to
// suppress re-entry for the lifetime of this page load.
let logoutInProgress = false;

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
export async function performLogout(callbackUrl: string = "/login") {
  if (logoutInProgress) {
    log.debug("[Auth] Logout already in progress, ignoring duplicate call");
    return;
  }
  logoutInProgress = true;

  try {
    log.info("[Auth] Initiating comprehensive logout via utility...");

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

    // 6. Force a hard reload to ensure all in-memory state is wiped.
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
