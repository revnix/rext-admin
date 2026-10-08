import { z } from "zod";
import { newPasswordSchema } from "@/schemas/auth-schemas";

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

/** True for a timezone the browser knows by its IANA name ("UTC", "Asia/Karachi"). */
export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Account settings, Profile. The backend takes a name of up to 200 characters and a bio of up to
 * 500 (UpdateProfileRequest), and stores any timezone string, so the form allows only real IANA
 * names: scheduled publishing reads the person's timezone.
 */
export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(200, "Full name must be 200 characters or fewer")
    .regex(/^[^0-9]*$/, "Name should not contain numbers")
    .regex(/\p{L}/u, "Name must contain at least one letter"),
  display_name: z
    .string()
    .trim()
    .max(100, "Display name must be 100 characters or fewer")
    .refine(
      (value) => value.length === 0 || value.length >= 2,
      "Display name must be at least 2 characters",
    ),
  bio: z.string().max(500, "Bio must be 500 characters or fewer"),
  timezone: z.string().refine(isTimeZone, "Choose a timezone from the list"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Change password schema
 * Matches backend ChangePasswordRequest
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    // The one rule for a new password, with everything it still needs said at once.
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
