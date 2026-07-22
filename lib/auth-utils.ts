/**
 * AuthJS Authentication Utilities
 *
 * Provides utilities for getting session tokens and making authenticated
 * API requests using AuthJS (next-auth) sessions.
 */

import type { Session } from "next-auth";
import { getCsrfToken, getSession } from "next-auth/react";
import { auth } from "@/auth";
import { log } from "@/lib/logger";
import { useAuthStore } from "@/stores/auth-store";

// Cache for auth headers to avoid excessive session checks
let authHeadersCache: {
  headers: Record<string, string>;
  timestamp: number;
} | null = null;
const CACHE_TTL_MS = 10000; // Cache for 10 seconds

// DEBUG: decode a JWT payload without verifying it, for tracing token
// identity (jti) across the refresh/session/request pipeline. Not for
// trust decisions — logging only.
function decodeJwtForDebug(token: string | undefined | null): { jti?: string } | null {
  if (!token) return null;
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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

// Shared with auth.config.ts's jwt() callback, which checks this exact
// value on trigger === "update" to decide whether to force a real backend
// refresh. Defined here (not there) so both this file and any client
// component can import one source of truth instead of hardcoding the string.
export const AUTH_SESSION_UPDATE_ACTION = "refresh-backend-token";

// Debounced redirect state to prevent multiple simultaneous 401 redirects
let isRedirectingToLogin = false;

// Mutex: shared by EVERY trigger of an explicit backend refresh — the
// reactive 401 handler below, and the proactive timer in
// SessionTimeoutWarning (which passes its own `update()` call in as
// `performRefresh` so React's session state still updates correctly, while
// still sharing this same lock). Without a shared lock, the proactive and
// reactive paths have no knowledge of each other and can independently fire
// the same "refresh-backend-token" action within milliseconds of each other
// — racing the backend's single-use refresh token and getting one of them
// hard-rejected as "revoked" instead of gracefully reusing the other's result.
let backendRefreshPromise: Promise<Session | null> | null = null;

/**
 * Request an explicit backend token refresh, single-flight across every
 * caller regardless of which trigger (proactive timer, reactive 401, a
 * second tab's own attempt) started it first.
 *
 * `performRefresh` defaults to the raw-fetch replica below (for callers
 * outside a React component). A component can instead pass NextAuth's own
 * `update()` so SessionProvider's context updates too — that still shares
 * this same mutex, so a caller that loses the race just awaits the winner's
 * result instead of firing its own request.
 */
export function requestBackendTokenRefresh(
  performRefresh: () => Promise<Session | null> = forceSessionRefresh,
): Promise<Session | null> {
  if (!backendRefreshPromise) {
    backendRefreshPromise = performRefresh().finally(() => {
      backendRefreshPromise = null;
    });
  }
  return backendRefreshPromise;
}

// Mutex: getAuthHeaders() is called concurrently by every service on the
// page (profile, subscription, permissions, notifications, ...) whenever a
// page mounts. The headers cache below is only written *after* getSession()
// resolves, so without this, every one of those concurrent callers would
// independently hit GET /api/auth/session before the first response lands
// — a stampede of duplicate requests for the same session. Sharing one
// in-flight promise collapses them into a single network call.
let sessionFetchPromise: Promise<Session | null> | null = null;

export function fetchSessionSingleFlight(): Promise<Session | null> {
  if (!sessionFetchPromise) {
    sessionFetchPromise = getSession().finally(() => {
      sessionFetchPromise = null;
    });
  }
  return sessionFetchPromise;
}

/**
 * Force an actual backend token refresh, bypassing the JWT callback's
 * "still within accessTokenExpires" short-circuit. A plain getSession()
 * only refreshes when the client's cached expiry has passed — but a 401
 * means the backend already rejected the token (revoked, blacklisted,
 * clock skew), regardless of what the client's local timestamp says. This
 * replicates what next-auth/react's `update()` does internally (POST to
 * the session endpoint), since `update` is only available via the
 * useSession() hook and this file isn't a component.
 */
async function forceSessionRefresh(): Promise<Session | null> {
  const csrfToken = await getCsrfToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      csrfToken,
      data: { authAction: AUTH_SESSION_UPDATE_ACTION },
    }),
  });
  if (!response.ok) return null;
  return (await response.json()) as Session;
}

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
      log.info(
        `[DEBUG-TOKEN] getAuthHeaders using IMPERSONATION STORE token jti=${decodeJwtForDebug(accessToken)?.jti}`,
      );
      return {
        Authorization: `Bearer ${accessToken}`,
      };
    }
  }

  // Check cache first (only on client-side)
  if (typeof window !== "undefined" && !skipCache && authHeadersCache) {
    const now = Date.now();
    if (now - authHeadersCache.timestamp < CACHE_TTL_MS) {
      log.info(
        `[DEBUG-TOKEN] getAuthHeaders using CACHED headers (age=${now - authHeadersCache.timestamp}ms) jti=${decodeJwtForDebug(authHeadersCache.headers.Authorization?.replace("Bearer ", ""))?.jti}`,
      );
      return authHeadersCache.headers;
    }
  }

  // Server-side: use auth()
  if (typeof window === "undefined") {
    const session = await auth();
    if (session?.user?.accessToken) {
      log.info(
        `[DEBUG-TOKEN] getAuthHeaders(server) using session token jti=${decodeJwtForDebug(session.user.accessToken)?.jti}`,
      );
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

  // Client-side: use getSession(), coalesced across concurrent callers
  const session = await fetchSessionSingleFlight();
  const headers: Record<string, string> = {};

  if (session?.user?.accessToken) {
    headers.Authorization = `Bearer ${session.user.accessToken}`;
    log.debug("[AuthJS] Got access token from session", {
      tokenLength: session.user.accessToken.length,
      tokenPreview: `${session.user.accessToken.substring(0, 10)}...`,
    });
    log.info(
      `[DEBUG-TOKEN] getAuthHeaders(client, skipCache=${skipCache}) using FRESH session token jti=${decodeJwtForDebug(session.user.accessToken)?.jti}`,
    );
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

  log.info(
    `[DEBUG-TOKEN] authenticatedFetch -> ${url} using access_token jti=${decodeJwtForDebug(headers.get("Authorization")?.replace("Bearer ", ""))?.jti} retry=${retry}`,
  );

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - session might be expired
  if (response.status === 401) {
    log.info(
      `[DEBUG-TOKEN] authenticatedFetch <- ${url} got 401 with access_token jti=${decodeJwtForDebug(headers.get("Authorization")?.replace("Bearer ", ""))?.jti}`,
    );
    if (retry) {
      log.info("[AuthJS] Got 401, attempting to refresh session and retry...");

      // Clear the auth headers cache to force a fresh session check
      clearAuthHeadersCache();

      // For client-side, force a real backend refresh (not a conditional
      // getSession(), which no-ops if the local expiry clock hasn't caught
      // up with the backend's 401).
      if (typeof window !== "undefined") {
        const session = await requestBackendTokenRefresh();

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
