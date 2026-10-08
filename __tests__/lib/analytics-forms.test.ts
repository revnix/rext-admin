/**
 * The kinds the sign-up and sign-in forms report for a refusal (rext-control task 712): a class,
 * never the words of the answer.
 */
import {
  firstRefusedField,
  isDuplicateAccount,
  SIGN_IN_FIELDS,
  SIGN_UP_FIELDS,
  shownErrorCode,
  signInRefusal,
  signUpRefusal,
} from "@/lib/analytics-forms";
import { ApiError } from "@/lib/api-client/core";
import { BACKEND_AWAY_CODE } from "@/lib/auth/backend-away";

describe("signUpRefusal", () => {
  it("calls an email that has an account `exists`, by status or by the answer's wording", () => {
    expect(signUpRefusal(new ApiError(409, "Conflict"))).toEqual({
      kind: "exists",
      status: 409,
    });
    // Some backend builds answer 200 with a sentence; the form turns that into a 400.
    expect(
      signUpRefusal(new ApiError(400, "This email is already registered")),
    ).toEqual({ kind: "exists", status: 400 });
    expect(isDuplicateAccount(new ApiError(409, "Conflict"))).toBe(true);
    expect(isDuplicateAccount(new ApiError(422, "Password too short"))).toBe(
      false,
    );
  });

  it("tells too many tries, a failing backend and turned-down details apart", () => {
    expect(signUpRefusal(new ApiError(429, "Slow down"))).toEqual({
      kind: "limit",
      status: 429,
    });
    expect(signUpRefusal(new ApiError(503, "Unavailable"))).toEqual({
      kind: "backend",
      status: 503,
    });
    expect(signUpRefusal(new ApiError(422, "Password too short"))).toEqual({
      kind: "rejected",
      status: 422,
    });
  });

  it("calls no answer at all `unreachable`, and anything else `other`", () => {
    expect(signUpRefusal(new TypeError("Failed to fetch"))).toEqual({
      kind: "unreachable",
    });
    expect(signUpRefusal(new Error("something else"))).toEqual({
      kind: "other",
    });
    expect(signUpRefusal("not an error")).toEqual({ kind: "other" });
  });
});

describe("signInRefusal", () => {
  it.each([
    [BACKEND_AWAY_CODE, "away"],
    ["ACCOUNT_DEACTIVATED", "deactivated"],
    ["Invalid email or password", "credentials"],
    [
      "Please verify your email address before logging in. Check your inbox for the verification link.",
      "unverified",
    ],
    [
      "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
      "locked",
    ],
    [
      "Your account has been suspended. Contact support to have it reviewed.",
      "suspended",
    ],
    [
      "Your account has been banned. Please contact support for assistance.",
      "banned",
    ],
    ["Failed to fetch", "unreachable"],
    ["Backend API error: 502", "backend"],
    ["CredentialsSignin", "other"],
    [undefined, "other"],
    [null, "other"],
  ])("%s is %s", (code, kind) => {
    expect(signInRefusal(code)).toBe(kind);
  });
});

describe("shownErrorCode", () => {
  it("keeps a plain code and nothing else", () => {
    expect(shownErrorCode("OAuthError")).toBe("OAuthError");
    expect(shownErrorCode("SessionExpired")).toBe("SessionExpired");
    expect(shownErrorCode("ana@example.com")).toBe("other");
    expect(shownErrorCode("Your account is locked")).toBe("other");
    expect(shownErrorCode("")).toBe("other");
    expect(shownErrorCode("A".repeat(41))).toBe("other");
  });
});

describe("firstRefusedField", () => {
  it("names the first field with an error, in the form's own order", () => {
    expect(
      firstRefusedField({ confirmPassword: {}, email: {} }, SIGN_UP_FIELDS),
    ).toBe("email");
    expect(firstRefusedField({ confirmPassword: {} }, SIGN_UP_FIELDS)).toBe(
      "confirm_password",
    );
    expect(firstRefusedField({ password: {} }, SIGN_IN_FIELDS)).toBe(
      "password",
    );
  });

  it("names none for an error that sits beside no field", () => {
    expect(firstRefusedField({ root: {} }, SIGN_UP_FIELDS)).toBeUndefined();
    expect(firstRefusedField({}, SIGN_IN_FIELDS)).toBeUndefined();
  });
});
