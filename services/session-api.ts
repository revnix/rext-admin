/**
 * Session Management API Service
 *
 * Handles user session operations: listing, revoking, and activity tracking.
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import type {
  RevokeAllSessionsResponse,
  RevokeSessionResponse,
  SessionListResponse,
} from "@/types/user-session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:2024";

/**
 * Session API Service
 */
export class SessionApiService {
  /**
   * List all active sessions for the current user
   */
  static async listSessions(): Promise<SessionListResponse> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/sessions`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data as SessionListResponse; // Extract from success() wrapper
  }

  /**
   * Revoke a specific session (logout on that device)
   *
   * @param sessionId - UUID of the session to revoke
   */
  static async revokeSession(
    sessionId: string,
  ): Promise<RevokeSessionResponse> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/sessions/${sessionId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to revoke session: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data as RevokeSessionResponse;
  }

  /**
   * Revoke all sessions except the current one (logout all other devices)
   */
  static async revokeAllSessions(): Promise<RevokeAllSessionsResponse> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/sessions`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to revoke all sessions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data as RevokeAllSessionsResponse;
  }
}

// Export singleton instance
export const sessionApiService = SessionApiService;
