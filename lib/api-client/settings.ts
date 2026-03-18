import type {
  NotificationPreferencesResponse,
  SessionListResponse,
  SessionRevokeResponse,
  BulkSessionRevokeResponse,
  SecurityStatsResponse,
  UserPreferencesResponse,
  UserPreferencesWrappedResponse,
} from "@/types/generated/types.gen";
import type {
  UserSession,
  UserSessionListResponse,
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
    getPreferences: async (): Promise<{
      data: NotificationPreferencesResponse;
    }> => {
      return client.request<{ data: NotificationPreferencesResponse }>(
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
      preferences: Partial<NotificationPreferencesResponse>,
    ): Promise<{ data: NotificationPreferencesResponse }> => {
      return client.request<{ data: NotificationPreferencesResponse }>(
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
    list: async (): Promise<UserSessionListResponse> => {
      const response = await client.request<UserSessionListResponse>(
        ENDPOINTS.SETTINGS.sessions.list,
        {
          method: "GET",
        },
      );

      return {
        ...response,
        sessions: (response?.sessions || []).map((s): UserSession => {
          return {
            ...s,
            device_name: s.device_name ?? "Unknown Device",
            device_type: (s.device_type as any) ?? null,
            ip_address: s.ip_address ?? null,
            user_agent: s.user_agent ?? null,
            last_activity_at:
              s.last_activity_at || s.created_at || new Date().toISOString(),
          };
        }),
      };
    },

    /**
     * Revoke a specific session
     */
    revoke: async (sessionId: string): Promise<SessionRevokeResponse> => {
      return client.request<SessionRevokeResponse>(
        ENDPOINTS.SETTINGS.sessions.revoke(sessionId),
        {
          method: "DELETE",
        },
      );
    },

    /**
     * Revoke all sessions except current
     */
    revokeAll: async (): Promise<BulkSessionRevokeResponse> => {
      return client.request<BulkSessionRevokeResponse>(
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

export function createSecurityNamespace(client: ApiClient) {
  return {
    /**
     * Get security stats for current user
     */
    getStats: async (): Promise<SecurityStatsResponse | null> => {
      return client.request<SecurityStatsResponse>(
        ENDPOINTS.SETTINGS.security.stats,
        {
          method: "GET",
        },
      );
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

export type UserPreferences = UserPreferencesResponse;

export function createPreferencesNamespace(client: ApiClient) {
  return {
    /**
     * Get user preferences
     */
    get: async (): Promise<UserPreferencesResponse | null> => {
      const response = await client.request<UserPreferencesWrappedResponse>(
        ENDPOINTS.SETTINGS.preferences.get,
        {
          method: "GET",
        },
      );

      return response?.preferences || null;
    },

    /**
     * Update user preferences
     */
    update: async (
      preferences: Partial<UserPreferencesResponse>,
    ): Promise<UserPreferencesWrappedResponse> => {
      return client.request<UserPreferencesWrappedResponse>(
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
