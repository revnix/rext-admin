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
  SubscriptionPlan,
} from "@/types/subscription";

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface SubscriptionStore {
  // ========================================
  // CHECKOUT STATE
  // ========================================
  checkoutInProgress: boolean;
  selectedPlan: SubscriptionPlan | null;
  selectedPeriod: BillingPeriod | null;
  checkoutUrl: string | null;
  error: string | null;

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
  // Checkout state
  checkoutInProgress: false,
  selectedPlan: null,
  selectedPeriod: null,
  checkoutUrl: null,
  error: null,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSubscriptionStore = create<SubscriptionStore>()(
  devtools(
    (set, _get) => ({
      ...initialState,

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
      // UTILITY ACTIONS
      // ========================================

      reset: () => {
        set(initialState);
      },

      clearError: () => {
        set({ error: null });
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
