/**
 * Profile & Account API Namespace
 *
 * Handles user profile and account management
 */

import type {
  ProfileResponseDetailed,
  UpdateProfileRequest,
} from "@/types/generated/types.gen";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";
import type { DataExportFormValues } from "@/schemas/account-schemas";

export type UserProfile = ProfileResponseDetailed;

export function createProfileNamespace(client: ApiClient) {
  return {
    /**
     * Get user profile
     */
    get: async (): Promise<UserProfile> => {
      return client.request<UserProfile>(ENDPOINTS.PROFILE.get, {
        method: "GET",
      });
    },

    /**
     * Update user profile
     */
    update: async (data: UpdateProfileRequest): Promise<UserProfile> => {
      return client.request<UserProfile>(ENDPOINTS.PROFILE.update, {
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
    requestDataExport: async (data: DataExportFormValues) => {
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
