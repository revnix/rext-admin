/**
 * AuthJS Authentication Utilities
 *
 * Provides utilities for getting session tokens and making authenticated
 * API requests using AuthJS (next-auth) sessions.
 */

import type { Session } from "next-auth";
import { getCsrfToken, getSession } from "next-auth/react";
import { auth } from "@/auth";
import {
  isSignedOut,
  leaveSignedOut,
  reportSignedIn,
  reportSignedOut,
  SESSION_UNCONFIRMED,
  SESSION_UNCONFIRMED_MESSAGE,
  SIGNED_OUT,
  SIGNED_OUT_MESSAGE,
  signInUrlFromHere,
  subscribeSignedOut,
} from "@/lib/auth/signed-out";
import { opensWithoutSession } from "@/lib/auth-routes";
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
// Re-reads platform role/permissions without rotating any token.
export const AUTH_SESSION_SYNC_PERMISSIONS_ACTION = "sync-permissions";
// Dispatched on window when the backend answers 403, so PermissionSync can
// check whether the session's permissions have gone stale.
export const PERMISSIONS_STALE_EVENT = "rext:permissions-stale";

// Debounced redirect state to prevent multiple simultaneous 401 redirects
let isRedirectingToLogin = false;
// A page that stayed open through a sign-out and has a session again (the person signed in from
// another tab) is an ordinary signed-in page: its next sign-out must be able to run.
subscribeSignedOut(() => {
  if (!isSignedOut()) isRedirectingToLogin = false;
});
// Set by classifyUnauthorized() when the 401 was a suspended/banned account, so
// the forced sign-out can tell the login page why.
let blockedAccountError: string | null = null;

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
export function redirectToLogin(errorCode: string = "SessionExpired"): void {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  log.error(`[AuthJS] ${errorCode}, redirecting to login`);

  // Clear the auth headers cache immediately
  authHeadersCache = null;

  // Use setTimeout(0) to batch multiple 401 responses in the same tick
  setTimeout(async () => {
    if (typeof window !== "undefined") {
      try {
        // Use dynamic import to avoid circular dependency
        const { performLogout } = await import("./logout-utils");

        await performLogout(signInUrlFromHere(errorCode));
      } catch (error) {
        log.error(
          "[AuthJS] Failed to perform controlled logout, falling back to basic redirect",
          error,
        );
        // Fallback cleanup
        localStorage.clear();
        sessionStorage.clear();
        leaveSignedOut(`/login?error=${errorCode}`);
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
    reportSignedIn();
    log.debug("[AuthJS] Got access token from session", {
      tokenLength: session.user.accessToken.length,
      tokenPreview: `${session.user.accessToken.substring(0, 10)}...`,
    });
  } else {
    log.warn("[AuthJS] No access token in client session", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserKey: !!session?.user?.id,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
    });
  }

  // Cache the headers on client-side - but never cache an empty/unauthenticated
  // result. Any unauthenticated call (e.g. validating an invitation token on
  // /invitations/accept before the user signs in) would otherwise poison the
  // cache with `{}` for CACHE_TTL_MS. If sign-in completes inside that window,
  // every request fired by the destination page (dashboard queries, invitation
  // accept, subscription usage, etc.) reads the stale empty cache instead of
  // the fresh session and gets a 422 "authorization: Field required" from the
  // backend even though the user is, in fact, logged in.
  if (headers.Authorization) {
    authHeadersCache = {
      headers,
      timestamp: Date.now(),
    };
  } else {
    authHeadersCache = null;
  }

  return headers;
}

// Backend 401s that mean the *session itself* is gone rather than the access
// token merely having aged out. Refreshing cannot recover any of these: the
// refresh token belongs to the same session the backend has already discarded
// (deleted/deactivated UserSession row, blacklisted jti, deleted user), so the
// only correct response is a clean sign-out.
//
// These must be matched on the message, not the code: the backend raises them
// as a plain RextAuthenticationException, which carries the same generic
// `unauthorized` error_code as an ordinary permission failure — and a
// permission failure must NOT sign anyone out. See the backend's
// _ensure_active_user_session() and get_current_active_user() for the sources.
const REVOKED_SESSION_MESSAGES = [
  "authentication session has been revoked",
  "authentication session is invalid",
  "token has been revoked",
  "user not found or has been deleted",
  "user not found",
  "user session not found",
  "session not found",
  "could not validate credentials",
  "could not validate auth token",
  "invalid authentication credentials",
  "invalid token",
  "token is invalid",
  // The token itself failed its check (a bad signature, a malformed token, no user in it).
  "invalid authentication token",
  "user id missing in token payload",
  "invalid refresh token",
  "refresh token revoked",
  "refresh token expired",
  "invalid session",
];

// Account statuses the backend reports via a typed error_code on every
// authenticated request once an admin suspends or bans the user. Mapped to the
// message the login page shows after the forced sign-out.
const BLOCKED_ACCOUNT_ERRORS: Record<string, string> = {
  account_suspended: "AccountSuspended",
  account_banned: "AccountBanned",
};

type UnauthorizedKind = "expired" | "revoked" | "other";

/**
 * Classify a 401 once, from a single body read.
 *
 * - "expired": the access token aged out — recoverable by refreshing.
 * - "revoked": the backend session is gone — only a sign-out recovers.
 * - "other":   permission denied, endpoint-specific auth, etc. — pass through
 *              untouched so callers can handle it without disturbing the session.
 */
async function classifyUnauthorized(
  response: Response,
): Promise<UnauthorizedKind> {
  blockedAccountError = null;
  try {
    const body = await response.clone().json();
    const error = body?.error ?? body;
    const code = String(error?.code ?? body?.code ?? "").toLowerCase();
    const message = String(
      error?.message ?? body?.message ?? body?.detail ?? "",
    ).toLowerCase();

    if (
      code === "token_expired" ||
      message.includes("authentication token has expired") ||
      message === "token has expired"
    ) {
      return "expired";
    }

    if (BLOCKED_ACCOUNT_ERRORS[code]) {
      blockedAccountError = BLOCKED_ACCOUNT_ERRORS[code];
      return "revoked";
    }

    if (REVOKED_SESSION_MESSAGES.some((pattern) => message.includes(pattern))) {
      return "revoked";
    }

    return "other";
  } catch {
    return "other";
  }
}

// How long to wait before each second look at a "session revoked" answer.
const REVOKED_ASKED_AGAIN_AFTER_MS = [700, 1500];

/** Waits `ms`, or ends at once with the caller's own cancellation. */
function waitUnlessCancelled(
  ms: number,
  signal?: AbortSignal | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancelled = () =>
      signal?.reason ??
      new DOMException("The request was aborted", "AbortError");
    if (signal?.aborted) {
      reject(cancelled());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(cancelled());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// How long an empty session read waits before it is read once more.
const SESSION_READ_AGAIN_AFTER_MS = 300;

/** Whether the page this runs on is one the route guard opens only with a session. */
function pageNeedsSession(): boolean {
  return (
    typeof window !== "undefined" &&
    !opensWithoutSession(window.location.pathname)
  );
}

/**
 * An answer the dashboard gives itself, in the shape of the API's own refusals, so that every
 * caller reads it the way it reads any other: a status, a code and a sentence to show.
 */
function ownAnswer(status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({ success: false, error: { code, message } }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

/**
 * Whether a 503 says the server could not run its session check (rextaihq/rext-backend#1000: the
 * check's own reads failed, in a stopping process's last seconds). The request never reached its
 * handler then, so sending it again repeats nothing, whatever its method.
 */
async function sessionCheckCouldNotRun(response: Response): Promise<boolean> {
  try {
    const body = await response.clone().json();
    const error = body?.error ?? body;
    const message = String(
      error?.message ?? body?.message ?? body?.detail ?? "",
    ).toLowerCase();
    return message.includes("could not check your session");
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
  let authHeaders = await getAuthHeaders(!retry);

  // No request leaves a signed-in page without its token (revnix/rext-control#858). Sent bare,
  // it was answered 422 "Authorization: Field required", which nothing retried and the person
  // read as it stood. An empty read can be a passing failure, so the session is read once more;
  // still nothing means the page outlived its session. Nothing is sent, the page says so
  // (lib/auth/signed-out.ts), and the caller gets a refusal in plain words. Nobody is signed
  // out on this: a later read that finds a token puts everything back. A page that opens
  // without a session (an invitation looked up before signing in) sends as before.
  if (!authHeaders.Authorization && pageNeedsSession()) {
    if (!isSignedOut()) {
      await waitUnlessCancelled(SESSION_READ_AGAIN_AFTER_MS, options.signal);
      authHeaders = await getAuthHeaders(true);
    }
    if (!authHeaders.Authorization) {
      log.warn("[AuthJS] No session on a signed-in page: request not sent", {
        url,
      });
      reportSignedOut();
      return ownAnswer(401, SIGNED_OUT, SIGNED_OUT_MESSAGE);
    }
  }

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

  // A body that is a stream is used up by the first send, so it can't be sent again.
  const canAskAgain = !(
    typeof ReadableStream !== "undefined" &&
    options.body instanceof ReadableStream
  );
  let response: Response;
  let unauthorizedKind: UnauthorizedKind;
  for (let asked = 0; ; asked++) {
    response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 403 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(PERMISSIONS_STALE_EVENT));
    }

    // The server could not check the session (a 503 in its own words): the same request is sent
    // again, twice at most, as a "revoked" answer is below. A POST too: it was never carried out.
    if (
      response.status === 503 &&
      typeof window !== "undefined" &&
      canAskAgain &&
      asked < REVOKED_ASKED_AGAIN_AFTER_MS.length &&
      (await sessionCheckCouldNotRun(response))
    ) {
      await waitUnlessCancelled(
        REVOKED_ASKED_AGAIN_AFTER_MS[asked],
        options.signal,
      );
      continue;
    }

    if (response.status !== 401 || typeof window === "undefined") {
      return response;
    }

    // A 401 is not necessarily an expired access token. Permission failures,
    // revoked impersonation sessions, and endpoint-specific authentication
    // rules must not rotate credentials or sign every tab out. Only the
    // backend's typed expiry response enters refresh recovery. The request sent
    // again after a refresh (`retry` false) is read the same way: a session
    // revoked between the refresh and that request is still a verdict, and
    // nothing above this wrapper acts on a 401 any more.
    unauthorizedKind = await classifyUnauthorized(response);

    // A "session revoked" answer is not believed at once (revnix/rext-control#858). In the
    // minute after the API restarts, a session that exists has been answered "revoked" and
    // accepted again within a second; signing out on the first answer put people who had just
    // signed in back on the sign-in page. The request never reached its handler, so the same
    // one is sent again, twice at most, and whatever comes back is handled as a first answer
    // would be. A suspended or banned account is not asked again: that is the account's own
    // status. A caller that cancels meanwhile gets its cancellation, never a sign-out.
    if (
      unauthorizedKind !== "revoked" ||
      blockedAccountError ||
      !canAskAgain ||
      asked >= REVOKED_ASKED_AGAIN_AFTER_MS.length
    ) {
      break;
    }
    await waitUnlessCancelled(
      REVOKED_ASKED_AGAIN_AFTER_MS[asked],
      options.signal,
    );
  }

  // The backend has discarded this session entirely — most commonly because the
  // daily cleanup job deleted the UserSession row (it drops rows whose
  // last_activity_at is older than USER_SESSION_INACTIVE_DAYS, or whose
  // expires_at has passed), but also on an admin revoke or a deleted user.
  //
  // Refreshing is pointless here: the refresh token belongs to the same dead
  // session. Without this branch the request just returns 401 to the caller
  // while the Auth.js cookie stays valid and error-free — so proxy.ts still
  // sees `isLoggedIn` and never redirects. The user is left on a dashboard
  // where every call 401s, with no path back to /login short of manually
  // clearing cookies. Sign out cleanly instead.
  //
  // redirectToLogin() is debounced, so a burst of parallel 401s (the dashboard
  // fires several at once) still produces exactly one logout.
  if (unauthorizedKind === "revoked") {
    log.warn(
      "[AuthJS] Backend reports the session is no longer valid — signing out",
      { url },
    );
    redirectToLogin(blockedAccountError ?? "SessionEnded");
    throw new Error(blockedAccountError ?? "Session expired");
  }

  if (unauthorizedKind !== "expired") {
    return response;
  }

  // "Expired" again, for the request sent with the token a refresh has just given: no second
  // refresh, and no verdict either. The caller is told to try again, as below.
  if (!retry) {
    log.warn("[AuthJS] A token just renewed was answered as expired", { url });
    return ownAnswer(503, SESSION_UNCONFIRMED, SESSION_UNCONFIRMED_MESSAGE);
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

  // The refresh did not advance the session and was not refused either: every try failed in
  // passing (the API restarting, a network error), or the session update itself gave no answer.
  // That is not a verdict on the session, and signing out on it ended sessions whose refresh
  // token was good for days (revnix/rext-control#858). What the session says now decides.
  const sessionNow = await fetchSessionSingleFlight();
  if (sessionNow?.error === "RefreshAccessTokenError") {
    redirectToLogin();
    throw new Error("Session expired");
  }
  if (!sessionNow?.user?.accessToken) {
    // No session at all: it ended somewhere else (another tab signed out).
    log.warn("[AuthJS] The session is gone after an expired token", { url });
    if (pageNeedsSession()) reportSignedOut();
    return ownAnswer(401, SIGNED_OUT, SIGNED_OUT_MESSAGE);
  }
  // Still signed in, with a token that could not be renewed just now. This request fails as a
  // server that is away does (a GET is tried again by the API client), and the next one tries
  // the refresh again.
  log.warn(
    "[AuthJS] Access-token refresh did not advance and was not refused: the request fails, the session stays",
    { url },
  );
  return ownAnswer(503, SESSION_UNCONFIRMED, SESSION_UNCONFIRMED_MESSAGE);
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
