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
import type { SecurityStats } from "@/types/security";
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
          const session = s as any;
          return {
            ...s,
            device_name: session.device_name ?? session.device ?? "Unknown Device",
            device_type: session.device_type ?? null,
            ip_address: session.ip_address ?? null,
            user_agent: session.user_agent ?? session.browser ?? null,
            created_at: session.created_at ?? null,
            last_activity_at: session.last_activity_at ?? session.last_active ?? null,
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
// Admin security monitoring endpoints are at /api/v1/security/* (admin-only)

export function createSecurityNamespace(client: ApiClient) {
  return {
    /**
     * Get security stats for current user
     */
    getStats: async () => {
      return client.request<SecurityStats>(ENDPOINTS.SETTINGS.security.stats, {
        method: "GET",
      });
    },

    /**
     * Get login history for current user
     */
    getLoginHistory: async (options?: { limit?: number; offset?: number }) => {
      const endpoint = buildUrl(ENDPOINTS.SETTINGS.security.loginHistory, {
        limit: options?.limit,
        offset: options?.offset,
      });

      return client.request<{
        history: Array<{
          id: string;
          ip_address: string;
          location: string;
          device: string;
          browser: string;
          success: boolean;
          created_at: string;
        }>;
        total_count: number;
      }>(endpoint, {
        method: "GET",
      });
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

// ============================================================================
// PREFERENCES
// ============================================================================

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  date_format: string;
  time_format: string;
  items_per_page: number;
  sidebar_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

export function createPreferencesNamespace(client: ApiClient) {
  return {
    /**
     * Get user preferences
     */
    get: async () => {
      return client.request<UserPreferences>(
        ENDPOINTS.SETTINGS.preferences.get,
        {
          method: "GET",
        },
      );
    },

    /**
     * Update user preferences
     */
    update: async (preferences: {
      theme?: "system" | "light" | "dark";
      date_format?: "iso" | "us" | "eu" | "relative";
      time_format?: "24h" | "12h";
      items_per_page?: number;
      sidebar_collapsed?: boolean;
    }) => {
      return client.request<UserPreferences>(
        ENDPOINTS.SETTINGS.preferences.update,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        },
      );
    },
  };
}
