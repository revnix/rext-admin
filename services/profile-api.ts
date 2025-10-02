/**
 * Profile API Service
 *
 * Handles user profile operations including:
 * - Get/update profile
 * - Change password
 * - Avatar upload/delete
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import type { ConsistentSuccessResponse } from "@/types/consistent-response";
import type {
  AvatarUploadResponse,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfile,
} from "@/types/profile";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ProfileApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ProfileApiError";
  }
}

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<UserProfile> {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/profile`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ProfileApiError(
        error.message || "Failed to fetch profile",
        response.status,
        error,
      );
    }

    const data: ConsistentSuccessResponse<{ profile: UserProfile }> =
      await response.json();
    return data.data.profile;
  } catch (error) {
    if (error instanceof ProfileApiError) throw error;
    throw new ProfileApiError(
      error instanceof Error ? error.message : "Unknown error fetching profile",
    );
  }
}

/**
 * Update current user's profile
 */
export async function updateProfile(
  profileData: UpdateProfileRequest,
): Promise<UserProfile> {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/profile`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ProfileApiError(
        error.message || "Failed to update profile",
        response.status,
        error,
      );
    }

    const data: ConsistentSuccessResponse<{ profile: UserProfile }> =
      await response.json();
    return data.data.profile;
  } catch (error) {
    if (error instanceof ProfileApiError) throw error;
    throw new ProfileApiError(
      error instanceof Error ? error.message : "Unknown error updating profile",
    );
  }
}

/**
 * Change user password
 */
export async function changePassword(
  passwordData: ChangePasswordRequest,
): Promise<void> {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/change-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ProfileApiError(
        error.message || "Failed to change password",
        response.status,
        error,
      );
    }
  } catch (error) {
    if (error instanceof ProfileApiError) throw error;
    throw new ProfileApiError(
      error instanceof Error
        ? error.message
        : "Unknown error changing password",
    );
  }
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/avatar/upload`,
      {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ProfileApiError(
        error.message || "Failed to upload avatar",
        response.status,
        error,
      );
    }

    const data: ConsistentSuccessResponse<AvatarUploadResponse> =
      await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof ProfileApiError) throw error;
    throw new ProfileApiError(
      error instanceof Error ? error.message : "Unknown error uploading avatar",
    );
  }
}

/**
 * Delete user avatar
 */
export async function deleteAvatar(): Promise<void> {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/user/avatar`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ProfileApiError(
        error.message || "Failed to delete avatar",
        response.status,
        error,
      );
    }
  } catch (error) {
    if (error instanceof ProfileApiError) throw error;
    throw new ProfileApiError(
      error instanceof Error ? error.message : "Unknown error deleting avatar",
    );
  }
}
