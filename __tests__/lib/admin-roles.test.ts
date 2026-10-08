import { adminInvitationSchema } from "@/schemas/admin-schemas";
import {
  ADMIN_ROLES,
  adminInvitationLink,
  adminInvitationReturn,
  adminLandingRoute,
  adminRoleLabel,
  sameAddress,
} from "@/types/admin-invitation";

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

  it("lands a new admin where the route guard lets that role in", () => {
    expect(adminLandingRoute("super_admin")).toBe("/admin");
    expect(adminLandingRoute("admin")).toBe("/admin");
    // The admin home turns a support admin away; the users list is theirs.
    expect(adminLandingRoute("support")).toBe("/admin/users");
  });
});

describe("an invitation opened signed out comes back after signing in (task 915)", () => {
  it("makes the link the email's button opens", () => {
    expect(adminInvitationLink("abc-123_x")).toBe(
      "/accept-admin-invitation?token=abc-123_x",
    );
  });

  it("follows an invitation's link from the sign-in page's address, and nothing else", () => {
    const link = adminInvitationLink("abc");
    expect(adminInvitationReturn(link)).toBe(link);

    for (const other of [
      null,
      undefined,
      "",
      "/",
      "/admin",
      "/w/acme/content",
      "/accept-admin-invitation",
      "/accept-admin-invitation/elsewhere?token=abc",
      "//evil.example/accept-admin-invitation?token=abc",
      "https://evil.example/accept-admin-invitation?token=abc",
    ]) {
      expect(adminInvitationReturn(other)).toBeNull();
    }
  });

  it("compares two addresses as the backend does: trimmed, whatever their capitals", () => {
    expect(
      sameAddress(" New.Admin@Example.com ", "new.admin@example.com"),
    ).toBe(true);
    expect(sameAddress("new.admin@example.com", "other@example.com")).toBe(
      false,
    );
  });
});
