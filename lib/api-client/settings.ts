/**
 * Settings API Namespace
 *
 * Handles settings-related operations: notifications, sessions, security
 */

import type {
  NotificationPreferences,
  NotificationPreferencesApiResponse,
} from "@/schemas/notification-schemas";
import type { SecurityStats } from "@/types/security";
import type { ApiClient } from "./core";
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
    list: async () => {
      return client.request<{
        sessions: Array<{
          id: string;
          device: string;
          browser: string;
          ip_address: string;
          location: string;
          last_active: string;
          created_at: string;
          is_current: boolean;
        }>;
      }>(ENDPOINTS.SETTINGS.sessions.list, {
        method: "GET",
      });
    },

    /**
     * Revoke a specific session
     */
    revoke: async (sessionId: string) => {
      return client.request<{
        success: boolean;
        message: string;
      }>(ENDPOINTS.SETTINGS.sessions.revoke(sessionId), {
        method: "DELETE",
      });
    },

    /**
     * Revoke all sessions except current
     */
    revokeAll: async () => {
      return client.request<{
        success: boolean;
        message: string;
        revoked_count: number;
      }>(ENDPOINTS.SETTINGS.sessions.revokeAll, {
        method: "DELETE",
      });
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
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());

      const queryString = params.toString();
      const endpoint = `${ENDPOINTS.SETTINGS.security.loginHistory}${queryString ? `?${queryString}` : ""}`;

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
      return client.request<UserPreferences>(ENDPOINTS.SETTINGS.preferences.get, {
        method: "GET",
      });
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
      return client.request<UserPreferences>(ENDPOINTS.SETTINGS.preferences.update, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
    },
  };
}
