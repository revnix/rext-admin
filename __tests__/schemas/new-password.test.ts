/**
 * A password the form takes is one the backend takes, and the other way about (rext-control task
 * 938). The forms said "At least 8 characters" while the backend also asked for four kinds of
 * character, so a person who did what the form said was refused, one rule at a time. Both now ask
 * for the length alone: 8 characters at least, 72 bytes at most, and no "<" or ">".
 */

import { strengthOf } from "@/components/profile/change-password-form";
import {
  newPasswordSchema,
  resetPasswordSchema,
  signupFormSchema,
} from "@/schemas/auth-schemas";
import { changePasswordSchema } from "@/schemas/profile-schemas";

const said = (password: string) =>
  newPasswordSchema.safeParse(password).error?.issues[0]?.message;

describe("a new password", () => {
  it.each([
    "blueberry pancakes",
    "12345678",
    "Blueberry-pancakes-7",
    "pässwörd",
    // 72 bytes, the most the backend's hashing takes.
    "x".repeat(72),
  ])("is taken whatever kinds of character it holds: %j", (password) => {
    expect(said(password)).toBeUndefined();
  });

  it("is asked for 8 characters at least", () => {
    expect(said("abc")).toBe("Password must be at least 8 characters");
    expect(said("Aa1!aaa")).toBe("Password must be at least 8 characters");
  });

  it("is measured at its upper end as the backend measures it, in bytes", () => {
    const tooLong =
      "Password must be 72 characters or less (accented letters and emoji count as more than one)";
    expect(said("x".repeat(73))).toBe(tooLong);
    // 37 letters of two bytes each: 74.
    expect(said("é".repeat(37))).toBe(tooLong);
    expect(said("é".repeat(36))).toBeUndefined();
  });

  it.each(["blueberry<pancakes", "blueberry>pancakes"])(
    'is refused with "<" or ">" in it, as the backend refuses it: %j',
    (password) => {
      expect(said(password)).toBe("Password cannot contain < or >");
    },
  );
});

describe("the forms that ask for a new password", () => {
  const SHORT = "abc";
  const NEEDS = "Password must be at least 8 characters";
  const at = (
    result: { error?: { issues: { path: PropertyKey[]; message: string }[] } },
    field: string,
  ) => result.error?.issues.find((issue) => issue.path[0] === field)?.message;

  it("sign-up: asks for one, then holds it to the rule", () => {
    const form = (password: string) => ({
      full_name: "New Writer",
      email: "new.writer@example.com",
      password,
      confirmPassword: password,
    });
    expect(at(signupFormSchema.safeParse(form("")), "password")).toBe(
      "Enter password",
    );
    expect(at(signupFormSchema.safeParse(form(SHORT)), "password")).toBe(NEEDS);
    expect(signupFormSchema.safeParse(form("blueberry pancakes")).success).toBe(
      true,
    );
  });

  it("reset: holds the new password to the rule", () => {
    expect(
      at(
        resetPasswordSchema.safeParse({
          password: SHORT,
          confirmPassword: SHORT,
        }),
        "password",
      ),
    ).toBe(NEEDS);
  });

  it("change: holds the new password to the same rule, said the same way", () => {
    expect(
      at(
        changePasswordSchema.safeParse({
          currentPassword: "anything",
          newPassword: SHORT,
          confirmPassword: SHORT,
        }),
        "newPassword",
      ),
    ).toBe(NEEDS);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "anything",
        newPassword: "blueberry pancakes",
        confirmPassword: "blueberry pancakes",
      }).success,
    ).toBe(true);
  });
});

// The change-password form rates a password as it is typed: a guide, by its length and the kinds
// of character in it. It never calls "Strong" a password the form then refuses.
describe("the strength the change-password form shows", () => {
  it.each(["Blueberry7!<pancakes", `Aa1!${"x".repeat(69)}`, "Aa1!aaa"])(
    "is never Strong for a password the form refuses: %j",
    (password) => {
      expect(newPasswordSchema.safeParse(password).success).toBe(false);
      expect(strengthOf(password).label).not.toBe("Strong");
    },
  );

  it("is Strong for a long password of every kind, and less for less", () => {
    expect(strengthOf("Blueberry-pancakes-7").label).toBe("Strong");
    expect(strengthOf("Blueberry pancakes").label).toBe("Fair");
    expect(strengthOf("blue").label).toBe("Weak");
  });
});
