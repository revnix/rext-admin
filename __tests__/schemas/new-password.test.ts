/**
 * A password the form takes is one the backend takes (rext-control task 938). The sign-up and
 * reset forms said "At least 8 characters" and checked only that, while the backend also asks for
 * an uppercase letter, a lowercase letter, a number and a special character: a person who did what
 * the form said was refused, one rule at a time. The forms now check all of it, and say everything
 * a password still needs at once.
 */

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
    "Blueberry-pancakes-7",
    "Aa1!aaaa",
    "correct Horse battery staple 9?",
    // 72 bytes, the most the backend's hashing takes.
    `Aa1!${"x".repeat(68)}`,
  ])("is taken when it has everything: %j", (password) => {
    expect(said(password)).toBeUndefined();
  });

  it("is told everything it still needs at once, not one rule per try", () => {
    expect(said("blueberry pancakes")).toBe(
      "Add an uppercase letter, a number and a special character such as ! or #",
    );
    expect(said("BLUEBERRY-PANCAKES-7")).toBe("Add a lowercase letter");
    expect(said("Blueberry pancakes")).toBe(
      "Add a number and a special character such as ! or #",
    );
    expect(said("Blueberry7pancakes")).toBe(
      "Add a special character such as ! or #",
    );
  });

  it("is told its length and its kinds of character together when it lacks both", () => {
    expect(said("abc")).toBe(
      "Use at least 8 characters, and add an uppercase letter, a number and a special character such as ! or #",
    );
    expect(said("Aa1!")).toBe("Password must be at least 8 characters");
  });

  it.each(Array.from("!\"#$%&'()*+,-./:;=?@[\\]^_`{|}~"))(
    "counts %j as a special character, as the backend does",
    (symbol) => {
      expect(said(`Blueberry7${symbol}pancakes`)).toBeUndefined();
    },
  );

  it.each(["<", ">", " ", "é"])(
    "does not count %j as one: the backend doesn't",
    (character) => {
      expect(said(`Blueberry7${character}pancakes`)).toBe(
        "Add a special character such as ! or #",
      );
    },
  );

  it("is measured as the backend measures it, in bytes", () => {
    const tooLong =
      "Password must be 72 characters or less (accented letters and emoji count as more than one)";
    expect(said(`Aa1!${"x".repeat(69)}`)).toBe(tooLong);
    // 4 bytes and 35 letters of two bytes each: 74.
    expect(said(`Aa1!${"é".repeat(35)}`)).toBe(tooLong);
    expect(said(`Aa1!${"é".repeat(34)}`)).toBeUndefined();
  });
});

describe("the forms that ask for a new password", () => {
  const WEAK = "blueberry pancakes";
  const NEEDS =
    "Add an uppercase letter, a number and a special character such as ! or #";
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
    expect(at(signupFormSchema.safeParse(form(WEAK)), "password")).toBe(NEEDS);
    expect(
      signupFormSchema.safeParse(form("Blueberry-pancakes-7")).success,
    ).toBe(true);
  });

  it("reset: holds the new password to the rule", () => {
    expect(
      at(
        resetPasswordSchema.safeParse({
          password: WEAK,
          confirmPassword: WEAK,
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
          newPassword: WEAK,
          confirmPassword: WEAK,
        }),
        "newPassword",
      ),
    ).toBe(NEEDS);
  });
});
