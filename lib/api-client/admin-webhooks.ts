/**
 * Admin Webhook Monitoring API Namespace
 *
 * Handles webhook event monitoring for super admin users
 * Requires super admin role for all endpoints
 */

import { buildUrl } from "../url-utils";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WebhookEvent {
  /** Database id (webhook_events.id, a UUID). Use this for retry / detail. */
  id: string;
  event_name: string;
  /** External LemonSqueezy event id - informational only. */
  event_id: string;
  payload?: Record<string, unknown> | null;
  processed: boolean;
  error_message: string | null;
  retry_count?: number;
  created_at: string;
  updated_at?: string;
  processed_at: string | null;
  status: "processed" | "pending" | "failed";
}

export interface WebhookRetryResult {
  success: boolean;
  message: string;
  event?: WebhookEvent;
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

interface WebhookStatsApiResponse {
  overall: {
    total_events: number;
    processed: number;
    failed: number;
    pending: number;
    success_rate: number;
  };
  by_event_type: Array<{
    event_name: string;
    total: number;
    failed: number;
    success_rate: number;
  }>;
}

export type WebhookStatusFilter = "all" | "processed" | "pending" | "failed";

export interface WebhookEventsFilters {
  page?: number;
  per_page?: number;
  event_name?: string;
  /** Preferred: server-side lifecycle filter driving the row list + pagination. */
  status?: WebhookStatusFilter;
  /** @deprecated use `status` */
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
        status:
          filters?.status && filters.status !== "all"
            ? filters.status
            : undefined,
        processed: filters?.processed,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
      });

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
      includePayload = false,
    ): Promise<WebhookEventsResponse> => {
      const raw = await client.request<{
        failed_events: WebhookEvent[];
        pagination: WebhookEventsPagination;
        statistics?: { total_failed?: number };
      }>(
        `${ENDPOINTS.ADMIN_WEBHOOKS.failed}?page=${page}&per_page=${perPage}&hours=${hours}&include_payload=${includePayload}`,
        {
          method: "GET",
        },
      );

      // Normalise the failed-events contract onto the shared events shape.
      const events = raw.failed_events ?? [];
      return {
        events,
        pagination: raw.pagination,
        summary: {
          total:
            raw.statistics?.total_failed ??
            raw.pagination?.total ??
            events.length,
          processed: 0,
          pending: 0,
          failed:
            raw.statistics?.total_failed ??
            raw.pagination?.total ??
            events.length,
        },
      };
    },

    /**
     * Fetch a single webhook event including its redacted payload body.
     *
     * @param webhookId - Database id (webhook_events.id) of the event
     * @requires Super admin role
     */
    getEventDetail: async (webhookId: string): Promise<WebhookEvent> => {
      return client.request<WebhookEvent>(
        ENDPOINTS.ADMIN_WEBHOOKS.detail(webhookId),
        { method: "GET" },
      );
    },

    /**
     * Retry (reprocess) a failed webhook event.
     *
     * The backend re-routes the stored payload through the full handler
     * registry and returns `{ success, message, event }`. A failed reprocess
     * responds with HTTP 400 (thrown by the client), so a resolved promise
     * always means the event was actually reprocessed.
     *
     * @param webhookId - Database id (webhook_events.id) of the event to retry
     * @requires Super admin role
     */
    retryWebhook: async (webhookId: string): Promise<WebhookRetryResult> => {
      return client.request<WebhookRetryResult>(
        ENDPOINTS.ADMIN_WEBHOOKS.retry(webhookId),
        {
          method: "POST",
        },
      );
    },

    /**
     * Get webhook processing statistics
     *
     * @param days - Optional look back period in days. If undefined, fetches all-time stats.
     * @requires Super admin role
     */
    getStats: async (days?: number): Promise<WebhookStats> => {
      const url = buildUrl(ENDPOINTS.ADMIN_WEBHOOKS.stats, { days });
      const response = await client.request<
        WebhookStats | WebhookStatsApiResponse
      >(url, {
        method: "GET",
      });

      if ("overall" in response) {
        return {
          total_events: response.overall.total_events,
          processed_events: response.overall.processed,
          failed_events: response.overall.failed,
          pending_events: response.overall.pending,
          success_rate: response.overall.success_rate,
          event_type_breakdown: response.by_event_type.map((eventType) => ({
            event_name: eventType.event_name,
            count: eventType.total,
            failed_count: eventType.failed,
          })),
          recent_errors: [],
        };
      }

      return response;
    },
  };
}
