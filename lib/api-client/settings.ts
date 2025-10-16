/**
 * Settings API Namespace
 *
 * Handles settings-related operations: notifications, sessions, security
 */

import type { NotificationPreferences } from "@/schemas/notification-schemas";
import type { SecurityStats } from "@/types/security";
import type { ApiClient } from "./core";

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export function createNotificationsNamespace(client: ApiClient) {
  return {
    /**
     * Get notification preferences
     */
    getPreferences: async () => {
      return client.request<NotificationPreferences>(
        "/api/v1/user/preferences/notifications",
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
      return client.request<NotificationPreferences>(
        "/api/v1/user/preferences/notifications",
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
      }>("/api/v1/user/sessions", {
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
      }>(`/api/v1/user/sessions/${sessionId}`, {
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
      }>("/api/v1/user/sessions", {
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
      return client.request<SecurityStats>("/api/v1/user/security/stats", {
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
      const endpoint = `/api/v1/user/security/login-history${queryString ? `?${queryString}` : ""}`;

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
      }>("/api/v1/user/security/active-sessions-count", {
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
      return client.request<UserPreferences>("/api/v1/user/preferences", {
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
      return client.request<UserPreferences>("/api/v1/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
    },
  };
}
