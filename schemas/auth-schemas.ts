import { z } from "zod";

/**
 * Zod Validation Schemas for Authentication Forms
 *
 * These schemas validate auth forms, ensuring proper data before API submission.
 * Password requirements: min 8 chars, uppercase, lowercase, number
 */

// Password validation with strength requirements
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Signup form schema
export const signupFormSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name must be 50 characters or less")
      .trim(),
    email: z.string().email("Invalid email address").trim().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Forgot password form schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

// Reset password form schema
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Login form schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// Signup with invitation schema (merges with base signup)
export const signupWithInvitationSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name must be 50 characters or less")
      .trim(),
    email: z.string().email("Invalid email address").trim().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
    invitationToken: z.string().min(1, "Invitation token is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Type exports
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type SignupWithInvitationData = z.infer<
  typeof signupWithInvitationSchema
>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type LoginData = z.infer<typeof loginSchema>;
