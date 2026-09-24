/**
 * Admin Account Recovery API Namespace
 *
 * Backs the "Account Recovery" tab in User Management: list recovery requests
 * by status and approve / reject a pending one. Requires the admin or
 * super_admin role.
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export type RecoveryRequestStatus = "pending" | "approved" | "rejected";

export interface RecoveryRequestUser {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string;
  status: string;
  deleted_at: string | null;
  deactivated_at: string | null;
}

export interface RecoveryRequestReviewer {
  id: string;
  full_name: string | null;
  email: string;
}

export interface AccountRecoveryRequest {
  id: string;
  user_id: string | null;
  email: string;
  status: RecoveryRequestStatus;
  request_note: string | null;
  review_note: string | null;
  requested_ip: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  reviewed_by: RecoveryRequestReviewer | null;
  user: RecoveryRequestUser | null;
}

export interface RecoveryRequestCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface RecoveryRequestPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface RecoveryRequestListResponse {
  requests: AccountRecoveryRequest[];
  pagination: RecoveryRequestPagination;
  counts: RecoveryRequestCounts;
}

export interface RecoveryRequestListParams {
  status?: RecoveryRequestStatus | "all";
  page?: number;
  per_page?: number;
  search?: string;
}

export function createAccountRecoveryNamespace(client: ApiClient) {
  return {
    /** List recovery requests, optionally filtered by status. Requires `user.read`. */
    list: async (
      params?: RecoveryRequestListParams,
    ): Promise<RecoveryRequestListResponse> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.per_page)
        searchParams.set("per_page", String(params.per_page));
      if (params?.search?.trim())
        searchParams.set("search", params.search.trim());
      const query = searchParams.toString();
      return client.request<RecoveryRequestListResponse>(
        query
          ? `${ENDPOINTS.ACCOUNT_RECOVERY.requests}?${query}`
          : ENDPOINTS.ACCOUNT_RECOVERY.requests,
        { method: "GET" },
      );
    },

    /** Approve a pending request; the account is restored. Requires `user.update`. */
    approve: async (
      requestId: string,
      note?: string,
    ): Promise<AccountRecoveryRequest> => {
      return client.request<AccountRecoveryRequest>(
        ENDPOINTS.ACCOUNT_RECOVERY.approve(requestId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note?.trim() || null }),
        },
      );
    },

    /** Reject a pending request; the account stays deleted. Requires `user.update`. */
    reject: async (
      requestId: string,
      note?: string,
    ): Promise<AccountRecoveryRequest> => {
      return client.request<AccountRecoveryRequest>(
        ENDPOINTS.ACCOUNT_RECOVERY.reject(requestId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note?.trim() || null }),
        },
      );
    },
  };
}
