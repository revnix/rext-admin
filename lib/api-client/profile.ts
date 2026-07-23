import { log } from "@/lib/logger";
/**
 * Profile & Account API Namespace
 *
 * Handles user profile and account management
 */

import { z } from "zod";
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfile,
} from "@/types/profile";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";
import type { DataExportFormValues } from "@/schemas/account-schemas";

const profileEnvelopeSchema = z.object({
  profile: z.object({
    id: z.string(),
    email: z.string().email(),
    full_name: z.string().nullable(),
    display_name: z.string().nullable(),
    bio: z.string().nullable().optional(),
    language: z.string(),
    timezone: z.string(),
    status: z.string(),
    email_verified: z.boolean(),
    two_factor_enabled: z.boolean().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
  }),
});

export function createProfileNamespace(client: ApiClient) {
  return {
    /**
     * Get user profile
     */
    get: async (): Promise<UserProfile> => {
      const response = await client.request<unknown>(ENDPOINTS.PROFILE.get, {
        method: "GET",
      });

      const parsed = profileEnvelopeSchema.safeParse(response);
      if (!parsed.success) {
        throw new Error("Invalid /api/v1/user/profile response contract");
      }

      const { profile } = parsed.data;
      return {
        ...profile,
        bio: profile.bio ?? null,
        avatar_url: profile.avatar_url ?? null,
      };
    },

    /**
     * Update user profile
     */
    update: async (data: UpdateProfileRequest): Promise<UserProfile> => {
      const response = await client.request<{
        profile?: UserProfile;
        user?: UserProfile;
        id?: string;
      }>(ENDPOINTS.PROFILE.update, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Handle both wrapped and direct response formats
      const profile = response.profile || response.user;
      if (!profile) {
        throw new Error("Invalid update response: missing profile data");
      }

      // Record audit log
      try {
        await client.request("/api/v1/audit-logs/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "user.update",
            resource_type: "user",
            resource_id: profile.id,
            status: "success",
          }),
        });
      } catch (e) {
        log.error("[AuditLog] Failed to log user.update", e);
      }

      return profile;
    },

    /**
     * Change password
     */
    changePassword: async (data: ChangePasswordRequest) => {
      // Fetch user ID for resource_id before tokens are potentially invalidated
      let userId: string | undefined;
      try {
        const profileRes = await client.request<{
          profile?: { id?: string };
          id?: string;
        }>(ENDPOINTS.PROFILE.get, { method: "GET" });
        userId = profileRes?.profile?.id ?? profileRes?.id;
      } catch {
        // Proceed even if we can't get the ID
      }

      const response = await client.request<{ success?: boolean }>(
        ENDPOINTS.PROFILE.changePassword,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      // Record audit log — awaited to ensure it completes before returning
      if (response.success !== false) {
        try {
          await client.request("/api/v1/audit-logs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "auth.password_change",
              resource_type: "user",
              resource_id: userId,
              status: "success",
            }),
          });
        } catch (e) {
          log.error("[AuditLog] Failed to log auth.password_change", e);
        }
      }

      return response;
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

    /**
     * Resend verification email
     */
    resendVerification: async (email: string) => {
      return client.request<{
        success: boolean;
        message: string;
      }>(ENDPOINTS.PROFILE.resendVerification, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
     * Deactivate user account
     */
    deactivate: async (data: {
      reason?: string;
      confirm: boolean;
      password: string;
      cancel_subscriptions?: boolean;
    }) => {
      // Fetch user ID for resource_id before tokens are potentially invalidated
      let userId: string | undefined;
      try {
        const profileRes = await client.request<{
          profile?: { id?: string };
          id?: string;
        }>(ENDPOINTS.PROFILE.get, { method: "GET" });
        userId = profileRes?.profile?.id ?? profileRes?.id;
      } catch {
        // Proceed even if we can't get the ID
      }

      const response = await client.request<{
        success?: boolean;
        message?: string;
      }>(
        ENDPOINTS.ACCOUNT.deactivate,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      // Record audit log — awaited to ensure it completes before returning
      if (response.success !== false) {
        try {
          await client.request("/api/v1/audit-logs/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "user.deactivate",
              resource_type: "user",
              resource_id: userId,
              status: "success",
            }),
          });
        } catch (e) {
          log.error("[AuditLog] Failed to log user.deactivate", e);
        }
      }

      return response;
    },
  };
}
