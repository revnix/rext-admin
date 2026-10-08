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
 * - Maximum 72 bytes, the limit of the backend's hashing
 * - NO composition rules (no required uppercase/lowercase/numbers/special chars)
 * - Allow all printable characters including spaces and Unicode
 * - Breach checking via HIBP API is handled separately at form submission time
 *
 * @see https://pages.nist.gov/800-63-4/sp800-63b.html (Section 3.1.1.2)
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */
/**
 * What a new password needs, as the forms say it under the field: its length, and nothing about
 * the kinds of character in it (rext-control task 938). The backend asks the same since
 * rextaihq/rext-backend#1033; before it the backend wanted four kinds of character that the
 * forms never named. Whether a password is on a list of breached ones is asked when the form is
 * sent, and by the backend again.
 */
export const PASSWORD_RULES = "At least 8 characters.";

const PASSWORD_MIN_LENGTH = 8;
// bcrypt's limit, which the backend holds to in bytes.
const PASSWORD_MAX_BYTES = 72;
// The keyboard's punctuation but "<" and ">", which no password may hold.
const PASSWORD_SYMBOL = /[!"#$%&'()*+,\-./:;=?@[\\\]^_`{|}~]/;

/** A password's length as the backend counts it: in bytes, where an accented letter is two. */
function bytesOf(text: string): number {
  let bytes = 0;
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/**
 * What a password has, read one way for the check below and for the strength a form shows as it
 * is typed: a form must not call "Strong" what it then refuses.
 */
export function passwordHas(password: string) {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: PASSWORD_SYMBOL.test(password),
    /** Within the most the backend's hashing takes. */
    fits: bytesOf(password) <= PASSWORD_MAX_BYTES,
    /** Without "<" or ">", which the backend refuses in any password. */
    plain: !/[<>]/.test(password),
  };
}

/**
 * A new password, checked before any request by what the backend itself asks: long enough, not
 * too long for its hashing, and without "<" or ">". Nothing about the kinds of character.
 */
export const newPasswordSchema = z.string().superRefine((password, context) => {
  const has = passwordHas(password);
  const message = !has.fits
    ? `Password must be ${PASSWORD_MAX_BYTES} characters or less (accented letters and emoji count as more than one)`
    : !has.length
      ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
      : !has.plain
        ? "Password cannot contain < or >"
        : null;
  if (message) context.addIssue({ code: "custom", message });
});
const passwordSchema = newPasswordSchema;

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
