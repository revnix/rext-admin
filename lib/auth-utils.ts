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
