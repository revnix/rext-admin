/**
 * Admin Webhook Monitoring API Namespace
 *
 * Handles webhook event monitoring for super admin users
 * Requires super admin role for all endpoints
 */

import { buildUrl } from "../url-utils";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";
import type {
  WebhookEventRow,
  FailedWebhookListResponse,
  WebhookPagination,
  WebhookFailureStatistics,
  WebhookStatsResponseSchema,
} from "@/types/generated/types.gen";

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
      const url = buildUrl(ENDPOINTS.ADMIN_WEBHOOKS.events, {
        page: filters?.page,
        per_page: filters?.per_page,
        event_name: filters?.event_name,
        processed: filters?.processed,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
      });

      // The backend returns a complex object; we cast to our local rigid WebhookEventsResponse
      return client.request<WebhookEventsResponse>(url, {
        method: "GET",
      });
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
      // The backend returns FailedWebhookListResponse. We map this to our unified WebhookEventsResponse.
      const response = await client.request<FailedWebhookListResponse>(
        `${ENDPOINTS.ADMIN_WEBHOOKS.failed}?page=${page}&per_page=${perPage}&hours=${hours}`,
        {
          method: "GET",
        },
      );

      return {
        events: response.failed_events as unknown as WebhookEvent[],
        pagination: response.pagination as unknown as WebhookEventsPagination,
        summary: {
          total: response.statistics.total_failed,
          processed: 0,
          pending: 0,
          failed: response.statistics.total_failed,
        },
      };
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
      return client.request<{ success: boolean; message: string }>(
        ENDPOINTS.ADMIN_WEBHOOKS.retry(eventId),
        {
          method: "POST",
        },
      );
    },

    /**
     * Get webhook processing statistics
     *
     * @requires Super admin role
     */
    getStats: async (): Promise<WebhookStats> => {
      const response = await client.request<WebhookStatsResponseSchema>(
        ENDPOINTS.ADMIN_WEBHOOKS.stats,
        {
          method: "GET",
        },
      );

      // Map generated WebhookStatsResponseSchema to local rigid WebhookStats
      return {
        total_events: response.total_events,
        processed_events: response.processed,
        failed_events: response.failed,
        pending_events: response.pending,
        success_rate: response.success_rate,
        event_type_breakdown: [], // Field missing in backend response schema
        recent_errors: [], // Field missing in backend response schema
      } as WebhookStats;
    },
  };
}
