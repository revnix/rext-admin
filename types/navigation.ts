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
