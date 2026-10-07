import {
  createLoader,
  parseAsArrayOf,
  parseAsNumberLiteral,
  parseAsString,
} from "nuqs/server";
import {
  DATA_TABLE_PAGE_SIZES,
  dataTableParams,
  parseAsFacet,
} from "@/components/ui/data-table/url-state";

/**
 * The admin users list's state as URL search params (`?q=…&status=banned&role=Editor&page=2`). The
 * server searches, filters and pages it, one status and one role at a time. Imported from
 * `nuqs/server`, which carries no "use client" directive.
 */

export const ADMIN_USER_STATUSES = [
  "active",
  "suspended",
  "banned",
  "pending",
] as const;

export const adminUsersParams = {
  ...dataTableParams,
  size: parseAsNumberLiteral(DATA_TABLE_PAGE_SIZES).withDefault(10),
  status: parseAsFacet(ADMIN_USER_STATUSES),
  // Roles are the platform's own, read from the backend, so any name is kept.
  role: parseAsArrayOf(parseAsString).withDefault([]),
};

export const ADMIN_USERS_FACETS = ["status", "role"] as const;

export const loadAdminUsersParams = createLoader(adminUsersParams);
