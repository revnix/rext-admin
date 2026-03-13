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
      // API schema missing UserSubscriptionResponse, falling back to local rigid type
      return client.request<UserSubscription>(
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
      // API schema missing SubscriptionListResponse, falling back to local rigid type
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
      const result = await client.request<unknown>(
        ENDPOINTS.SUBSCRIPTIONS.usage,
        {
          method: "GET",
        },
      );

      // Normalize the response to the UsageStats interface
      if (result && typeof result === "object") {
        const resObj = result as Record<string, unknown>;

        // Handle the new nested structure (e.g., workspaces: {used, limit, percentage})
        // or the older structure (e.g., workspaces: {current, max})
        const flattened: Record<string, unknown> = {};

        // Extract plan info from meta if available
        if (resObj.meta && typeof resObj.meta === "object") {
          const meta = resObj.meta as Record<string, unknown>;
          flattened.plan_name = meta.plan_name || "Unknown";
          flattened.billing_period = meta.billing_period || "Monthly";
          flattened.subscription_id = meta.subscription_id || "";
        }

        for (const [key, value] of Object.entries(resObj)) {
          // Skip the meta object as we handle it separately
          if (key === "meta") continue;

          if (value && typeof value === "object") {
            const val = value as {
              current?: number;
              used?: number;
              max?: number;
              limit?: number;
              percentage?: number;
              reset_date?: string | null;
            };

            const current = val.used ?? val.current ?? 0;
            const max = val.limit ?? val.max ?? 0;

            flattened[`current_${key}`] = current;

            // Handle specific field name differences for backward compatibility
            const maxKey =
              key === "api_calls" ? "max_api_calls_per_month" : `max_${key}`;
            flattened[maxKey] = max;

            // Use percentage from API if available, otherwise calculate
            const percentKey = `${key}_usage_percent`;
            flattened[percentKey] =
              val.percentage ?? (max > 0 ? (current / max) * 100 : 0);

            // Special handling for api_calls reset date
            if (key === "api_calls" && val.reset_date) {
              flattened.usage_reset_date = val.reset_date;
            }
          }
        }

        // If usage_reset_date is still missing, provide a fallback or find it if it was at top level
        if (!flattened.usage_reset_date && resObj.usage_reset_date) {
          flattened.usage_reset_date = resObj.usage_reset_date;
        }

        return flattened as unknown as UsageStats;
      }

      return result as UsageStats;
    },

    /**
     * Get trial status
     *
     * @returns Trial status information
     */
    getTrialStatus: async (): Promise<TrialStatus> => {
      // API schema missing TrialStatusResponse, falling back to local rigid type
      return client.request<TrialStatus>(ENDPOINTS.SUBSCRIPTIONS.trialStatus, {
        method: "GET",
      });
    },
  };
}
