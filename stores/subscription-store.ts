/**
 * Subscription Store
 *
 * Zustand store for managing subscription state, checkout flow, and invoices.
 * Integrates with LemonSqueezy for payment processing and subscription management.
 *
 * @module stores/subscription-store
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import { retryTransient } from "@/lib/retry/transient-retry";
import type {
  BillingPeriod,
  CheckoutSessionResponse,
  CustomerPortalResponse,
  Invoice,
  SubscriptionPlan,
  UsageStats,
  UserSubscription,
} from "@/types/subscription";
import { InvoiceListResponseSchema } from "@/schemas/subscription-schemas";

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface SubscriptionStore {
  // ========================================
  // SUBSCRIPTION STATE
  // ========================================
  subscription: UserSubscription | null;
  usage: UsageStats | null;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;

  // ========================================
  // CHECKOUT STATE
  // ========================================
  checkoutInProgress: boolean;
  selectedPlan: SubscriptionPlan | null;
  selectedPeriod: BillingPeriod | null;
  checkoutUrl: string | null;

  // ========================================
  // INVOICES STATE
  // ========================================
  invoices: Invoice[];
  invoicesLoading: boolean;
  invoicesError: string | null;

  // ========================================
  // SUBSCRIPTION ACTIONS
  // ========================================

  /**
   * Fetch current subscription and usage stats
   */
  fetchSubscription: () => Promise<void>;

  /**
   * Fetch usage stats only
   */
  fetchUsage: () => Promise<void>;

  /**
   * Fetch available subscription plans
   */
  fetchPlans: () => Promise<void>;

  /**
   * Upgrade to a new subscription plan
   */
  upgradeSubscription: (
    planId: string,
    billingPeriod?: BillingPeriod,
  ) => Promise<void>;

  /**
   * Downgrade to a new subscription plan
   */
  downgradeSubscription: (
    planId: string,
    billingPeriod?: BillingPeriod,
  ) => Promise<void>;

  /**
   * Cancel current subscription
   */
  cancelSubscription: (
    reason?: string,
    cancelImmediately?: boolean,
  ) => Promise<void>;

  /**
   * Get customer portal URL for managing subscription
   */
  getPortalUrl: () => Promise<CustomerPortalResponse>;

  // ========================================
  // CHECKOUT ACTIONS
  // ========================================

  /**
   * Initiate checkout for a subscription plan
   */
  initiateCheckout: (
    plan: SubscriptionPlan,
    billingPeriod: BillingPeriod,
    discountCode?: string,
    affiliateCode?: string,
  ) => Promise<CheckoutSessionResponse>;

  /**
   * Reset checkout state
   */
  resetCheckout: () => void;

  /**
   * Open LemonSqueezy checkout overlay
   */
  openCheckout: (checkoutUrl: string) => void;

  // ========================================
  // INVOICES ACTIONS
  // ========================================

  /**
   * Fetch invoice history
   */
  fetchInvoices: () => Promise<void>;

  // ========================================
  // UTILITY ACTIONS
  // ========================================

  /**
   * Reset all store state
   */
  reset: () => void;

  /**
   * Clear errors
   */
  clearError: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  // Subscription state
  subscription: null,
  usage: null,
  plans: [],
  isLoading: false,
  error: null,

  // Checkout state
  checkoutInProgress: false,
  selectedPlan: null,
  selectedPeriod: null,
  checkoutUrl: null,

  // Invoices state
  invoices: [],
  invoicesLoading: false,
  invoicesError: null,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSubscriptionStore = create<SubscriptionStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================
      // SUBSCRIPTION ACTIONS
      // ========================================

      fetchSubscription: async () => {
        set({ isLoading: true, error: null });

        const [subscriptionResult, usageResult] = await Promise.allSettled([
          apiClient.subscriptions.getCurrentPlan(),
          apiClient.subscriptions.getUsageStats(),
        ]);

        if (subscriptionResult.status === "rejected") {
          const errorMessage =
            subscriptionResult.reason instanceof Error
              ? subscriptionResult.reason.message
              : "Failed to fetch subscription";

          set({ isLoading: false, error: errorMessage });
          throw subscriptionResult.reason;
        }

        set({
          subscription: subscriptionResult.value,
          usage: usageResult.status === "fulfilled" ? usageResult.value : null,
          isLoading: false,
          error:
            usageResult.status === "rejected"
              ? "Subscription loaded but usage metrics are temporarily unavailable"
              : null,
        });
      },

      fetchUsage: async () => {
        try {
          const usage = await apiClient.subscriptions.getUsageStats();
          set({ usage });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch usage stats";

          set({ error: errorMessage });
          throw error;
        }
      },

      fetchPlans: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.subscriptions.getPlans();

          set({
            plans: response.plans,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch plans";

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      upgradeSubscription: async (
        planId: string,
        billingPeriod?: BillingPeriod,
      ) => {
        set({ isLoading: true, error: null });

        try {
          const updatedSubscription = await retryTransient(
            () =>
              apiClient.subscriptions.upgradeSubscription(
                planId,
                billingPeriod,
              ),
            { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 },
          );

          set({
            subscription: updatedSubscription,
            isLoading: false,
            error: null,
          });

          // Refresh usage stats after upgrade
          await get().fetchSubscription();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to upgrade subscription";

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      downgradeSubscription: async (
        planId: string,
        billingPeriod?: BillingPeriod,
      ) => {
        set({ isLoading: true, error: null });

        try {
          const updatedSubscription = await retryTransient(
            () =>
              apiClient.subscriptions.downgradeSubscription(
                planId,
                billingPeriod,
              ),
            { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 },
          );

          set({
            subscription: updatedSubscription,
            isLoading: false,
            error: null,
          });

          // Refresh usage stats after downgrade
          await get().fetchSubscription();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to downgrade subscription";

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      cancelSubscription: async (
        reason?: string,
        cancelImmediately = false,
      ) => {
        set({ isLoading: true, error: null });

        try {
          await retryTransient(
            () =>
              apiClient.subscriptions.cancelSubscription(
                reason,
                cancelImmediately,
              ),
            { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 },
          );

          // Refresh subscription to get updated cancellation status
          await get().fetchSubscription();

          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to cancel subscription";

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      getPortalUrl: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.subscriptions.getCustomerPortalUrl();

          set({
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to get portal URL";

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      // ========================================
      // CHECKOUT ACTIONS
      // ========================================

      initiateCheckout: async (
        plan: SubscriptionPlan,
        billingPeriod: BillingPeriod,
        discountCode?: string,
        affiliateCode?: string,
      ) => {
        set({
          checkoutInProgress: true,
          selectedPlan: plan,
          selectedPeriod: billingPeriod,
          error: null,
        });

        try {
          const checkoutSession = await retryTransient(
            () =>
              apiClient.subscriptions.createCheckout(
                plan.id,
                billingPeriod,
                undefined,
                undefined,
                discountCode,
                affiliateCode,
              ),
            { maxAttempts: 2, baseDelayMs: 500, maxDelayMs: 3000 },
          );

          set({
            checkoutUrl: checkoutSession.checkout_url,
            checkoutInProgress: false,
            error: null,
          });

          return checkoutSession;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create checkout session";

          set({
            checkoutInProgress: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      resetCheckout: () => {
        set({
          checkoutInProgress: false,
          selectedPlan: null,
          selectedPeriod: null,
          checkoutUrl: null,
        });
      },

      openCheckout: (checkoutUrl: string) => {
        // Open LemonSqueezy checkout overlay
        if (typeof window !== "undefined" && window.LemonSqueezy) {
          window.LemonSqueezy.Url.Open(checkoutUrl);
        } else {
          // Fallback to opening in new window if LemonSqueezy script not loaded
          window.open(checkoutUrl, "_blank");
        }
      },

      // ========================================
      // INVOICES ACTIONS
      // ========================================

      fetchInvoices: async () => {
        set({ invoicesLoading: true, invoicesError: null });

        try {
          const response = await apiClient.subscriptions.getInvoices();
          const parsed = InvoiceListResponseSchema.parse(response);

          set({
            invoices: parsed.invoices,
            invoicesLoading: false,
            invoicesError: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch invoices";

          set({
            invoicesLoading: false,
            invoicesError: errorMessage,
          });

          throw error;
        }
      },

      // ========================================
      // UTILITY ACTIONS
      // ========================================

      reset: () => {
        set(initialState);
      },

      clearError: () => {
        set({ error: null, invoicesError: null });
      },
    }),
    {
      name: "subscription-store",
    },
  ),
);

// ============================================================================
// TYPE DECLARATIONS FOR LEMONSQUEEZY
// ============================================================================

declare global {
  interface Window {
    LemonSqueezy?: {
      /**
       * LemonSqueezy URL utilities
       */
      Url: {
        /**
         * Open checkout URL in overlay
         */
        Open: (url: string) => void;
        /**
         * Close checkout overlay
         */
        Close: () => void;
      };
      /**
       * Setup LemonSqueezy
       */
      Setup: () => void;
    };
    createLemonSqueezy?: () => void;
  }
}
