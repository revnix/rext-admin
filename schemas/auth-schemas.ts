import { z } from "zod";

/**
 * Zod Validation Schemas for Authentication Forms
 *
 * These schemas validate auth forms, ensuring proper data before API submission.
 * Password policy: NIST SP 800-63B-4 aligned — length-based, no composition rules.
 */

// Password validation with strength requirements
/**
 * Password validation aligned with NIST SP 800-63B-4 and OWASP guidelines.
 *
 * Key principles:
 * - Minimum 8 characters (the app uses MFA-capable OAuth, so 8 is acceptable per NIST)
 * - Maximum 64+ characters to allow passphrases
 * - NO composition rules (no required uppercase/lowercase/numbers/special chars)
 * - Allow all printable characters including spaces and Unicode
 * - Breach checking via HIBP API is handled separately at form submission time
 *
 * @see https://pages.nist.gov/800-63-4/sp800-63b.html (Section 3.1.1.2)
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or less");

// A person's name as they write it (rext-control task 933): any script and any case, with its
// accents, apostrophes and hyphens, and stored as written. Only that there is a name, that it
// holds a letter and how long it is are asked here, as the backend asks them; markup, hidden
// characters and a web address are the backend's to refuse, in its own words beside the field.
const signupFullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(100, "Full name must be 100 characters or less")
  .regex(/\p{L}/u, "Name must contain at least one letter");

const signupEmailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .email("Invalid email address")
  .toLowerCase();

const signupPasswordSchema = z
  .string()
  .min(1, "Enter password")
  .pipe(passwordSchema);

const signupConfirmPasswordSchema = z.string().min(1, "Confirm your password");

// Password change form schema
export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

// Signup form schema
export const signupFormSchema = z
  .object({
    full_name: signupFullNameSchema,
    email: signupEmailSchema,
    password: signupPasswordSchema,
    confirmPassword: signupConfirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Forgot password form schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .email("Invalid email address")
    .toLowerCase(),
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
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .email("Invalid email address")
    .toLowerCase(),
  password: z.string().min(1, "Enter password"),
});

// Signup with invitation schema (merges with base signup)
export const signupWithInvitationSchema = z
  .object({
    full_name: signupFullNameSchema,
    email: signupEmailSchema,
    password: signupPasswordSchema,
    confirmPassword: signupConfirmPasswordSchema,
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
