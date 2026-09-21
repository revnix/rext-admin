import {
  orderPermissionsForRevocation,
  PERMISSION_DEPENDENCIES,
  resolvePermissionPrerequisites,
  updatePermissionSelection,
} from "@/lib/permission-dependencies";

// The final approved technical dependency map. Must stay identical to
// rext-backend/src/constants/permission_dependencies.py.
const APPROVED_MAP: Record<string, string[]> = {
  // Content
  "content.create": ["content.read"],
  "content.update": ["content.read"],
  "content.delete": ["content.read"],
  "content.publish": ["content.read"],

  // Member
  "member.update_role": ["member.read"],
  "member.invite": ["member.read"],
  "member.remove": ["member.read"],

  // Workspace
  "workspace.update": ["workspace.read"],
  "workspace.delete": ["workspace.read"],

  // Role
  "role.create": ["role.read"],
  "role.update": ["role.read"],
  "role.delete": ["role.read"],
  "role.manage_permissions": ["role.read"],

  // User
  "user.invite": ["user.read"],
  "user.update": ["user.read"],
  "user.delete": ["user.read"],
  "user.manage_roles": ["user.read", "role.read"],

  // Billing
  "billing.manage": ["billing.read"],
  "integration.create": ["integration.read"],
  "integration.update": ["integration.read"],
  "integration.delete": ["integration.read"],
  "brand_voice.update": ["brand_voice.read"],
  "persona.create": ["persona.read"],
  "persona.update": ["persona.read"],
  "persona.delete": ["persona.read"],
  "security.manage": ["security.read"],
};

// Removed by backend migration 20260916permcleanup; they must not come back.
const REMOVED_PERMISSIONS = [
  "content.approve",
  "content.reject",
  "content.submit_for_review",
  "content.export",
  "member.update",
  "user.create",
  "permission.create",
  "audit.write",
  "admin.invite",
  "license.read",
  "license.view",
  "license.activate",
  "license.deactivate",
  "license.revoke",
  "member.resend_invitation",
  "member.revoke_invitation",
  "workspace.manage_roles",
  "workspace.manage_billing",
  "workspace.transfer",
  "workspace.write",
];

const sorted = (names: string[]) => [...names].sort();

describe("Permission Dependencies Logic", () => {
  describe("Approved technical map", () => {
    it("matches the approved map exactly", () => {
      expect(PERMISSION_DEPENDENCIES).toEqual(APPROVED_MAP);
    });

    it("keeps workflow capabilities out of technical dependencies", () => {
      expect(PERMISSION_DEPENDENCIES["content.publish"]).toEqual([
        "content.read",
      ]);
      expect(PERMISSION_DEPENDENCIES["content.create"]).toEqual([
        "content.read",
      ]);
      expect(PERMISSION_DEPENDENCIES["member.invite"]).toEqual(["member.read"]);
      expect(PERMISSION_DEPENDENCIES["role.create"]).toEqual(["role.read"]);
    });

    it("treats read permissions as having no prerequisites", () => {
      for (const read of [
        "content.read",
        "member.read",
        "workspace.read",
        "role.read",
      ]) {
        expect(PERMISSION_DEPENDENCIES[read]).toBeUndefined();
      }
    });

    it("does not reference removed permissions", () => {
      const referenced = new Set([
        ...Object.keys(PERMISSION_DEPENDENCIES),
        ...Object.values(PERMISSION_DEPENDENCIES).flat(),
      ]);
      for (const removed of REMOVED_PERMISSIONS) {
        expect(referenced.has(removed)).toBe(false);
      }
    });
  });

  describe("resolvePermissionPrerequisites (Forward Auto-Selection)", () => {
    it("auto-selects content.read for every content action", () => {
      for (const action of [
        "content.create",
        "content.update",
        "content.delete",
        "content.publish",
      ]) {
        expect(sorted(resolvePermissionPrerequisites([action]))).toEqual(
          sorted([action, "content.read"]),
        );
      }
    });

    it("resolves member.update_role transitively", () => {
      expect(
        sorted(resolvePermissionPrerequisites(["member.update_role"])),
      ).toEqual(["member.read", "member.update_role"]);
    });

    it("resolves role.manage_permissions without role.update", () => {
      expect(
        sorted(resolvePermissionPrerequisites(["role.manage_permissions"])),
      ).toEqual(["role.manage_permissions", "role.read"]);
    });

    it("resolves workspace.update to workspace.read only", () => {
      expect(
        sorted(resolvePermissionPrerequisites(["workspace.update"])),
      ).toEqual(["workspace.read", "workspace.update"]);
    });
  });

  describe("updatePermissionSelection (Cascade Selection and Removal)", () => {
    it("auto-selects prerequisites when adding a permission", () => {
      expect(
        sorted(updatePermissionSelection([], "content.publish", true)),
      ).toEqual(["content.publish", "content.read"]);
    });

    it("cascade removes dependents when removing a base prerequisite", () => {
      const current = [
        "content.read",
        "content.create",
        "content.update",
        "content.publish",
      ];
      expect(updatePermissionSelection(current, "content.read", false)).toEqual(
        [],
      );
    });

    it("preserves shared prerequisites when removing a dependent permission", () => {
      const current = ["content.read", "content.create", "content.publish"];
      expect(
        sorted(updatePermissionSelection(current, "content.publish", false)),
      ).toEqual(["content.create", "content.read"]);
    });

    it("removes dependents when removing base prerequisite", () => {
      const current = ["member.read", "member.update_role", "member.invite"];
      expect(
        sorted(updatePermissionSelection(current, "member.read", false)),
      ).toEqual([]);
    });

    it("cascades workspace.read removal to workspace.update only", () => {
      const current = resolvePermissionPrerequisites([
        "workspace.update",
        "member.invite",
      ]);
      expect(
        sorted(updatePermissionSelection(current, "workspace.read", false)),
      ).toEqual(["member.invite", "member.read"]);
    });
  });

  describe("orderPermissionsForRevocation", () => {
    it("orders dependents before their prerequisites", () => {
      const order = orderPermissionsForRevocation([
        "member.read",
        "member.update_role",
      ]);
      expect(order.indexOf("member.update_role")).toBeLessThan(
        order.indexOf("member.read"),
      );
    });

    it("keeps every requested permission", () => {
      const names = ["content.read", "content.publish", "content.create"];
      expect(sorted(orderPermissionsForRevocation(names))).toEqual(
        sorted(names),
      );
    });
  });
});
