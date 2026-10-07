import { createLoader, parseAsNumberLiteral } from "nuqs/server";
import {
  DATA_TABLE_PAGE_SIZES,
  dataTableParams,
  parseAsFacet,
} from "@/components/ui/data-table/url-state";

/**
 * The admin audit log's state as URL search params (`?q=…&action=user&resource=workspace&page=2`).
 * The server searches it by user email, filters it and pages it, one action area and one resource
 * type at a time. Imported from `nuqs/server`, which carries no "use client" directive.
 */

/** The areas an action belongs to: the backend matches `user` as the prefix `user.`. */
export const AUDIT_LOG_ACTION_AREAS = [
  "user",
  "workspace",
  "content",
  "subscription",
] as const;

export const AUDIT_LOG_RESOURCE_TYPES = [
  "user",
  "workspace",
  "content",
  "subscription",
  "role",
] as const;

export const adminAuditLogsParams = {
  ...dataTableParams,
  size: parseAsNumberLiteral(DATA_TABLE_PAGE_SIZES).withDefault(50),
  action: parseAsFacet(AUDIT_LOG_ACTION_AREAS),
  resource: parseAsFacet(AUDIT_LOG_RESOURCE_TYPES),
};

export const ADMIN_AUDIT_LOGS_FACETS = ["action", "resource"] as const;

export const loadAdminAuditLogsParams = createLoader(adminAuditLogsParams);
