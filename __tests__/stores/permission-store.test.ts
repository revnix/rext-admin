/**
 * Tests for Permission Store
 */

import { renderHook, act } from "@testing-library/react";
import { usePermissionStore } from "@/stores/permission-store";
import type { User, WorkspacePermissions } from "@/stores/permission-store";

describe("permission store", () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePermissionStore());
    act(() => {
      result.current.clearPermissions();
    });
  });

  describe("setUser and basic state", () => {
    it("setUser sets the user in store", () => {
      const { result } = renderHook(() => usePermissionStore());

      const testUser: User = {
        id: "u-1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        permissions: ["user.read"],
      };

      act(() => {
        result.current.setUser(testUser);
      });

      expect(result.current.user).toEqual(testUser);
    });

    it("setUser clears error on success", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setError("Some error");
      });

      expect(result.current.error).toBe("Some error");

      const testUser: User = {
        id: "u-1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        permissions: ["user.read"],
      };

      act(() => {
        result.current.setUser(testUser);
      });

      expect(result.current.error).toBe(null);
    });

    it("clearPermissions resets all state", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read"],
        });
        result.current.setError("Test error");
      });

      act(() => {
        result.current.clearPermissions();
      });

      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.workspacePermissions.size).toBe(0);
      expect(result.current.workspaceLoadingStates.size).toBe(0);
    });
  });

  describe("workspace permissions", () => {
    beforeEach(() => {
      const { result } = renderHook(() => usePermissionStore());
      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read"],
        });
      });
    });

    it("setWorkspacePermissions adds or updates workspace permissions", () => {
      const { result } = renderHook(() => usePermissionStore());

      const wsPerms: WorkspacePermissions = {
        workspaceId: "ws-1",
        role: "manager",
        permissions: ["workspace.update"],
      };

      act(() => {
        result.current.setWorkspacePermissions("ws-1", wsPerms);
      });

      expect(result.current.workspacePermissions.get("ws-1")).toEqual(wsPerms);
    });

    it("setWorkspacePermissions marks workspace as loaded", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setWorkspaceLoading("ws-1", true);
      });

      expect(result.current.isWorkspaceLoading("ws-1")).toBe(true);

      act(() => {
        result.current.setWorkspacePermissions("ws-1", {
          workspaceId: "ws-1",
          role: "manager",
          permissions: ["workspace.update"],
        });
      });

      expect(result.current.isWorkspaceLoading("ws-1")).toBe(false);
    });

    it("setWorkspaceLoading tracks loading state per workspace", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setWorkspaceLoading("ws-1", true);
        result.current.setWorkspaceLoading("ws-2", false);
      });

      expect(result.current.isWorkspaceLoading("ws-1")).toBe(true);
      expect(result.current.isWorkspaceLoading("ws-2")).toBe(false);
    });

    it("isWorkspaceLoading returns false for unset workspace", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(result.current.isWorkspaceLoading("ws-unknown")).toBe(false);
    });
  });

  describe("hasPermission with workspace and global fallback", () => {
    it("returns false when no user", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(result.current.hasPermission("user.read")).toBe(false);
    });

    it("grants all permissions to super_admin", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUser({
          id: "u-2",
          name: "Super",
          email: "super@example.com",
          role: "super_admin",
          permissions: [],
        });
      });

      expect(result.current.hasPermission("totally.random.permission")).toBe(
        true,
      );
    });

    it("checks workspace-scoped permissions first", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read"],
        });

        result.current.setWorkspacePermissions("ws-1", {
          workspaceId: "ws-1",
          role: "manager",
          permissions: ["workspace.update"],
        });
      });

      expect(result.current.hasPermission("workspace.update", "ws-1")).toBe(
        true,
      );
    });

    it("falls back to global permission when workspace permission not found", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read"],
        });

        result.current.setWorkspacePermissions("ws-1", {
          workspaceId: "ws-1",
          role: "manager",
          permissions: ["workspace.update"],
        });
      });

      // user.read is in global permissions, should fall back and find it
      expect(result.current.hasPermission("user.read", "ws-1")).toBe(true);
    });

    it("returns false when permission doesn't exist in workspace or global", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read"],
        });

        result.current.setWorkspacePermissions("ws-1", {
          workspaceId: "ws-1",
          role: "manager",
          permissions: ["workspace.update"],
        });
      });

      expect(result.current.hasPermission("workspace.delete", "ws-1")).toBe(
        false,
      );
    });

    it("checks global permissions when no workspaceId provided", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read"],
        });
      });

      expect(result.current.hasPermission("user.read")).toBe(true);
      expect(result.current.hasPermission("user.write")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    beforeEach(() => {
      const { result } = renderHook(() => usePermissionStore());
      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read", "user.create"],
        });

        result.current.setWorkspacePermissions("ws-1", {
          workspaceId: "ws-1",
          role: "manager",
          permissions: ["workspace.update"],
        });
      });
    });

    it("returns true when user has at least one permission", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(
        result.current.hasAnyPermission(["user.read", "user.update"]),
      ).toBe(true);
    });

    it("returns false when user has no permissions in list", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(
        result.current.hasAnyPermission(["user.delete", "role.create"]),
      ).toBe(false);
    });

    it("respects workspace-scoped permissions", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(
        result.current.hasAnyPermission(
          ["workspace.update", "workspace.delete"],
          "ws-1",
        ),
      ).toBe(true);
    });
  });

  describe("hasAllPermissions", () => {
    beforeEach(() => {
      const { result } = renderHook(() => usePermissionStore());
      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read", "user.create"],
        });

        result.current.setWorkspacePermissions("ws-1", {
          workspaceId: "ws-1",
          role: "manager",
          permissions: ["workspace.update"],
        });
      });
    });

    it("returns true when user has all permissions", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(
        result.current.hasAllPermissions(["user.read", "user.create"]),
      ).toBe(true);
    });

    it("returns false when user lacks at least one permission", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(
        result.current.hasAllPermissions(["user.read", "user.delete"]),
      ).toBe(false);
    });

    it("respects workspace-scoped permissions", () => {
      const { result } = renderHook(() => usePermissionStore());

      // workspace.update is in ws-1 permissions
      expect(
        result.current.hasAllPermissions(["workspace.update"], "ws-1"),
      ).toBe(true);

      // Mix of workspace and this won't work as workspace only has workspace.update
      expect(
        result.current.hasAllPermissions(
          ["workspace.update", "workspace.delete"],
          "ws-1",
        ),
      ).toBe(false);
    });
  });

  describe("role helpers", () => {
    beforeEach(() => {
      const { result } = renderHook(() => usePermissionStore());
      act(() => {
        result.current.setUser({
          id: "u-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin",
          permissions: ["user.read"],
        });
      });
    });

    it("hasRole returns true for matching role", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(result.current.hasRole("admin")).toBe(true);
    });

    it("hasRole returns false for non-matching role", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(result.current.hasRole("super_admin")).toBe(false);
    });

    it("isAdmin returns true for admin role", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(result.current.isAdmin()).toBe(true);
    });

    it("isAdmin returns true for super_admin role", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUser({
          id: "u-2",
          name: "Super",
          email: "super@example.com",
          role: "super_admin",
          permissions: [],
        });
      });

      expect(result.current.isAdmin()).toBe(true);
    });

    it("isAdmin returns false for non-admin roles", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setUser({
          id: "u-3",
          name: "Viewer",
          email: "viewer@example.com",
          role: "viewer",
          permissions: [],
        });
      });

      expect(result.current.isAdmin()).toBe(false);
    });

    it("isSuperAdmin returns true only for super_admin role", () => {
      const { result } = renderHook(() => usePermissionStore());

      expect(result.current.isSuperAdmin()).toBe(false);

      act(() => {
        result.current.setUser({
          id: "u-2",
          name: "Super",
          email: "super@example.com",
          role: "super_admin",
          permissions: [],
        });
      });

      expect(result.current.isSuperAdmin()).toBe(true);
    });
  });

  describe("error and loading states", () => {
    it("setError sets error state", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setError("Test error message");
      });

      expect(result.current.error).toBe("Test error message");
    });

    it("setLoading sets loading state", () => {
      const { result } = renderHook(() => usePermissionStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
