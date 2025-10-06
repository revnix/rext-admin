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
        "/api/v1/settings/notifications",
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
        "/api/v1/settings/notifications",
        {
          method: "PUT",
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
      }>("/api/v1/settings/sessions", {
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
      }>(`/api/v1/settings/sessions/${sessionId}`, {
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
      }>("/api/v1/settings/sessions/revoke-all", {
        method: "POST",
      });
    },
  };
}

// ============================================================================
// SECURITY
// ============================================================================

export function createSecurityNamespace(client: ApiClient) {
  return {
    /**
     * Get security stats
     */
    getStats: async () => {
      return client.request<SecurityStats>("/api/v1/settings/security/stats", {
        method: "GET",
      });
    },

    /**
     * Get login history
     */
    getLoginHistory: async (options?: { limit?: number; offset?: number }) => {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());

      const queryString = params.toString();
      const endpoint = `/api/v1/settings/security/login-history${queryString ? `?${queryString}` : ""}`;

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
     * Enable two-factor authentication
     */
    enableTwoFactor: async () => {
      return client.request<{
        secret: string;
        qr_code: string;
        backup_codes: string[];
      }>("/api/v1/settings/security/2fa/enable", {
        method: "POST",
      });
    },

    /**
     * Verify and confirm two-factor authentication
     */
    verifyTwoFactor: async (code: string) => {
      return client.request<{
        success: boolean;
        message: string;
      }>("/api/v1/settings/security/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
    },

    /**
     * Disable two-factor authentication
     */
    disableTwoFactor: async (password: string) => {
      return client.request<{
        success: boolean;
        message: string;
      }>("/api/v1/settings/security/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
    },
  };
}
