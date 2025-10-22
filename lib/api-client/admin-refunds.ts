/**
 * Admin Refunds API Namespace
 *
 * Handles refund operations for super admin users
 * Requires super admin role for all endpoints
 */

import type { ApiClient } from "./core";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Refund {
  id: string;
  user_id: string;
  subscription_id: string | null;
  lemonsqueezy_order_id: string;
  lemonsqueezy_refund_id: string | null;
  refund_amount: number;
  original_amount: number;
  currency: string;
  reason: string | null;
  status: "pending" | "completed" | "failed";
  is_partial: boolean;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  plan_name?: string;
}

export interface RefundSummary {
  total_refunds: number;
  total_amount: number;
  partial_refunds: number;
  completed_refunds: number;
  pending_refunds: number;
  failed_refunds: number;
}

export interface RefundPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface RefundListResponse {
  refunds: Refund[];
  pagination: RefundPagination;
  summary: RefundSummary;
}

export interface RefundFilters {
  user_id?: string;
  subscription_id?: string;
  status?: "pending" | "completed" | "failed";
  is_partial?: boolean;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface RefundCreateRequest {
  order_id?: string;
  subscription_id?: string;
  amount?: number;
  reason?: string;
}

export interface RefundCreateResponse {
  success: boolean;
  refund: Refund;
  message: string;
}

export interface RefundApiResponse<T> {
  data: T;
  message?: string;
}

// ============================================================================
// ADMIN REFUNDS NAMESPACE
// ============================================================================

export function createAdminRefundsNamespace(client: ApiClient) {
  return {
    /**
     * List refunds with filtering and pagination
     *
     * @param filters - Filter and pagination options
     * @requires Super admin role
     */
    list: async (filters: RefundFilters = {}): Promise<RefundListResponse> => {
      const params = new URLSearchParams();

      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.subscription_id)
        params.append("subscription_id", filters.subscription_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.is_partial !== undefined)
        params.append("is_partial", filters.is_partial.toString());
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.per_page)
        params.append("per_page", filters.per_page.toString());

      const queryString = params.toString();
      const url = `/api/v1/admin/subscriptions/refunds${queryString ? `?${queryString}` : ""}`;

      const response = await client.request<
        RefundApiResponse<RefundListResponse>
      >(url, {
        method: "GET",
      });
      return response.data;
    },

    /**
     * Get a single refund by ID
     *
     * @param refundId - UUID of the refund
     * @requires Super admin role
     */
    get: async (refundId: string): Promise<Refund> => {
      const response = await client.request<RefundApiResponse<Refund>>(
        `/api/v1/admin/subscriptions/refunds/${refundId}`,
        {
          method: "GET",
        },
      );
      return response.data;
    },

    /**
     * Create a new refund via LemonSqueezy API
     *
     * @param data - Refund creation data
     * @requires Super admin role
     */
    create: async (
      data: RefundCreateRequest,
    ): Promise<RefundCreateResponse> => {
      const response = await client.request<
        RefundApiResponse<RefundCreateResponse>
      >("/api/v1/admin/subscriptions/refunds/create", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
  };
}
