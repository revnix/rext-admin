/**
 * AuthJS Authentication Utilities
 *
 * Provides utilities for getting session tokens and making authenticated
 * API requests using AuthJS (next-auth) sessions.
 */

import { getSession } from "next-auth/react";
import { auth } from "@/auth";
import { log } from "@/lib/logger";

/**
 * Get authentication headers for API requests
 * Works in both client and server components
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
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
  if (session?.user?.accessToken) {
    return {
      Authorization: `Bearer ${session.user.accessToken}`,
    };
  }
  log.warn("[AuthJS] No access token in client session", {
    hasSession: !!session,
    hasUser: !!session?.user,
  });
  return {};
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

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
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
