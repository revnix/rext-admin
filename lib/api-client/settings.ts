/**
 * Settings API Namespace
 *
 * Handles settings-related operations: notifications, sessions, security
 */

import type {
  NotificationPreferences,
  NotificationPreferencesApiResponse,
} from "@/schemas/notification-schemas";
import type {
  RevokeAllSessionsResponse,
  RevokeSessionResponse,
  SessionListResponse,
  UserSession,
} from "@/types/user-session";
import type { ApiClient } from "./core";
import { buildUrl } from "@/lib/url-utils";
import { ENDPOINTS } from "./endpoints";

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export function createNotificationsNamespace(client: ApiClient) {
  return {
    /**
     * Get notification preferences
     */
    getPreferences: async () => {
      return client.request<NotificationPreferencesApiResponse>(
        ENDPOINTS.SETTINGS.notifications.getPreferences,
        {
          method: "GET",
        },
      );
    },

    /**
     * Update notification preferences
     */
    updatePreferences: async (
      preferences: Partial<NotificationPreferences>,
    ) => {
      return client.request<NotificationPreferencesApiResponse>(
        ENDPOINTS.SETTINGS.notifications.updatePreferences,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        },
      );
    },
  };
}

// ============================================================================
// SESSIONS
// ============================================================================

export function createSessionsNamespace(client: ApiClient) {
  return {
    /**
     * List active sessions
     */
    list: async (): Promise<SessionListResponse> => {
      const response = await client.request<SessionListResponse>(
        ENDPOINTS.SETTINGS.sessions.list,
        {
          method: "GET",
        },
      );

      return {
        ...response,
        sessions: response.sessions.map((s): UserSession => {
          const session = s as UserSession & {
            device?: string;
            browser?: string;
            last_active?: string;
          };
          return {
            ...s,
            device_name:
              session.device_name ?? session.device ?? "Unknown Device",
            device_type: session.device_type ?? null,
            ip_address: session.ip_address ?? null,
            user_agent: session.user_agent ?? session.browser ?? null,
            created_at: session.created_at ?? null,
            last_activity_at:
              session.last_activity_at ?? session.last_active ?? null,
            is_current: Boolean(session.is_current),
          };
        }),
      };
    },

    /**
     * Revoke a specific session
     */
    revoke: async (sessionId: string) => {
      return client.request<RevokeSessionResponse>(
        ENDPOINTS.SETTINGS.sessions.revoke(sessionId),
        {
          method: "DELETE",
        },
      );
    },

    /**
     * Revoke all sessions except current
     */
    revokeAll: async () => {
      return client.request<RevokeAllSessionsResponse>(
        ENDPOINTS.SETTINGS.sessions.revokeAll,
        {
          method: "DELETE",
        },
      );
    },
  };
}

// ============================================================================
// SECURITY
// ============================================================================
// User-scoped security endpoints for current authenticated user

export function createSecurityNamespace(client: ApiClient) {
  return {
    /**
     * Get login history for current user
     */
    getLoginHistory: async (options?: { limit?: number; offset?: number }) => {
      const endpoint = buildUrl(ENDPOINTS.SETTINGS.security.loginHistory, {
        limit: options?.limit,
        offset: options?.offset,
      });

      const response = await client.request<{
        message?: string;
        user_id?: string;
        full_name?: string;
        email?: string;
        login_history?: Array<{
          id?: string;
          timestamp?: string;
          created_at?: string;
          ip_address?: string | null;
          location?: string;
          device?: string;
          browser?: string | null;
          user_agent?: string | null;
          success?: boolean;
          status?: "success" | "failed";
        }>;
        history?: Array<{
          id?: string;
          timestamp?: string;
          created_at?: string;
          ip_address?: string | null;
          location?: string;
          device?: string;
          browser?: string | null;
          user_agent?: string | null;
          success?: boolean;
          status?: "success" | "failed";
        }>;
        total_count?: number;
        total?: number;
        has_more?: boolean;
      }>(endpoint, {
        method: "GET",
      });

      const normalizedHistory = (
        response.history ??
        response.login_history ??
        []
      ).map((event) => {
        const status = event.status ?? (event.success ? "success" : "failed");
        const createdAt =
          event.created_at ?? event.timestamp ?? new Date(0).toISOString();

        return {
          ...event,
          id: event.id ?? `${createdAt}-${event.ip_address ?? "unknown"}`,
          created_at: createdAt,
          success: event.success ?? status === "success",
          browser: event.browser ?? event.user_agent ?? "Unknown",
          ip_address: event.ip_address ?? null,
        };
      });

      // Normalize backend payloads that use either `login_history` or `history`,
      // and older fields like `timestamp` / `status` instead of `created_at` / `success`.
      return {
        history: normalizedHistory,
        total_count:
          response.total_count ?? response.total ?? normalizedHistory.length,
      };
    },

    /**
     * Get active sessions count
     */
    getActiveSessionsCount: async () => {
      return client.request<{
        user_id: string;
        active_sessions_count: number;
      }>(ENDPOINTS.SETTINGS.security.activeSessionsCount, {
        method: "GET",
      });
    },
  };
}
