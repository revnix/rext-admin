/**
 * Profile & Account API Namespace
 *
 * Handles user profile and account management
 */

import type { ApiClient } from "./core";

export function createProfileNamespace(client: ApiClient) {
  return {
    /**
     * Get user profile
     */
    get: async () => {
      return client.request<{
        id: string;
        email: string;
        username: string;
        first_name: string;
        last_name: string;
        display_name: string;
        email_verified: boolean;
        status: string;
        avatar_url?: string;
        bio?: string;
        language?: string;
        timezone?: string;
        created_at: string;
        updated_at: string;
      }>("/api/v1/user/profile", {
        method: "GET",
      });
    },

    /**
     * Update user profile
     */
    update: async (data: {
      first_name?: string;
      last_name?: string;
      display_name?: string;
      bio?: string;
      avatar_url?: string;
      language?: string;
      timezone?: string;
    }) => {
      return client.request<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        display_name: string;
        avatar_url?: string;
        bio?: string;
        language?: string;
        timezone?: string;
      }>("/api/v1/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Change password
     */
    changePassword: async (data: {
      current_password: string;
      new_password: string;
      confirm_password: string;
    }) => {
      return client.request<{
        success: boolean;
        message: string;
      }>("/api/v1/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Upload avatar
     */
    uploadAvatar: async (file: FormData) => {
      return client.request<{
        avatar_url: string;
      }>("/api/v1/user/avatar/upload", {
        method: "POST",
        body: file, // FormData handles its own content-type
      });
    },

    /**
     * Delete avatar
     */
    deleteAvatar: async () => {
      return client.request<void>("/api/v1/user/avatar", {
        method: "DELETE",
      });
    },
  };
}

export function createAccountNamespace(client: ApiClient) {
  return {
    /**
     * Request data export
     */
    requestDataExport: async (data: {
      include_profile?: boolean;
      include_roles?: boolean;
      include_workspaces?: boolean;
      include_activity?: boolean;
      include_billing?: boolean;
      include_usage?: boolean;
    }) => {
      return client.request<{
        success: boolean;
        message: string;
        export_id: string;
      }>("/api/v1/user/export-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Deactivate account
     * REQUIRES: password verification (breaking change)
     */
    deactivate: async (data: {
      password: string;
      reason?: string;
      confirm: boolean;
      cancel_subscriptions?: boolean;
    }) => {
      return client.request<{
        success: boolean;
        message: string;
      }>("/api/v1/user/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  };
}
