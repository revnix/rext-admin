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
// NOTE: These endpoints are not currently implemented in the backend
// Backend has /api/v1/security/* endpoints that are admin-only for monitoring
// User-facing 2FA and security settings endpoints need to be implemented

export function createSecurityNamespace(client: ApiClient) {
  return {
    /**
     * Get security stats
     * WARNING: Backend endpoint does not exist. Needs implementation.
     */
    getStats: async () => {
      // TODO: Backend needs to implement /api/v1/user/security/stats
      return client.request<SecurityStats>("/api/v1/user/security/stats", {
        method: "GET",
      });
    },

    /**
     * Get login history
     * WARNING: Backend endpoint does not exist. Needs implementation.
     */
    getLoginHistory: async (options?: { limit?: number; offset?: number }) => {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());

      const queryString = params.toString();
      // TODO: Backend needs to implement /api/v1/user/security/login-history
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
     * Enable two-factor authentication
     * WARNING: Backend endpoint does not exist. Needs implementation.
     */
    enableTwoFactor: async () => {
      // TODO: Backend needs to implement /api/v1/user/security/2fa/enable
      return client.request<{
        secret: string;
        qr_code: string;
        backup_codes: string[];
      }>("/api/v1/user/security/2fa/enable", {
        method: "POST",
      });
    },

    /**
     * Verify and confirm two-factor authentication
     * WARNING: Backend endpoint does not exist. Needs implementation.
     */
    verifyTwoFactor: async (code: string) => {
      // TODO: Backend needs to implement /api/v1/user/security/2fa/verify
      return client.request<{
        success: boolean;
        message: string;
      }>("/api/v1/user/security/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
    },

    /**
     * Disable two-factor authentication
     * WARNING: Backend endpoint does not exist. Needs implementation.
     */
    disableTwoFactor: async (password: string) => {
      // TODO: Backend needs to implement /api/v1/user/security/2fa/disable
      return client.request<{
        success: boolean;
        message: string;
      }>("/api/v1/user/security/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
    },
  };
}
