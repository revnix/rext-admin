/**
 * Admin Webhook Monitoring API Namespace
 *
 * Handles webhook event monitoring for super admin users
 * Requires super admin role for all endpoints
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WebhookEvent {
  id: string;
  event_name: string;
  event_id: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  status: "processed" | "pending" | "failed";
}

export interface WebhookEventsSummary {
  total: number;
  processed: number;
  pending: number;
  failed: number;
}

export interface WebhookEventsPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface WebhookEventsResponse {
  events: WebhookEvent[];
  pagination: WebhookEventsPagination;
  summary: WebhookEventsSummary;
}

export interface WebhookStats {
  total_events: number;
  processed_events: number;
  failed_events: number;
  pending_events: number;
  success_rate: number;
  event_type_breakdown: Array<{
    event_name: string;
    count: number;
    failed_count: number;
  }>;
  recent_errors: Array<{
    event_name: string;
    error_message: string;
    created_at: string;
  }>;
}

export interface WebhookEventsFilters {
  page?: number;
  per_page?: number;
  event_name?: string;
  processed?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface WebhookApiResponse<T> {
  data: T;
  message?: string;
}

// ============================================================================
// ADMIN WEBHOOKS NAMESPACE
// ============================================================================

export function createAdminWebhooksNamespace(client: ApiClient) {
  return {
    /**
     * List webhook events with filtering and pagination
     *
     * @param filters - Filter and pagination options
     * @requires Super admin role
     */
    getEvents: async (
      filters: WebhookEventsFilters = {},
    ): Promise<WebhookEventsResponse> => {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.per_page)
        params.append("per_page", filters.per_page.toString());
      if (filters.event_name) params.append("event_name", filters.event_name);
      if (filters.processed !== undefined)
        params.append("processed", filters.processed.toString());
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const queryString = params.toString();
      const url = `${ENDPOINTS.ADMIN_WEBHOOKS.events}${queryString ? `?${queryString}` : ""}`;

      const response = await client.request<
        WebhookApiResponse<WebhookEventsResponse>
      >(url, {
        method: "GET",
      });
      return response.data;
    },

    /**
     * Get failed webhook events
     *
     * @param page - Page number
     * @param perPage - Items per page
     * @param hours - Look back hours (default 24)
     * @requires Super admin role
     */
    getFailedEvents: async (
      page = 1,
      perPage = 50,
      hours = 24,
    ): Promise<WebhookEventsResponse> => {
      const response = await client.request<
        WebhookApiResponse<WebhookEventsResponse>
      >(
        `${ENDPOINTS.ADMIN_WEBHOOKS.failed}?page=${page}&per_page=${perPage}&hours=${hours}`,
        {
          method: "GET",
        },
      );
      return response.data;
    },

    /**
     * Retry a failed webhook event
     *
     * @param eventId - UUID of the webhook event to retry
     * @requires Super admin role
     */
    retryWebhook: async (
      eventId: string,
    ): Promise<{ success: boolean; message: string }> => {
      const response = await client.request<
        WebhookApiResponse<{ success: boolean; message: string }>
      >(ENDPOINTS.ADMIN_WEBHOOKS.retry(eventId), {
        method: "POST",
      });
      return response.data;
    },

    /**
     * Get webhook processing statistics
     *
     * @requires Super admin role
     */
    getStats: async (): Promise<WebhookStats> => {
      const response = await client.request<WebhookApiResponse<WebhookStats>>(
        ENDPOINTS.ADMIN_WEBHOOKS.stats,
        {
          method: "GET",
        },
      );
      return response.data;
    },
  };
}
