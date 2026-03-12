import { signupFormSchema } from "@/schemas/auth-schemas";
import { profileSchema } from "@/schemas/profile-schemas";

describe("Name Validation", () => {
  describe("signupFormSchema", () => {
    it("should accept names without numbers", () => {
      const result = signupFormSchema.safeParse({
        full_name: "John Doe",
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject names with numbers", () => {
      const result = signupFormSchema.safeParse({
        full_name: "John123",
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (i) => i.message === "Name should not contain numbers",
          ),
        ).toBe(true);
      }
    });
  });

  describe("profileSchema", () => {
    it("should accept names without numbers", () => {
      const result = profileSchema.safeParse({
        full_name: "John Doe",
      });
      expect(result.success).toBe(true);
    });

    it("should reject names with numbers", () => {
      const result = profileSchema.safeParse({
        full_name: "John123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (i) => i.message === "Name should not contain numbers",
          ),
        ).toBe(true);
      }
    });
  });
});
