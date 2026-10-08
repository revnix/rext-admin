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
 * - NO composition rules (no required uppercase/lowercase/numbers/special chars). The backend
 *   still holds four of them, so for now the forms check them too: see PASSWORD_RULES below
 * - Allow all printable characters including spaces and Unicode
 * - Breach checking via HIBP API is handled separately at form submission time
 *
 * @see https://pages.nist.gov/800-63-4/sp800-63b.html (Section 3.1.1.2)
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */
/**
 * What a new password needs, as the forms say it under the field.
 *
 * TEMPORARY in all but the length (rext-control task 938). The backend still asks for the four
 * kinds of character (`validate_password_strength` in rext-backend), and the sign-up and reset
 * forms said only "At least 8 characters": a password the form took was refused by the backend,
 * one rule at a time. Until the backend asks for length alone, the forms say and check all of it.
 */
export const PASSWORD_RULES =
  "At least 8 characters, with an uppercase and a lowercase letter, a number and a special character.";

const PASSWORD_MIN_LENGTH = 8;
// bcrypt's limit, which the backend holds to in bytes.
const PASSWORD_MAX_BYTES = 72;
// What the backend counts as a special character: the keyboard's punctuation but "<" and ">".
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
 * TEMPORARY (rext-control task 938): the kinds of character a password still lacks, of the four
 * the backend asks for, named together. Null when it has them all.
 */
function kindsMissingFrom(password: string): string | null {
  const missing = [
    /[A-Z]/.test(password) ? null : "an uppercase letter",
    /[a-z]/.test(password) ? null : "a lowercase letter",
    /\d/.test(password) ? null : "a number",
    PASSWORD_SYMBOL.test(password)
      ? null
      : "a special character such as ! or #",
  ].filter((kind): kind is string => kind !== null);
  const last = missing.pop();
  if (!last) return null;
  return missing.length > 0 ? `${missing.join(", ")} and ${last}` : last;
}

/**
 * A new password, checked whole before any request: everything it still needs is said at once,
 * beside the field, where the backend would say it one rule per refusal.
 */
export const newPasswordSchema = z.string().superRefine((password, context) => {
  if (bytesOf(password) > PASSWORD_MAX_BYTES) {
    context.addIssue({
      code: "custom",
      message: `Password must be ${PASSWORD_MAX_BYTES} characters or less (accented letters and emoji count as more than one)`,
    });
    return;
  }
  const short = password.length < PASSWORD_MIN_LENGTH;
  const missing = kindsMissingFrom(password);
  if (!short && !missing) return;
  context.addIssue({
    code: "custom",
    message: !missing
      ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
      : short
        ? `Use at least ${PASSWORD_MIN_LENGTH} characters, and add ${missing}`
        : `Add ${missing}`,
  });
});
const passwordSchema = newPasswordSchema;

// A person's name as they write it (rext-control task 933): any script and any case, with its
// accents, apostrophes and hyphens. The form asked for a Latin letter and refused a digit, so
// "李雷" and "محمد" never got as far as the backend. Only that there is a name, that it holds a
// letter and how long it is are asked here; markup and hidden characters are the backend's to
// refuse, in its own words beside the field.
const signupFullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(50, "Full name must be 50 characters or less")
  .regex(/\p{L}/u, "Name must contain at least one letter");

/**
 * TEMPORARY (rext-control task 933). The name as the sign-up request sends it: with its first
 * letter raised, where its script has capitals. The live backend still refuses a full name that
 * starts in lower case ("Full name must start with a capital letter"); on 8 October 2026 that
 * refused one person three times in nine seconds. What the person typed stays as it is in the
 * form. Remove this, and its one use in the sign-up form, once the backend's rule is gone.
 */
export function signupNameAsSent(typed: string): string {
  const [first = "", ...rest] = Array.from(typed.trim());
  return first.toUpperCase() + rest.join("");
}

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
