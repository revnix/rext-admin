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
export const AUTH_SESSION_TOKEN_SWAP_ACTION = "replace-backend-tokens";

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
const BACKEND_REFRESH_LOCK_NAME = "rext-backend-token-refresh";

export interface BackendRefreshSnapshot {
  accessToken?: string | null;
  accessTokenExpires?: number;
}

function accessTokenExpiry(
  token: string | null | undefined,
): number | undefined {
  if (!token) return undefined;
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return undefined;
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function sessionAdvancedPast(
  session: Session | null,
  snapshot: BackendRefreshSnapshot,
): boolean {
  if (!session || session.error) return false;
  if (
    snapshot.accessToken &&
    session.user?.accessToken === snapshot.accessToken
  ) {
    return false;
  }

  const previousExpiry =
    snapshot.accessTokenExpires ?? accessTokenExpiry(snapshot.accessToken);
  const currentExpiry =
    session.accessTokenExpires ??
    accessTokenExpiry(session.user?.accessToken ?? null);

  // Token inequality alone is not directionality: an out-of-order Auth.js
  // response can regress the cookie from A1 to A0. Only a strictly later
  // signed access expiry proves that another caller advanced the session.
  return (
    typeof previousExpiry === "number" &&
    typeof currentExpiry === "number" &&
    currentExpiry > previousExpiry
  );
}

async function withBackendSessionLock<T>(
  operation: () => Promise<T>,
): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(BACKEND_REFRESH_LOCK_NAME, operation);
  }
  return operation();
}

async function runCoordinatedBackendRefresh(
  performRefresh: () => Promise<Session | null>,
  snapshot?: BackendRefreshSnapshot,
): Promise<Session | null> {
  const refreshIfStillNeeded = async () => {
    // Re-read after acquiring the origin-wide lock. A different tab may have
    // completed the rotation while this caller was waiting.
    if (snapshot) {
      const latestSession = await getSession({ broadcast: false });
      if (sessionAdvancedPast(latestSession, snapshot)) {
        return latestSession;
      }
    }

    const refreshedSession = await performRefresh();
    if (refreshedSession?.user?.accessToken) {
      clearAuthHeadersCache();
    }
    return refreshedSession;
  };

  return withBackendSessionLock(refreshIfStillNeeded);
}

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
  snapshot?: BackendRefreshSnapshot,
): Promise<Session | null> {
  if (!backendRefreshPromise) {
    backendRefreshPromise = runCoordinatedBackendRefresh(
      performRefresh,
      snapshot,
    ).finally(() => {
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
    // Internal reads must not broadcast. Auth.js responds to a broadcast by
    // making every other tab read the session too, turning ten callers into
    // a cross-tab request storm.
    const readAfterCurrentRefresh = async () => {
      if (backendRefreshPromise) {
        try {
          await backendRefreshPromise;
        } catch {
          // The read below remains useful after a transient refresh failure.
        }
      }
      return withBackendSessionLock(() => getSession({ broadcast: false }));
    };
    sessionFetchPromise = readAfterCurrentRefresh().finally(() => {
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

  // Client-side: use getSession(), coalesced across concurrent callers
  const session = await fetchSessionSingleFlight();
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

async function isExpiredAccessTokenResponse(
  response: Response,
): Promise<boolean> {
  try {
    const body = await response.clone().json();
    const error = body?.error ?? body;
    const code = String(error?.code ?? body?.code ?? "").toLowerCase();
    const message = String(
      error?.message ?? body?.message ?? body?.detail ?? "",
    ).toLowerCase();

    return (
      code === "token_expired" ||
      message.includes("authentication token has expired") ||
      message === "token has expired"
    );
  } catch {
    return false;
  }
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

  if (response.status !== 401 || !retry || typeof window === "undefined") {
    return response;
  }

  // A 401 is not necessarily an expired access token. Permission failures,
  // revoked impersonation sessions, and endpoint-specific authentication
  // rules must not rotate credentials or sign every tab out. Only the
  // backend's typed expiry response enters refresh recovery.
  if (!(await isExpiredAccessTokenResponse(response))) {
    return response;
  }

  clearAuthHeadersCache();
  const usedAccessToken = headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "");

  // Impersonation tokens deliberately cannot refresh into normal target-user
  // tokens. Once the short-lived override expires, drop it and resume the
  // still-valid original admin session instead of retrying the same expired
  // Zustand token forever.
  const impersonationStore = useAuthStore.getState();
  if (
    impersonationStore.accessToken &&
    impersonationStore.accessToken === usedAccessToken
  ) {
    impersonationStore.clearTokens();
    clearAuthHeadersCache();

    // If this 401 came from an active-impersonation token (useAuthStore,
    // populated only while impersonating — see stores/auth-store.ts), it
    // can't be salvaged by the session refresh below: that refreshes the
    // NextAuth-backed session, which belongs to the ORIGINAL admin, not
    // the impersonated user, and getAuthHeaders() prefers this store over
    // the session unconditionally. Left alone, the retry a few lines down
    // would just resend the same dead impersonation token, get a second
    // (non-retryable) 401, and force the ADMIN's whole session out — even
    // though their real session is still perfectly valid. Clear it now so
    // the retry naturally falls back to the admin's own session instead,
    // ending impersonation gracefully on expiry rather than logging out.
    if (typeof window !== "undefined" && useAuthStore.getState().accessToken) {
      log.warn(
        "[AuthJS] Impersonation token rejected — clearing impersonation state and falling back to the admin session",
      );
      useAuthStore.getState().clearTokens();
    }
    return authenticatedFetch(url, options, false);
  }

  const latestSession = await fetchSessionSingleFlight();

  // Another tab may already have refreshed. Prefer its newer access token
  // before rotating the shared refresh credential again.
  if (
    latestSession?.user?.accessToken &&
    usedAccessToken &&
    sessionAdvancedPast(latestSession, {
      accessToken: usedAccessToken,
      accessTokenExpires: accessTokenExpiry(usedAccessToken),
    })
  ) {
    return authenticatedFetch(url, options, false);
  }

  const refreshedSession = await requestBackendTokenRefresh(
    forceSessionRefresh,
    {
      accessToken: latestSession?.user?.accessToken ?? usedAccessToken,
      accessTokenExpires: latestSession?.accessTokenExpires,
    },
  );

  const refreshAdvanced = sessionAdvancedPast(refreshedSession, {
    accessToken: latestSession?.user?.accessToken ?? usedAccessToken,
    accessTokenExpires:
      latestSession?.accessTokenExpires ?? accessTokenExpiry(usedAccessToken),
  });

  if (refreshAdvanced) {
    return authenticatedFetch(url, options, false);
  }

  if (refreshedSession?.error === "RefreshAccessTokenError") {
    redirectToLogin();
    throw new Error("Session expired");
  }

  // Network errors and 5xx refresh failures are transient. Return the
  // original typed 401 so the caller can handle/retry it without destroying
  // a refresh session that may still be valid for days.
  log.warn("[AuthJS] Access-token refresh did not advance the session", {
    url,
  });
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
