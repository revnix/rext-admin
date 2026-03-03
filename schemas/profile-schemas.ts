import { z } from "zod";

/**
 * Profile update schema
 * Matches backend UpdateProfileRequest
 */

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const AVATAR_ACCEPT_ATTRIBUTE = AVATAR_ALLOWED_MIME_TYPES.join(",");

export const avatarFileSchema = z
  .file()
  .max(AVATAR_MAX_BYTES, "Image must be 5MB or smaller")
  .mime(
    [...AVATAR_ALLOWED_MIME_TYPES],
    "Please upload a JPEG, PNG, GIF, or WebP image",
  );

export function validateAvatarFile(
  file: File,
): { valid: true } | { valid: false; message: string } {
  const result = avatarFileSchema.safeParse(file);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    message: result.error.issues[0]?.message ?? "Invalid avatar file",
  };
}

export const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  display_name: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .optional()),
  bio: z.string().max(500).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Change password schema
 * Matches backend ChangePasswordRequest
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
