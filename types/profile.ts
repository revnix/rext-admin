/**
 * User profile interface
 * Matches backend ProfileResponse
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  bio: string | null;
  language: string;
  timezone: string;
  status: string;
  email_verified: boolean;
  two_factor_enabled?: boolean | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Profile update request
 */
export interface UpdateProfileRequest {
  full_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  language?: string;
  timezone?: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Avatar upload response
 */
export interface AvatarUploadResponse {
  avatar_url: string;
  file_size: number;
  uploaded_at: string;
}
