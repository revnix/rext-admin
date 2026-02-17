/**
 * Profile & Account API Namespace
 *
 * Handles user profile and account management
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

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
          username: string;
          first_name: string;
          last_name: string;
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
      }>(ENDPOINTS.PROFILE.get, {
        method: "GET",
      });
      return response.profile;
    },

    /**
     * Update user profile
     */
    update: async (data: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
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
        full_name: string;
        display_name: string;
        avatar_url?: string;
        bio?: string;
        language?: string;
        timezone?: string;
      }>(ENDPOINTS.PROFILE.update, {
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
      }>(ENDPOINTS.PROFILE.changePassword, {
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
      }>(ENDPOINTS.PROFILE.avatar.upload, {
        method: "POST",
        body: file, // FormData handles its own content-type
      });
    },

    /**
     * Delete avatar
     */
    deleteAvatar: async () => {
      return client.request<void>(ENDPOINTS.PROFILE.avatar.delete, {
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
      }>(ENDPOINTS.ACCOUNT.exportData, {
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
      }>(ENDPOINTS.ACCOUNT.deactivate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  };
}
