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
      const response = await client.request<{
        profile: {
          id: string;
          email: string;
          full_name: string;
          display_name: string;
          email_verified: boolean;
          status: string;
          avatar_url?: string;
          bio?: string;
          language?: string;
          timezone?: string;
          created_at: string;
          updated_at: string;
        };
      }>("/api/v1/user/profile", {
        method: "GET",
      });
      return response.profile;
    },

    /**
     * Update user profile
     */
    update: async (data: {
      full_name?: string;
      display_name?: string | null;
      bio?: string;
      avatar_url?: string;
      language?: string;
      timezone?: string;
    }) => {
      const response = await client.request<{
        user?: {
          id: string;
          email: string;
          full_name: string;
          display_name: string;
          avatar_url?: string;
          bio?: string;
          language?: string;
          timezone?: string;
        };
        id?: string;
        email?: string;
        full_name?: string;
        display_name?: string;
        avatar_url?: string;
        bio?: string;
        language?: string;
        timezone?: string;
      }>("/api/v1/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Handle both wrapped and direct response formats
      return response.user || response;
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
     */
    deactivate: async (data: {
      reason?: string;
      confirm: boolean;
      password: string;
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
