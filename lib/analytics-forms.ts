/**
 * What the sign-up and sign-in forms report when they turn a person away (rext-control task 712):
 * the refusal's kind, never its words, and never anything the person typed. Neither page is ever
 * recorded, so these events are all that says where people stop on them.
 */
import { ApiError } from "@/lib/api-client/core";
import { SERVER_UNREACHABLE } from "@/lib/api-client/server-away";
import { BACKEND_AWAY_CODE } from "@/lib/auth/backend-away";

/** The sign-up form's fields, by their names in the form, as an event names them. */
export const SIGN_UP_FIELDS = {
  full_name: "full_name",
  email: "email",
  password: "password",
  confirmPassword: "confirm_password",
} as const;

/** The sign-in form's fields, the same way. */
export const SIGN_IN_FIELDS = {
  email: "email",
  password: "password",
} as const;

/** How some backend builds say "this email has an account" where they send no 409. */
const ALREADY_AN_ACCOUNT =
  /already (exists|registered|in use)|already have an account|email.*taken/i;

/** Whether a refused sign-up says the email already has an account. */
export function isDuplicateAccount(error: unknown): boolean {
  if (ApiError.is(error) && error.statusCode === 409) return true;
  return ALREADY_AN_ACCOUNT.test(error instanceof Error ? error.message : "");
}

/**
 * Why a sign-up didn't go through: the form's own check (`form`), a password found in a breach,
 * an email that has an account, too many tries, the backend out of reach or failing, or the
 * backend turning the details down.
 */
export type SignUpRefusal =
  | "form"
  | "password_breached"
  | "exists"
  | "limit"
  | "unreachable"
  | "backend"
  | "rejected"
  | "other";

/** The kind of a sign-up the backend didn't accept, and its status where there was an answer. */
export function signUpRefusal(error: unknown): {
  kind: SignUpRefusal;
  status?: number;
} {
  // The API client's own "couldn't reach the server": no answer (status 0), or a gateway's in
  // the backend's place. Neither is the backend turning anything down.
  if (
    ApiError.is(error) &&
    (error.code === SERVER_UNREACHABLE || error.statusCode === 0)
  ) {
    return { kind: "unreachable" };
  }
  const status = ApiError.is(error) ? error.statusCode : undefined;
  if (isDuplicateAccount(error)) return { kind: "exists", status };
  if (status === undefined) {
    // No answer at all: the browser's own failure to reach the backend is a TypeError.
    const unreachable =
      error instanceof TypeError ||
      /fetch|network/i.test(error instanceof Error ? error.message : "");
    return { kind: unreachable ? "unreachable" : "other" };
  }
  if (status === 429) return { kind: "limit", status };
  if (status >= 500) return { kind: "backend", status };
  return { kind: "rejected", status };
}

/**
 * Why a sign-in didn't go through. `unverified` is an account whose email link was never opened,
 * `locked` one with too many wrong passwords, `away` the backend restarting.
 */
export type SignInRefusal =
  | "form"
  | "credentials"
  | "unverified"
  | "locked"
  | "deactivated"
  | "suspended"
  | "banned"
  | "away"
  | "unreachable"
  | "backend"
  | "other";

/**
 * The kind of a refused sign-in, from what next-auth hands back for it: one of our own codes, or
 * the backend's sentence. The sentence is only matched, never sent.
 */
export function signInRefusal(code: string | null | undefined): SignInRefusal {
  if (!code) return "other";
  if (code === BACKEND_AWAY_CODE) return "away";
  if (code === "ACCOUNT_DEACTIVATED") return "deactivated";
  if (/invalid email or password/i.test(code)) return "credentials";
  if (/verify your email/i.test(code)) return "unverified";
  if (/temporarily locked/i.test(code)) return "locked";
  if (/suspended/i.test(code)) return "suspended";
  if (/banned/i.test(code)) return "banned";
  if (/fetch|network/i.test(code)) return "unreachable";
  if (/\b5\d\d\b|server error/i.test(code)) return "backend";
  return "other";
}

/**
 * The error the sign-in page arrived with, as an event may carry it: its code as the address has
 * it (`OAuthError`, `SessionExpired`), letters only. Anything else in that place is "other".
 */
export function shownErrorCode(code: string): string {
  return /^[A-Za-z]{1,40}$/.test(code) ? code : "other";
}

/** The first of a form's fields with an error, as an event names it. */
export function firstRefusedField(
  errors: Record<string, unknown>,
  fields: Record<string, string>,
): string | undefined {
  for (const [name, reported] of Object.entries(fields)) {
    if (errors[name]) return reported;
  }
  return undefined;
}
