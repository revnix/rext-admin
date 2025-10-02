"use client";

import { useMemo } from "react";
import {
  checkAllPermissions,
  checkAnyPermission,
  checkAnyRole,
  checkPermission,
  checkRole,
  type UserWithPermissions,
} from "@/lib/permissions";
import type { NavGroup, NavItem, NavSubItem } from "@/types/navigation";
import { usePermissionUser } from "./use-permission";

/**
 * Check if user has access to a navigation item
 */
function hasAccessToItem(
  user: UserWithPermissions | null,
  item: NavItem | NavSubItem,
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

  // Check single permission
  if (item.permission && !checkPermission(user, item.permission)) {
    return false;
  }

  // Check ANY permission
  if (
    item.anyPermission &&
    item.anyPermission.length > 0 &&
    !checkAnyPermission(user, item.anyPermission)
  ) {
    return false;
  }

  // Check ALL permissions
  if (
    item.allPermissions &&
    item.allPermissions.length > 0 &&
    !checkAllPermissions(user, item.allPermissions)
  ) {
    return false;
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
): NavItem[] {
  return items
    .filter((item) => hasAccessToItem(user, item))
    .map((item) => {
      // Filter sub-items if they exist
      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items.filter((subItem) =>
          hasAccessToItem(user, subItem),
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

  return useMemo(() => {
    return groups
      .filter((group) => hasAccessToGroup(user, group))
      .map((group) => ({
        ...group,
        items: filterNavItems(user, group.items),
      }))
      .filter((group) => group.items.length > 0); // Remove empty groups
  }, [user, groups]);
}
