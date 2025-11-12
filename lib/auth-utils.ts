/**
 * AuthJS Authentication Utilities
 *
 * Provides utilities for getting session tokens and making authenticated
 * API requests using AuthJS (next-auth) sessions.
 */

import { getSession } from "next-auth/react";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { log } from "@/lib/logger";

// Cache for auth headers to avoid excessive session checks
let authHeadersCache: {
  headers: Record<string, string>;
  timestamp: number;
} | null = null;

// Single shared in-flight promise for getSession() on client so concurrent calls reuse it
let sessionPromise: Promise<Session | null> | null = null;

const CACHE_TTL_MS = 10000; // Cache for 10 seconds

/**
 * Get authentication headers for API requests
 * Works in both client and server components
 */
export async function getAuthHeaders(
  skipCache: boolean = false,
): Promise<Record<string, string>> {
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

  // Client-side: check if we already have cached headers first
  if (!skipCache && authHeadersCache) {
    const now = Date.now();
    if (now - authHeadersCache.timestamp < CACHE_TTL_MS) {
      return authHeadersCache.headers;
    }
  }

  // If there's already a sessionPromise in-flight, await it to avoid duplicate getSession() calls
  if (!skipCache && sessionPromise) {
    try {
      const cachedSession = await sessionPromise;
      const headers = buildHeadersFromSession(cachedSession);
      // store into cache for subsequent requests
      authHeadersCache = { headers, timestamp: Date.now() };
      return headers;
    } catch (_err) {
      // fallthrough to new attempt
      sessionPromise = null;
    }
  }

  // create new in-flight promise and store it
  sessionPromise = (async () => {
    try {
      const session = await getSession();
      return session;
    } finally {
      // note: we don't null sessionPromise here immediately so concurrent callers can still await
    }
  })();

  let session: Session | null;
  try {
    session = await sessionPromise;
  } catch (err) {
    // clear failed promise so next call can retry
    sessionPromise = null;
    log.error("[AuthJS] getSession() failed", err);
    return {};
  } finally {
    // clear sessionPromise after resolution so a subsequent call after TTL will re-run
    sessionPromise = null;
  }

  const headers = buildHeadersFromSession(session);

  // cache the headers
  authHeadersCache = {
    headers,
    timestamp: Date.now(),
  };

  return headers;
}

function buildHeadersFromSession(session: Session | null): Record<string, string> {
  const headers: Record<string, string> = {};
   const token = session?.user?.accessToken as string | undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    log.debug("[AuthJS] Got access token from session", {
      tokenLength: token.length,
      tokenPreview: `${token.substring(0, 10)}...`,
    });
  } else {
    log.warn("[AuthJS] No access token in client session", {
      hasSession: !!session,
      hasUser: !!session?.user,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
    });
  }
  return headers;
}

/**
 * Authenticated fetch wrapper using AuthJS tokens
 * Automatically adds Authorization header from session
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
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

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    log.error("[AuthJS] Session expired, redirecting to login");
    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  return response;
}
