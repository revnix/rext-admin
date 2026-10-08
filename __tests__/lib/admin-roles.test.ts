import { adminInvitationSchema } from "@/schemas/admin-schemas";
import { ADMIN_ROLES, adminRoleLabel } from "@/types/admin-invitation";

const invitation = (admin_role: string) =>
  adminInvitationSchema.safeParse({
    email: "new.admin@example.com",
    admin_role,
    message: "",
    expiry_days: 7,
  });

describe("the platform roles an admin can be invited to (task 915)", () => {
  it("offers the three roles the backend has, by the names it takes", () => {
    expect(ADMIN_ROLES.map((role) => role.value)).toEqual([
      "super_admin",
      "admin",
      "support",
    ]);
    for (const role of ADMIN_ROLES) {
      expect(invitation(role.value).success).toBe(true);
    }
  });

  it("no longer sends the two names the backend refuses", () => {
    expect(invitation("support_admin").success).toBe(false);
    expect(invitation("platform_admin").success).toBe(false);
  });

  it("words a role for the screen, and shows a name it doesn't know as it came", () => {
    expect(adminRoleLabel("super_admin")).toBe("Super admin");
    expect(adminRoleLabel("admin")).toBe("Platform admin");
    expect(adminRoleLabel("support")).toBe("Support admin");
    expect(adminRoleLabel("billing_admin")).toBe("billing admin");
  });
});
