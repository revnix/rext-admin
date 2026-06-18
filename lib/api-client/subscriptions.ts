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
  CreditBalance,
  CouponValidation,
} from "@/types/subscription";
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
    getCurrentPlan: async (): Promise<UserSubscription> => {
      const response = await client.request<UserSubscription>(
        ENDPOINTS.SUBSCRIPTIONS.mySubscription,
        {
          method: "GET",
        },
      );
      return response;
    },

    /**
     * Get all available subscription plans
     */
    getPlans: async (): Promise<SubscriptionListResponse> => {
      return client.request<SubscriptionListResponse>(
        ENDPOINTS.SUBSCRIPTIONS.plans,
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
          : process.env.NEXT_PUBLIC_APP_URL;

      if (!baseUrl) {
        throw new Error(
          "Cannot determine application URL for checkout redirects. " +
            "Set NEXT_PUBLIC_APP_URL environment variable.",
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
     *
     * @returns Portal URL where customer can manage their subscription
     */
    getCustomerPortalUrl: async (): Promise<CustomerPortalResponse> => {
      return client.request<CustomerPortalResponse>(
        ENDPOINTS.SUBSCRIPTIONS.portal,
        {
          method: "POST",
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

      return client.request<UserSubscription>(ENDPOINTS.SUBSCRIPTIONS.upgrade, {
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
        ENDPOINTS.SUBSCRIPTIONS.downgrade,
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
      }>(ENDPOINTS.SUBSCRIPTIONS.cancel, {
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
        ENDPOINTS.SUBSCRIPTIONS.invoices,
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
      return client.request<SubscriptionHistoryResponse>(
        buildUrl(ENDPOINTS.SUBSCRIPTIONS.history, { limit, offset }),
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
      const result = await client.request<UsageStats>(
        ENDPOINTS.SUBSCRIPTIONS.usage,
        { method: "GET" },
      );

      return result;
    },

    /**
     * Get trial status
     *
     * @returns Trial status information
     */
    getTrialStatus: async (): Promise<TrialStatus> => {
      return client.request<TrialStatus>(ENDPOINTS.SUBSCRIPTIONS.trialStatus, {
        method: "GET",
      });
    },

    /**
     * Get current credit balance
     *
     * @returns Current credit balance and limits
     */
    getCredits: async (): Promise<CreditBalance> => {
      return client.request<CreditBalance>(ENDPOINTS.SUBSCRIPTIONS.credits, {
        method: "GET",
      });
    },

    /**
     * Validate a coupon code
     *
     * @param code - Coupon code to validate
     * @returns Validation result
     */
    validateCoupon: async (code: string): Promise<CouponValidation> => {
      return client.request<CouponValidation>(
        ENDPOINTS.SUBSCRIPTIONS.coupons.validate(code),
        {
          method: "GET",
        },
      );
    },

    /**
     * Redeem a coupon code
     *
     * @param code - Coupon code to redeem
     * @returns Updated subscription
     */
    redeemCoupon: async (code: string): Promise<UserSubscription> => {
      return client.request<UserSubscription>(
        ENDPOINTS.SUBSCRIPTIONS.coupons.redeem,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        },
      );
    },
  };
}
