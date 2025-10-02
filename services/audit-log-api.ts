/**
 * Audit Log API Service
 *
 * Handles fetching and filtering audit logs for activity tracking.
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import type {
  AuditLogDetail,
  AuditLogFilters,
  AuditLogListResponse,
} from "@/types/audit-log";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:2024";

/**
 * Fetch user's own audit logs
 *
 * @param filters - Optional filters for querying logs
 * @returns Paginated list of audit logs
 */
export async function getMyAuditLogs(
  filters?: AuditLogFilters,
): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();

  if (filters?.action) params.append("action", filters.action);
  if (filters?.resource_type)
    params.append("resource_type", filters.resource_type);
  if (filters?.date_from) params.append("date_from", filters.date_from);
  if (filters?.date_to) params.append("date_to", filters.date_to);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/audit-logs/user/my-logs${queryString ? `?${queryString}` : ""}`;

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
    username?: string;
    user_email?: string;
    workspace_id?: string;
    status?: "success" | "failed" | "partial";
  },
): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();

  if (filters?.user_id) params.append("user_id", filters.user_id);
  if (filters?.username) params.append("username", filters.username);
  if (filters?.user_email) params.append("user_email", filters.user_email);
  if (filters?.action) params.append("action", filters.action);
  if (filters?.resource_type)
    params.append("resource_type", filters.resource_type);
  if (filters?.workspace_id)
    params.append("workspace_id", filters.workspace_id);
  if (filters?.status) params.append("status_filter", filters.status);
  if (filters?.date_from) params.append("date_from", filters.date_from);
  if (filters?.date_to) params.append("date_to", filters.date_to);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/audit-logs${queryString ? `?${queryString}` : ""}`;

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
