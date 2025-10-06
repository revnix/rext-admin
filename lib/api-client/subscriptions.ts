/**
 * Subscriptions API Namespace
 *
 * Handles subscription and billing management
 */

import type {
  SubscriptionHistoryResponse,
  SubscriptionListResponse,
  TrialStatus,
  UsageStats,
  UserSubscription,
} from "@/types/subscription";
import type { ApiClient } from "./core";

export function createSubscriptionsNamespace(client: ApiClient) {
  return {
    /**
     * Get current user's subscription
     */
    getCurrentPlan: async () => {
      return client.request<UserSubscription>(
        "/api/v1/subscriptions/my-subscription",
        {
          method: "GET",
        },
      );
    },

    /**
     * Get all available plans
     */
    getPlans: async () => {
      return client.request<SubscriptionListResponse>(
        "/api/v1/subscriptions/plans",
        {
          method: "GET",
        },
      );
    },

    /**
     * Get specific plan
     */
    getPlan: async (planId: string) => {
      return client.request<{
        id: string;
        name: string;
        price: number;
        features: string[];
      }>(`/api/v1/subscriptions/plans/${planId}`, {
        method: "GET",
      });
    },

    /**
     * Subscribe to a plan
     */
    subscribe: async (data: {
      plan_id: string;
      payment_method_id?: string;
    }) => {
      return client.request<{
        id: string;
        plan_id: string;
        status: string;
      }>("/api/v1/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Upgrade subscription
     */
    upgrade: async (data: { plan_id: string }) => {
      return client.request<{
        id: string;
        plan_id: string;
        status: string;
      }>("/api/v1/subscriptions/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Cancel subscription
     */
    cancel: async (data?: { reason?: string; feedback?: string }) => {
      return client.request<{
        success: boolean;
        message: string;
      }>("/api/v1/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
      });
    },

    /**
     * Get subscription history
     */
    getHistory: async (limit = 50, offset = 0) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      return client.request<SubscriptionHistoryResponse>(
        `/api/v1/subscriptions/history?${params}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get usage statistics
     */
    getUsageStats: async () => {
      return client.request<UsageStats>("/api/v1/subscriptions/usage", {
        method: "GET",
      });
    },

    /**
     * Get trial status
     */
    getTrialStatus: async () => {
      return client.request<TrialStatus>("/api/v1/subscriptions/trial-status", {
        method: "GET",
      });
    },
  };
}
