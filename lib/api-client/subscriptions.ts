/**
 * Subscriptions API Namespace
 *
 * Handles subscription and billing management with LemonSqueezy integration
 */

import type {
  SubscriptionDetails,
  SubscriptionHistoryResponse,
  SubscriptionUpgradeResponse,
  SubscriptionCancelResponse,
  InvoiceListResponse,
  CheckoutSessionResponse,
  PortalSessionResponse,
  UsageMetricsResponse,
  TrialStatusResponse,
} from "@/types/generated/types.gen";
import type { SubscriptionListResponse } from "@/types/subscription";
import type { ApiClient } from "./core";
import { buildUrl } from "@/lib/url-utils";
import { ENDPOINTS } from "./endpoints";

export function createSubscriptionsNamespace(client: ApiClient) {
  return {
    // ============================================================================
    // SUBSCRIPTION STATUS & PLANS
    // ============================================================================

    /**
     * Get current user's subscription
     */
    getCurrentPlan: async (): Promise<SubscriptionDetails | null> => {
      return client.request<SubscriptionDetails>(
        ENDPOINTS.SUBSCRIPTIONS.mySubscription,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get all available subscription plans
     */
    getPlans: async (): Promise<SubscriptionListResponse> => {
      const response = await client.request<SubscriptionListResponse>(
        ENDPOINTS.SUBSCRIPTIONS.plans,
        {
          method: "GET",
        },
      );
      return response || { plans: [] };
    },

    // ============================================================================
    // CHECKOUT & PAYMENT
    // ============================================================================

    /**
     * Create a checkout session for a subscription plan
     */
    createCheckout: async (
      planId: string,
      billingPeriod: string,
      successUrl?: string,
      cancelUrl?: string,
      discountCode?: string,
      affiliateCode?: string,
    ): Promise<CheckoutSessionResponse> => {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL;

      if (!baseUrl) {
        throw new Error(
          "Cannot determine application URL for checkout redirects.",
        );
      }

      return client.request<CheckoutSessionResponse>(
        ENDPOINTS.SUBSCRIPTIONS.checkout,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            billing_period: billingPeriod,
            success_url: successUrl || `${baseUrl}/checkout/success`,
            cancel_url: cancelUrl || `${baseUrl}/checkout/cancel`,
            ...(discountCode && { discount_code: discountCode }),
            ...(affiliateCode && { affiliate_code: affiliateCode }),
          }),
        },
      );
    },

    /**
     * Get customer portal URL for managing subscription
     */
    getCustomerPortalUrl: async (): Promise<PortalSessionResponse> => {
      return client.request<PortalSessionResponse>(
        ENDPOINTS.SUBSCRIPTIONS.portal,
        {
          method: "GET",
        },
      );
    },

    // ============================================================================
    // USAGE STATS
    // ============================================================================

    /**
     * Get usage statistics
     */
    getUsageStats: async (): Promise<UsageMetricsResponse | null> => {
      return client.request<UsageMetricsResponse>(
        ENDPOINTS.SUBSCRIPTIONS.usage,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get trial status
     */
    getTrialStatus: async (): Promise<TrialStatusResponse | null> => {
      return client.request<TrialStatusResponse>(
        ENDPOINTS.SUBSCRIPTIONS.trialStatus,
        {
          method: "GET",
        },
      );
    },

    /**
     * Upgrade subscription to a new plan
     */
    upgradeSubscription: async (
      planId: string,
      billingPeriod?: string,
    ): Promise<SubscriptionUpgradeResponse> => {
      return client.request<SubscriptionUpgradeResponse>(
        ENDPOINTS.SUBSCRIPTIONS.upgrade,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            billing_period: billingPeriod,
          }),
        },
      );
    },

    /**
     * Downgrade subscription to a new plan
     */
    downgradeSubscription: async (
      planId: string,
      billingPeriod?: string,
    ): Promise<SubscriptionUpgradeResponse> => {
      // Note: Downgrade often uses same response as upgrade (updated subscription)
      return client.request<SubscriptionUpgradeResponse>(
        ENDPOINTS.SUBSCRIPTIONS.downgrade,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            billing_period: billingPeriod,
          }),
        },
      );
    },

    /**
     * Cancel current subscription
     */
    cancelSubscription: async (
      reason?: string,
      cancelImmediately = false,
    ): Promise<SubscriptionCancelResponse> => {
      return client.request<SubscriptionCancelResponse>(
        ENDPOINTS.SUBSCRIPTIONS.cancel,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            cancel_immediately: cancelImmediately,
          }),
        },
      );
    },

    /**
     * Get invoice history
     */
    getInvoices: async (): Promise<InvoiceListResponse> => {
      const response = await client.request<InvoiceListResponse>(
        ENDPOINTS.SUBSCRIPTIONS.invoices,
        {
          method: "GET",
        },
      );
      return response || { invoices: [] };
    },
  };
}
