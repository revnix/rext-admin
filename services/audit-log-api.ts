/**
 * Audit Log API Service
 *
 * Handles fetching and filtering audit logs for activity tracking.
 */

// Use this file's existing function-level JSDoc style as the local convention
// for notifications/SSE function docs (params, returns, side effects, throws).

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { authenticatedFetch } from "@/lib/auth-utils";
import { buildUrl } from "@/lib/url-utils";
import type {
  AuditLogDetail,
  AuditLogFilters,
  AuditLogListResponse,
} from "@/types/audit-log";

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Fetch user's own audit logs
 *
 * @param filters - Optional filters for querying logs
 * @returns Paginated list of audit logs
 */
export async function getMyAuditLogs(
  filters?: AuditLogFilters,
): Promise<AuditLogListResponse> {
  const url = buildUrl(`${API_BASE_URL}/api/v1/audit-logs/user/my-logs`, {
    action: filters?.action,
    resource_type: filters?.resource_type,
    date_from: filters?.date_from,
    date_to: filters?.date_to,
    limit: filters?.limit,
    offset: filters?.offset,
  });

  const response = await authenticatedFetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data as AuditLogListResponse;
}

/**
 * Fetch a specific audit log by ID (admin only)
 *
 * @param logId - UUID of the audit log
 * @returns Detailed audit log entry
 */
export async function getAuditLogById(logId: string): Promise<AuditLogDetail> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/audit-logs/${logId}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch audit log detail: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data as AuditLogDetail;
}

/**
 * Fetch all audit logs (admin only)
 *
 * @param filters - Optional filters for querying logs
 * @returns Paginated list of audit logs
 */
export async function getAllAuditLogs(
  filters?: AuditLogFilters & {
    user_id?: string;
    full_name?: string;
    user_email?: string;
    workspace_id?: string;
    status?: "success" | "failed" | "partial";
  },
): Promise<AuditLogListResponse> {
  const url = buildUrl(`${API_BASE_URL}/api/v1/audit-logs`, {
    user_id: filters?.user_id,
    full_name: filters?.full_name,
    user_email: filters?.user_email,
    action: filters?.action,
    resource_type: filters?.resource_type,
    workspace_id: filters?.workspace_id,
    status_filter: filters?.status,
    date_from: filters?.date_from,
    date_to: filters?.date_to,
    limit: filters?.limit,
    offset: filters?.offset,
  });

  const response = await authenticatedFetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data as AuditLogListResponse;
}

/**
 * Audit Log API Service (backward compatibility)
 */
export const AuditLogApiService = {
  getMyAuditLogs,
  getAuditLogById,
  getAllAuditLogs,
};
