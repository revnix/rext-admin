import { signOut } from "next-auth/react";
import { log } from "@/lib/logger";
import { getQueryClient } from "@/lib/query-client";
import {
  isSignedOut,
  leaveSignedOut,
  subscribeSignedOut,
} from "@/lib/auth/signed-out";
import { clearAuthHeadersCache } from "@/lib/auth-utils";
import { apiClient } from "@/lib/api-client";
import { resetSupportChat } from "@/lib/support-chat/chat";
import { resetAllStores } from "./store-registry";

let logoutPromise: Promise<void> | null = null;
// A page that stayed open through a sign-out and has a session again is signed in like any
// other: its next sign-out is a new one, not the first one's settled promise.
subscribeSignedOut(() => {
  if (!isSignedOut()) logoutPromise = null;
});

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

    // 0. Tell the backend so the access token is blacklisted and the event
    // is recorded in the security activity log. Must run before the store/
    // storage reset below, since that's what carries the access token.
    // (Note: there is no POST /api/v1/audit-logs/ route on the backend —
    // an earlier version of this call posted there and always 404'd
    // silently, which is why logout never showed up in the activity log.)
    try {
      await apiClient.users.logout();
    } catch (e) {
      log.error(
        "[Auth] Backend logout call failed, continuing local logout",
        e,
      );
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

    // The support chat's session ends with the account's (#711); nothing when it never opened.
    resetSupportChat();

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

    // 7. Force a hard reload to ensure all in-memory state is wiped. A page that can't be left
    // at once (a form with unsaved changes) says it is signed out instead of looking alive.
    log.info(`[Auth] Redirecting to ${callbackUrl}`);
    leaveSignedOut(callbackUrl);
  } catch (error) {
    log.error("[Auth] Logout failed", error);
    // Fallback force reload even if something failed
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      leaveSignedOut(callbackUrl);
    }
  }
}
