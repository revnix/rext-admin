/**
 * AuthJS Authentication Utilities
 *
 * Provides utilities for getting session tokens and making authenticated
 * API requests using AuthJS (next-auth) sessions.
 */

import { getSession } from "next-auth/react";
import { auth } from "@/auth";
import { log } from "@/lib/logger";
import { useAuthStore } from "@/stores/auth-store";

// Cache for auth headers to avoid excessive session checks
let authHeadersCache: {
  headers: Record<string, string>;
  timestamp: number;
} | null = null;
const CACHE_TTL_MS = 10000; // Cache for 10 seconds

export const ROLE_HIERARCHY = [
  "super_admin",
  "admin",
  "workspace_owner",
  "workspace_admin",
  "editor",
  "viewer",
  "user",
] as const;

export function normalizeRole(role: string): string {
  return String(role).toLowerCase().replace(/\s+/g, "_");
}

export function extractNormalizedRoles(data: {
  roles?: string[] | null;
  role?: string | null;
  [key: string]: unknown;
}): string[] {
  const rawRoles: string[] = Array.isArray(data.roles)
    ? data.roles
    : data.role
      ? [data.role]
      : [];
  return rawRoles.map(normalizeRole);
}

export function getPrimaryRole(data: {
  roles?: string[] | null;
  role?: string | null;
  [key: string]: unknown;
}): string {
  const userRoles = extractNormalizedRoles(data);
  return (
    ROLE_HIERARCHY.find((role) => userRoles.includes(role)) ||
    userRoles[0] ||
    "user"
  );
}

// Debounced redirect state to prevent multiple simultaneous 401 redirects
let isRedirectingToLogin = false;

/**
 * Debounced redirect to login page.
 * Ensures only one redirect occurs even when multiple parallel requests return 401.
 * Performs full cleanup of state and storage.
 */
function redirectToLogin(): void {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  log.error("[AuthJS] Session expired, redirecting to login");

  // Clear the auth headers cache immediately
  authHeadersCache = null;

  // Use setTimeout(0) to batch multiple 401 responses in the same tick
  setTimeout(async () => {
    if (typeof window !== "undefined") {
      try {
        // Use dynamic import to avoid circular dependency
        const { performLogout } = await import("./logout-utils");

        const currentPath = window.location.pathname + window.location.search;
        const redirectParam =
          currentPath !== "/login" && currentPath !== "/"
            ? `?redirect=${encodeURIComponent(currentPath)}&error=SessionExpired`
            : "?error=SessionExpired";

        await performLogout(`/login${redirectParam}`);
      } catch (error) {
        log.error(
          "[AuthJS] Failed to perform controlled logout, falling back to basic redirect",
          error,
        );
        // Fallback cleanup
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/login?error=SessionExpired";
      }
    }
  }, 0);
}

/**
 * Get authentication headers for API requests
 * Works in both client and server components
 */
export async function getAuthHeaders(
  skipCache: boolean = false,
): Promise<Record<string, string>> {
  // Check in-memory store for impersonation token first (client-side only)
  // This ensures we always use the latest impersonation token if one exists, bypassing cache
  if (typeof window !== "undefined") {
    const store = useAuthStore.getState();
    const { accessToken } = store;

    if (accessToken) {
      return {
        Authorization: `Bearer ${accessToken}`,
      };
    }
  }

  // Check cache first (only on client-side)
  if (typeof window !== "undefined" && !skipCache && authHeadersCache) {
    const now = Date.now();
    if (now - authHeadersCache.timestamp < CACHE_TTL_MS) {
      return authHeadersCache.headers;
    }
  }

  // Server-side: use auth()
  if (typeof window === "undefined") {
    const session = await auth();
    if (session?.user?.accessToken) {
      return {
        Authorization: `Bearer ${session.user.accessToken}`,
      };
    }
    log.warn("[AuthJS] No access token in server session", {
      hasSession: !!session,
      hasUser: !!session?.user,
    });
    return {};
  }

  // Client-side: use getSession()
  const session = await getSession();
  const headers: Record<string, string> = {};

  if (session?.user?.accessToken) {
    headers.Authorization = `Bearer ${session.user.accessToken}`;
    log.debug("[AuthJS] Got access token from session", {
      tokenLength: session.user.accessToken.length,
      tokenPreview: `${session.user.accessToken.substring(0, 10)}...`,
    });
  } else {
    log.warn("[AuthJS] No access token in client session", {
      hasSession: !!session,
      hasUser: !!session?.user,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
    });
  }

  // Cache the headers on client-side
  authHeadersCache = {
    headers,
    timestamp: Date.now(),
  };

  return headers;
}

/**
 * Authenticated fetch wrapper using AuthJS tokens
 * Automatically adds Authorization header from session
 * Handles 401 Unauthorized by attempting to refresh the session once
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  retry: boolean = true,
): Promise<Response> {
  // Pass skipCache=true if we are in a retry to get the fresh token
  const authHeaders = await getAuthHeaders(!retry);
  const isFormDataBody =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = new Headers(options.headers);
  Object.entries(authHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - session might be expired
  if (response.status === 401) {
    if (retry) {
      log.info("[AuthJS] Got 401, attempting to refresh session and retry...");

      // Clear the auth headers cache to force a fresh session check
      clearAuthHeadersCache();

      // For client-side, we can try to get a fresh session which triggers refresh logic
      if (typeof window !== "undefined") {
        const session = await getSession();

        if (session?.user?.accessToken && !session.error) {
          log.info("[AuthJS] Session refreshed successfully, retrying request");
          // Re-run the fetch once with the new token
          return authenticatedFetch(url, options, false);
        }

        if (session?.error) {
          log.error(
            "[AuthJS] Session refresh failed with error:",
            session.error,
          );
        }
      }
    }

    // If refresh failed or already retried, redirect to login
    redirectToLogin();
    throw new Error("Session expired");
  }

  return response;
}

/**
 * Clear the auth headers cache
 * Useful during logout to ensure fresh auth state
 */
export function clearAuthHeadersCache(): void {
  authHeadersCache = null;
  log.debug("[AuthJS] Auth headers cache cleared");
}

/**
 * Reset any auth redirect state
 * Clears stored redirect URLs from session/local storage
 */
export function resetAuthRedirectState(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("auth_redirect_url");
    sessionStorage.removeItem("pending_invitation_token");
    log.debug("[AuthJS] Auth redirect state reset");
    isRedirectingToLogin = false;
  }
}
