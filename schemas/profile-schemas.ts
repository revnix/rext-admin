import { z } from "zod";

/**
 * Profile update schema
 * Matches backend UpdateProfileRequest
 */
export const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .optional(),
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
