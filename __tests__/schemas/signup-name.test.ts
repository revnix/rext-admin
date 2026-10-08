/**
 * A person is never refused at sign-up for how their name is written (rext-control task 933). On
 * launch day one person was refused three times in nine seconds for a lower-case first letter,
 * and the form itself refused every name without a Latin letter.
 */

import { signupFormSchema } from "@/schemas/auth-schemas";

const form = (full_name: string) => ({
  full_name,
  email: "new.writer@example.com",
  password: "A-long-passphrase-1",
  confirmPassword: "A-long-passphrase-1",
});
const refusal = (full_name: string) =>
  signupFormSchema
    .safeParse(form(full_name))
    .error?.issues.find((issue) => issue.path[0] === "full_name")?.message;

describe("the sign-up form's name", () => {
  it.each([
    "john smith",
    "José Álvarez",
    "O'Brien",
    "Anne-Marie",
    "Li",
    "Müller",
    "李雷",
    "محمد",
    "Sam Jones 3rd",
  ])("takes %j as it is written", (name) => {
    expect(refusal(name)).toBeUndefined();
    expect(signupFormSchema.parse(form(`  ${name} `)).full_name).toBe(name);
  });

  it("still asks for a name, with a letter in it, of 100 characters at most", () => {
    expect(refusal("")).toBe("Full name is required");
    expect(refusal("   ")).toBe("Full name is required");
    expect(refusal("12345")).toBe("Name must contain at least one letter");
    expect(refusal("x".repeat(101))).toBe(
      "Full name must be 100 characters or less",
    );
    expect(refusal("x".repeat(100))).toBeUndefined();
  });
});
