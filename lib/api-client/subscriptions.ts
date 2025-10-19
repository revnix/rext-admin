/**
 * Subscriptions API Namespace
 *
 * Handles subscription and billing management with LemonSqueezy integration
 */

import type {
  BillingPeriod,
  CheckoutSessionResponse,
  CustomerPortalResponse,
  InvoiceListResponse,
  SubscriptionCancelRequest,
  SubscriptionHistoryResponse,
  SubscriptionListResponse,
  SubscriptionUpgradeRequest,
  TrialStatus,
  UsageStats,
  UserSubscription,
} from "@/types/subscription";
import type { ApiClient } from "./core";

export function createSubscriptionsNamespace(client: ApiClient) {
  return {
    // ============================================================================
    // SUBSCRIPTION STATUS & PLANS
    // ============================================================================

    /**
     * Get current user's subscription
     */
    getCurrentPlan: async (): Promise<UserSubscription> => {
      return client.request<UserSubscription>(
        "/api/v1/subscriptions/my-subscription",
        {
          method: "GET",
        },
      );
    },

    /**
     * Get all available subscription plans
     */
    getPlans: async (): Promise<SubscriptionListResponse> => {
      return client.request<SubscriptionListResponse>(
        "/api/v1/subscriptions/plans",
        {
          method: "GET",
        },
      );
    },

    // ============================================================================
    // CHECKOUT & PAYMENT
    // ============================================================================

    /**
     * Create a checkout session for a subscription plan
     *
     * @param planId - UUID of the subscription plan
     * @param billingPeriod - Billing period (monthly, yearly, lifetime)
     * @param successUrl - URL to redirect after successful checkout
     * @param cancelUrl - URL to redirect if checkout is cancelled
     * @param discountCode - Optional discount/promo code
     * @returns Checkout session with URL and session ID
     */
    createCheckout: async (
      planId: string,
      billingPeriod: BillingPeriod,
      successUrl?: string,
      cancelUrl?: string,
      discountCode?: string,
      affiliateCode?: string,
    ): Promise<CheckoutSessionResponse> => {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";

      return client.request<CheckoutSessionResponse>(
        "/api/v1/subscriptions/checkout",
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
     *
     * @returns Portal URL where customer can manage their subscription
     */
    getCustomerPortalUrl: async (): Promise<CustomerPortalResponse> => {
      return client.request<CustomerPortalResponse>(
        "/api/v1/subscriptions/portal",
        {
          method: "GET",
        },
      );
    },

    // ============================================================================
    // SUBSCRIPTION MANAGEMENT
    // ============================================================================

    /**
     * Upgrade subscription to a new plan
     *
     * @param newPlanId - UUID of the new plan
     * @param billingPeriod - Optional billing period change
     * @returns Updated subscription details
     */
    upgradeSubscription: async (
      newPlanId: string,
      billingPeriod?: BillingPeriod,
    ): Promise<UserSubscription> => {
      const requestData: SubscriptionUpgradeRequest = {
        new_plan_id: newPlanId,
        billing_period: billingPeriod,
      };

      return client.request<UserSubscription>("/api/v1/subscriptions/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
    },

    /**
     * Downgrade subscription to a new plan
     *
     * @param newPlanId - UUID of the new plan
     * @param billingPeriod - Optional billing period change
     * @returns Updated subscription details
     */
    downgradeSubscription: async (
      newPlanId: string,
      billingPeriod?: BillingPeriod,
    ): Promise<UserSubscription> => {
      const requestData: SubscriptionUpgradeRequest = {
        new_plan_id: newPlanId,
        billing_period: billingPeriod,
      };

      return client.request<UserSubscription>(
        "/api/v1/subscriptions/downgrade",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        },
      );
    },

    /**
     * Cancel subscription
     *
     * @param reason - Optional cancellation reason
     * @param cancelImmediately - Whether to cancel immediately or at period end
     * @returns Cancellation confirmation
     */
    cancelSubscription: async (
      reason?: string,
      cancelImmediately = false,
    ): Promise<{ success: boolean; message: string }> => {
      const requestData: SubscriptionCancelRequest = {
        reason,
        cancel_immediately: cancelImmediately,
      };

      return client.request<{
        success: boolean;
        message: string;
      }>("/api/v1/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
    },

    // ============================================================================
    // INVOICES & BILLING
    // ============================================================================

    /**
     * Get invoices for the current user
     *
     * @returns List of invoices
     */
    getInvoices: async (): Promise<InvoiceListResponse> => {
      return client.request<InvoiceListResponse>(
        "/api/v1/subscriptions/invoices",
        {
          method: "GET",
        },
      );
    },

    // ============================================================================
    // HISTORY & USAGE
    // ============================================================================

    /**
     * Get subscription history
     *
     * @param limit - Number of records to fetch
     * @param offset - Pagination offset
     * @returns Subscription history
     */
    getHistory: async (
      limit = 50,
      offset = 0,
    ): Promise<SubscriptionHistoryResponse> => {
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
     *
     * @returns Current usage stats
     */
    getUsageStats: async (): Promise<UsageStats> => {
      return client.request<UsageStats>("/api/v1/subscriptions/usage", {
        method: "GET",
      });
    },

    /**
     * Get trial status
     *
     * @returns Trial status information
     */
    getTrialStatus: async (): Promise<TrialStatus> => {
      return client.request<TrialStatus>("/api/v1/subscriptions/trial-status", {
        method: "GET",
      });
    },
  };
}
