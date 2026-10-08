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
import type { components } from "./schema";
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

/** The answer on usage analytics as the account holds it. */
export interface StoredAnalyticsAnswer {
  answer: "granted" | "denied" | null;
  region: "eea" | "other" | null;
  answered_at: string | null;
}

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

      return profile;
    },

    /**
     * Change password
     */
    changePassword: async (data: ChangePasswordRequest) => {
      return client.request<{ success?: boolean }>(
        ENDPOINTS.PROFILE.changePassword,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
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

    /**
     * Writes the person's answer on usage analytics and where they were asked, and returns what
     * the account holds afterwards. A null answer never undoes a stored one: it writes the
     * region only, so a browser with no answer of its own reads the account's this way. The
     * backend refuses it (403) while an admin acts as a customer.
     */
    storeAnalyticsAnswer: async (
      answer: StoredAnalyticsAnswer["answer"],
      region: NonNullable<StoredAnalyticsAnswer["region"]>,
    ): Promise<StoredAnalyticsAnswer> =>
      client.request<StoredAnalyticsAnswer>(ENDPOINTS.PROFILE.analyticsAnswer, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, region }),
      }),
  };
}

export function createAccountNamespace(client: ApiClient) {
  return {
    /**
     * Request data export
     */
    requestDataExport: async (data: DataExportFormValues) => {
      // The backend's contract: the client unwraps its `data`, where the payload may be null.
      return client.request<components["schemas"]["DataExportResponse"]>(
        ENDPOINTS.ACCOUNT.exportData,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
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
      return client.request<{
        success?: boolean;
        message?: string;
      }>(ENDPOINTS.ACCOUNT.deactivate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Request Account Recovery
     */
    requestRecovery: async (data: { email: string }) => {
      return client.request<{
        success: boolean;
        message: string;
      }>(ENDPOINTS.ACCOUNT.recoveryRequest, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Verify Account Recovery
     */
    verifyRecovery: async (data: { token: string }) => {
      return client.request<{
        success: boolean;
        message: string;
      }>(ENDPOINTS.ACCOUNT.recoveryVerify, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  };
}
