/**
 * Tests for Permission Utilities
 */

import {
  checkAllPermissions,
  checkAnyPermission,
  checkAnyRole,
  checkPermission,
  checkRole,
  isAdmin,
  isSuperAdmin,
  ROLES,
  type UserWithPermissions,
} from "@/lib/permissions";

describe("permission utilities", () => {
  const baseUser: UserWithPermissions = {
    id: "u-1",
    email: "user@example.com",
    name: "User",
    role: ROLES.ADMIN,
    permissions: ["user.read", "role.read", "role.create"],
  };

  describe("checkPermission", () => {
    it("returns false for null user", () => {
      expect(checkPermission(null, "user.read")).toBe(false);
    });

    it("allows super_admin bypass for permission checks", () => {
      const superAdmin: UserWithPermissions = {
        ...baseUser,
        role: ROLES.SUPER_ADMIN,
        permissions: [],
      };

      expect(checkPermission(superAdmin, "nonexistent.permission")).toBe(true);
    });

    it("returns true for user with specific permission", () => {
      expect(checkPermission(baseUser, "role.read")).toBe(true);
    });

    it("returns false for user without specific permission", () => {
      expect(checkPermission(baseUser, "permission.delete")).toBe(false);
    });

    it("returns false when user has no permissions array", () => {
      const userNoPerms: UserWithPermissions = {
        id: "u-2",
        email: "user2@example.com",
        name: "User 2",
        role: ROLES.VIEWER,
        permissions: undefined,
      };

      expect(checkPermission(userNoPerms, "user.read")).toBe(false);
    });
  });

  describe("checkAnyPermission", () => {
    it("returns false for null user", () => {
      expect(checkAnyPermission(null, ["user.read"])).toBe(false);
    });

    it("allows super_admin bypass for permission checks", () => {
      const superAdmin: UserWithPermissions = {
        ...baseUser,
        role: ROLES.SUPER_ADMIN,
        permissions: [],
      };

      expect(checkAnyPermission(superAdmin, ["foo", "bar"])).toBe(true);
    });

    it("returns true when user has at least one permission in list", () => {
      expect(
        checkAnyPermission(baseUser, ["permission.delete", "role.read"]),
      ).toBe(true);
    });

    it("returns false when user has no permissions in list", () => {
      expect(checkAnyPermission(baseUser, ["permission.delete"])).toBe(false);
    });

    it("handles empty permission arrays safely", () => {
      expect(checkAnyPermission(baseUser, [])).toBe(false);
    });

    it("returns false when user has no permissions array", () => {
      const userNoPerms: UserWithPermissions = {
        id: "u-2",
        email: "user2@example.com",
        name: "User 2",
        role: ROLES.VIEWER,
        permissions: undefined,
      };

      expect(checkAnyPermission(userNoPerms, ["user.read"])).toBe(false);
    });

    it("returns false when user has empty permissions array", () => {
      const userEptyPerms: UserWithPermissions = {
        id: "u-3",
        email: "user3@example.com",
        name: "User 3",
        role: ROLES.VIEWER,
        permissions: [],
      };

      expect(checkAnyPermission(userEptyPerms, ["user.read"])).toBe(false);
    });
  });

  describe("checkAllPermissions", () => {
    it("returns false for null user", () => {
      expect(checkAllPermissions(null, ["user.read"])).toBe(false);
    });

    it("allows super_admin bypass for permission checks", () => {
      const superAdmin: UserWithPermissions = {
        ...baseUser,
        role: ROLES.SUPER_ADMIN,
        permissions: [],
      };

      expect(checkAllPermissions(superAdmin, ["foo", "bar"])).toBe(true);
    });

    it("returns true when user has all permissions in list", () => {
      expect(checkAllPermissions(baseUser, ["role.read", "role.create"])).toBe(
        true,
      );
    });

    it("returns false when user lacks at least one permission in list", () => {
      expect(
        checkAllPermissions(baseUser, ["role.read", "permission.delete"]),
      ).toBe(false);
    });

    it("handles empty permission arrays safely", () => {
      expect(checkAllPermissions(baseUser, [])).toBe(false);
    });

    it("returns false when user has no permissions array", () => {
      const userNoPerms: UserWithPermissions = {
        id: "u-2",
        email: "user2@example.com",
        name: "User 2",
        role: ROLES.VIEWER,
        permissions: undefined,
      };

      expect(checkAllPermissions(userNoPerms, ["user.read"])).toBe(false);
    });

    it("returns false when user has empty permissions array", () => {
      const userEmptyPerms: UserWithPermissions = {
        id: "u-3",
        email: "user3@example.com",
        name: "User 3",
        role: ROLES.VIEWER,
        permissions: [],
      };

      expect(checkAllPermissions(userEmptyPerms, ["user.read"])).toBe(false);
    });
  });

  describe("checkRole", () => {
    it("returns false for null user", () => {
      expect(checkRole(null, ROLES.ADMIN)).toBe(false);
    });

    it("returns true when user has specific role", () => {
      expect(checkRole(baseUser, ROLES.ADMIN)).toBe(true);
    });

    it("returns false when user has different role", () => {
      expect(checkRole(baseUser, ROLES.SUPER_ADMIN)).toBe(false);
    });

    it("returns false when user has no role", () => {
      const userNoRole: UserWithPermissions = {
        id: "u-4",
        email: "user4@example.com",
        name: "User 4",
        permissions: ["user.read"],
      };

      expect(checkRole(userNoRole, ROLES.ADMIN)).toBe(false);
    });
  });

  describe("checkAnyRole", () => {
    it("returns false for null user", () => {
      expect(checkAnyRole(null, [ROLES.VIEWER, ROLES.ADMIN])).toBe(false);
    });

    it("returns true when user has at least one role in list", () => {
      expect(checkAnyRole(baseUser, [ROLES.VIEWER, ROLES.ADMIN])).toBe(true);
    });

    it("returns false when user has no roles in list", () => {
      expect(checkAnyRole(baseUser, [ROLES.VIEWER, ROLES.SUPER_ADMIN])).toBe(
        false,
      );
    });

    it("handles empty role arrays safely", () => {
      expect(checkAnyRole(baseUser, [])).toBe(false);
    });

    it("returns false when user has no role", () => {
      const userNoRole: UserWithPermissions = {
        id: "u-4",
        email: "user4@example.com",
        name: "User 4",
        permissions: ["user.read"],
      };

      expect(checkAnyRole(userNoRole, [ROLES.ADMIN])).toBe(false);
    });
  });

  describe("role helpers", () => {
    it("isAdmin returns true for admin role", () => {
      expect(isAdmin(baseUser)).toBe(true);
    });

    it("isAdmin returns true for super_admin role", () => {
      const superAdmin: UserWithPermissions = {
        ...baseUser,
        role: ROLES.SUPER_ADMIN,
      };

      expect(isAdmin(superAdmin)).toBe(true);
    });

    it("isAdmin returns false for non-admin roles", () => {
      const viewer: UserWithPermissions = {
        ...baseUser,
        role: ROLES.VIEWER,
      };

      expect(isAdmin(viewer)).toBe(false);
    });

    it("isAdmin returns false for null user", () => {
      expect(isAdmin(null)).toBe(false);
    });

    it("isSuperAdmin returns true for super_admin role", () => {
      const superAdmin: UserWithPermissions = {
        ...baseUser,
        role: ROLES.SUPER_ADMIN,
      };

      expect(isSuperAdmin(superAdmin)).toBe(true);
    });

    it("isSuperAdmin returns false for admin role", () => {
      expect(isSuperAdmin(baseUser)).toBe(false);
    });

    it("isSuperAdmin returns false for null user", () => {
      expect(isSuperAdmin(null)).toBe(false);
    });
  });
});
