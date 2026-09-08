/**
 * Admin Refunds API Namespace
 *
 * Handles refund operations for super admin users
 * Requires super admin role for all endpoints
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

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

/** An order an admin can refund against, from our local orders table. */
export interface RefundableOrder {
  id: string;
  lemonsqueezy_order_id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  subscription_id: string | null;
  product_name: string | null;
  status: string;
  /** Cents, as LemonSqueezy reports them. */
  total: number;
  currency: string;
  receipt_url: string | null;
  ordered_at: string | null;
  created_at: string;
  already_refunded: boolean;
  refunded_amount: number;
}

export interface RefundableOrderListResponse {
  data: RefundableOrder[];
  pagination: RefundPagination;
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

/** A customer's refund request awaiting or having had admin review. */
export interface RefundRequestRow {
  id: string;
  user_id: string;
  order_id: string;
  lemonsqueezy_order_id: string;
  requested_amount: number;
  currency: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_at: string | null;
  refund_id: string | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
  product_name: string | null;
  order_total: number | null;
}

export interface RefundRequestListResponse {
  data: RefundRequestRow[];
  pagination: RefundPagination;
}

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
      const url = `${ENDPOINTS.ADMIN_REFUNDS.list}${queryString ? `?${queryString}` : ""}`;

      return client.request<RefundListResponse>(url, {
        method: "GET",
      });
    },

    /**
     * Get a single refund by ID
     *
     * @param refundId - UUID of the refund
     * @requires Super admin role
     */
    get: async (refundId: string): Promise<Refund> => {
      return client.request<Refund>(ENDPOINTS.ADMIN_REFUNDS.get(refundId), {
        method: "GET",
      });
    },

    /**
     * Search orders that can be refunded against.
     *
     * Admins previously had to already know a LemonSqueezy order id; this
     * makes them discoverable by customer email, name, product or id.
     *
     * @param params - search term, status filter and pagination
     * @requires Super admin role
     */
    searchOrders: async (
      params: {
        search?: string;
        status?: string;
        page?: number;
        per_page?: number;
      } = {},
    ): Promise<RefundableOrderListResponse> => {
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.status) query.append("status", params.status);
      if (params.page) query.append("page", params.page.toString());
      if (params.per_page) query.append("per_page", params.per_page.toString());

      const qs = query.toString();
      return client.request<RefundableOrderListResponse>(
        `${ENDPOINTS.ADMIN_REFUNDS.orders}${qs ? `?${qs}` : ""}`,
        { method: "GET" },
      );
    },

    /**
     * List customer refund requests. Pending sort first.
     *
     * @requires Super admin role
     */
    listRequests: async (
      params: { status?: string; page?: number; per_page?: number } = {},
    ): Promise<RefundRequestListResponse> => {
      const query = new URLSearchParams();
      if (params.status) query.append("status", params.status);
      if (params.page) query.append("page", params.page.toString());
      if (params.per_page) query.append("per_page", params.per_page.toString());
      const qs = query.toString();

      return client.request<RefundRequestListResponse>(
        `${ENDPOINTS.ADMIN_REFUNDS.requests}${qs ? `?${qs}` : ""}`,
        { method: "GET" },
      );
    },

    /**
     * Approve a request and refund the order in one step.
     *
     * @requires Super admin role
     */
    approveRequest: async (
      requestId: string,
      adminNote?: string,
    ): Promise<unknown> => {
      return client.request(ENDPOINTS.ADMIN_REFUNDS.approveRequest(requestId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_note: adminNote ?? null }),
      });
    },

    /**
     * Reject a request. No money moves; the note is shown to the customer.
     *
     * @requires Super admin role
     */
    rejectRequest: async (
      requestId: string,
      adminNote?: string,
    ): Promise<unknown> => {
      return client.request(ENDPOINTS.ADMIN_REFUNDS.rejectRequest(requestId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_note: adminNote ?? null }),
      });
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
      return client.request<RefundCreateResponse>(
        ENDPOINTS.ADMIN_REFUNDS.create,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },
  };
}
