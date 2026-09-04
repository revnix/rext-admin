/**
 * Account-Creation IP Allowlist API Namespace
 *
 * Manages the organization's approved public egress IPs. When a registration's
 * verified client IP matches an active allowlist entry, the per-device account
 * creation cap is skipped for that request.
 *
 * Requires admin / super_admin role for all endpoints.
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AllowlistEntry {
  id: string;
  /** Normalized on the server - always render this, never local input state. */
  ip_address: string;
  label: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AllowlistCreateInput {
  ip_address: string;
  label?: string | null;
  is_active?: boolean;
}

export interface AllowlistUpdateInput {
  label?: string | null;
  is_active?: boolean;
}

// ============================================================================
// ADMIN ACCOUNT ALLOWLIST NAMESPACE
// ============================================================================

export function createAdminAccountAllowlistNamespace(client: ApiClient) {
  const E = ENDPOINTS.ADMIN_ACCOUNT_ALLOWLIST;
  return {
    /** List every entry (active + inactive), newest first. */
    list: () =>
      client.request<{ entries: AllowlistEntry[]; total_count: number }>(
        E.list,
        { method: "GET" },
      ),

    /** Add an IP or CIDR range. Throws ApiError 422 / 409. */
    create: (input: AllowlistCreateInput) =>
      client.request<AllowlistEntry>(E.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),

    /** Rename or toggle active. Send only what changes. */
    update: (id: string, input: AllowlistUpdateInput) =>
      client.request<AllowlistEntry>(E.detail(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),

    /** Remove permanently. */
    remove: (id: string) =>
      client.request<{ id: string; deleted: boolean }>(E.detail(id), {
        method: "DELETE",
      }),
  };
}
