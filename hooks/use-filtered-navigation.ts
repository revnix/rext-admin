"use client";

import { useMemo } from "react";
import {
  checkAllPermissions,
  checkAnyPermission,
  checkAnyRole,
  checkPermission,
  checkRole,
} from "@/lib/permissions";
import type { UserWithPermissions } from "@/types/role";
import { usePermissionStore } from "@/stores/permission-store";
import type { NavGroup, NavItem, NavSubItem } from "@/types/navigation";
import { usePermissionUser } from "./use-permission";

/**
 * Check if user has permission in ANY workspace
 * Used for user-level features that require workspace-level permissions
 * (e.g., subscription management - user feature, but requires workspace owner)
 *
 * Note: This function now receives workspacePermissions as a parameter
 * to properly track dependencies in React hooks
 */
function hasPermissionInAnyWorkspace(
  permission: string,
  workspacePermissions: Record<
    string,
    { workspaceId: string; role: string; permissions: string[] }
  >,
): boolean {
  return Object.values(workspacePermissions).some((wsPerms) =>
    wsPerms.permissions.includes(permission),
  );
}

/**
 * Check if user has access to a navigation item
 */
function hasAccessToItem(
  user: UserWithPermissions | null,
  item: NavItem | NavSubItem,
  workspacePermissions: Record<
    string,
    { workspaceId: string; role: string; permissions: string[] }
  >,
): boolean {
  // If no permission/role requirements, allow access
  if (
    !item.permission &&
    !item.anyPermission &&
    !item.allPermissions &&
    !item.role &&
    !item.anyRole
  ) {
    return true;
  }

  // Check single permission (global first, then any workspace)
  if (item.permission) {
    const hasGlobal = checkPermission(user, item.permission);
    const hasInWorkspace = hasPermissionInAnyWorkspace(
      item.permission,
      workspacePermissions,
    );
    if (!hasGlobal && !hasInWorkspace) {
      return false;
    }
  }

  // Check ANY permission (global first, then any workspace)
  if (item.anyPermission && item.anyPermission.length > 0) {
    const hasGlobal = checkAnyPermission(user, item.anyPermission);
    const hasInWorkspace = item.anyPermission.some((perm) =>
      hasPermissionInAnyWorkspace(perm, workspacePermissions),
    );
    if (!hasGlobal && !hasInWorkspace) {
      return false;
    }
  }

  // Check ALL permissions (global first, then any workspace)
  if (item.allPermissions && item.allPermissions.length > 0) {
    const hasGlobal = checkAllPermissions(user, item.allPermissions);
    const hasInWorkspace = item.allPermissions.every((perm) =>
      hasPermissionInAnyWorkspace(perm, workspacePermissions),
    );
    if (!hasGlobal && !hasInWorkspace) {
      return false;
    }
  }

  // Check single role
  if (item.role && !checkRole(user, item.role)) {
    return false;
  }

  // Check ANY role
  if (
    item.anyRole &&
    item.anyRole.length > 0 &&
    !checkAnyRole(user, item.anyRole)
  ) {
    return false;
  }

  return true;
}

/**
 * Filter navigation items based on user permissions/roles
 */
function filterNavItems(
  user: UserWithPermissions | null,
  items: NavItem[],
  workspacePermissions: Record<
    string,
    { workspaceId: string; role: string; permissions: string[] }
  >,
): NavItem[] {
  return items
    .filter((item) => hasAccessToItem(user, item, workspacePermissions))
    .map((item) => {
      // Filter sub-items if they exist
      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items.filter((subItem) =>
          hasAccessToItem(user, subItem, workspacePermissions),
        );

        // Only include parent if it has accessible sub-items or is accessible itself
        if (filteredSubItems.length === 0 && item.items.length > 0) {
          return null; // Don't include parent if all sub-items are filtered out
        }

        return {
          ...item,
          items: filteredSubItems,
        };
      }

      return item;
    })
    .filter((item): item is NavItem => item !== null);
}

/**
 * Check if user has access to a navigation group
 */
function hasAccessToGroup(
  user: UserWithPermissions | null,
  group: NavGroup,
): boolean {
  // If no permission/role requirements on group, allow access
  if (!group.permission && !group.role && !group.anyRole) {
    return true;
  }

  // Check group-level permission
  if (group.permission && !checkPermission(user, group.permission)) {
    return false;
  }

  // Check group-level role
  if (group.role && !checkRole(user, group.role)) {
    return false;
  }

  // Check group-level ANY role
  if (
    group.anyRole &&
    group.anyRole.length > 0 &&
    !checkAnyRole(user, group.anyRole)
  ) {
    return false;
  }

  return true;
}

/**
 * Hook to filter navigation groups based on user permissions and roles
 *
 * @param groups - Array of navigation groups
 * @returns Filtered navigation groups based on user's permissions/roles
 *
 * @example
 * const filteredNav = useFilteredNavigation(navigationGroups);
 * <NavMain groups={filteredNav} />
 */
export function useFilteredNavigation(groups: NavGroup[]): NavGroup[] {
  const user = usePermissionUser();

  // Subscribe to workspace permissions to make navigation reactive
  const workspacePermissions = usePermissionStore(
    (state) => state.workspacePermissions,
  );

  return useMemo(() => {
    return groups
      .filter((group) => hasAccessToGroup(user, group))
      .map((group) => ({
        ...group,
        items: filterNavItems(user, group.items, workspacePermissions),
      }))
      .filter((group) => group.items.length > 0); // Remove empty groups
  }, [user, groups, workspacePermissions]);
}
