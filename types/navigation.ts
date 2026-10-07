import type { LucideIcon } from "lucide-react";

/**
 * Navigation item with optional permission/role requirements
 */
export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];

  /**
   * Next.js Link viewport prefetch control (production only).
   * Omit to keep the framework default ("auto" partial prefetch for the
   * loading boundary) — do this for high-probability destinations only.
   * Set false for low-probability links: every navigation changes the
   * router state (the _rsc token), which re-prefetches ALL visible links,
   * so a full sidebar of default links fires a duplicate _rsc wave per
   * page view. Hover still prefetches when prefetch is false.
   */
  prefetch?: boolean;

  /**
   * Required permission to view this item (single permission)
   */
  permission?: string;

  /**
   * Required permissions - user must have ANY of them
   */
  anyPermission?: string[];

  /**
   * Required permissions - user must have ALL of them
   */
  allPermissions?: string[];

  /**
   * Required role to view this item (single role)
   */
  role?: string;

  /**
   * Required roles - user must have ANY of them
   */
  anyRole?: string[];
}

/**
 * Navigation sub-item with optional permission/role requirements
 */
export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  prefetch?: boolean;

  /**
   * Required permission to view this item (single permission)
   */
  permission?: string;

  /**
   * Required permissions - user must have ANY of them
   */
  anyPermission?: string[];

  /**
   * Required permissions - user must have ALL of them
   */
  allPermissions?: string[];

  /**
   * Required role to view this item (single role)
   */
  role?: string;

  /**
   * Required roles - user must have ANY of them
   */
  anyRole?: string[];
}

/**
 * Navigation group with items
 */
export interface NavGroup {
  groupLabel: string;
  items: NavItem[];

  /**
   * Check item permissions against the user's global permissions only.
   * By default an item is also shown when the permission is held in ANY
   * workspace; admin pages are global-scoped (see proxy.ts), so a workspace
   * grant must not surface them.
   */
  globalOnly?: boolean;

  /**
   * Required permission to view entire group
   */
  permission?: string;

  /**
   * Required role to view entire group
   */
  role?: string;

  /**
   * Required roles - user must have ANY of them to view group
   */
  anyRole?: string[];
}
