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
  PlanChangeResponse,
  SubscriptionPlan,
  UsageStats,
  UserSubscription,
  CreditBalance,
} from "@/types/subscription";
import {
  InvoiceListResponseSchema,
  InvoiceSchema,
  SubscriptionListResponseSchema,
} from "@/schemas/subscription-schemas";
import { getLemonSqueezyClient } from "@/lib/lemonsqueezy/get-client";
import { log } from "@/lib/logger";

let inFlightSubscriptionFetch: Promise<void> | null = null;

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface SubscriptionStore {
  subscription: UserSubscription | null;
  usage: UsageStats | null;
  credits: CreditBalance | null;
  subscriptionFetchedAt: number | null;

  // ========================================
  // SUBSCRIPTION STATE
  // ========================================
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
  fetchSubscription: (options?: { force?: boolean }) => Promise<void>;

  /**
   * Fetch usage stats only
   */
  fetchUsage: () => Promise<void>;

  /**
   * Fetch credit balance
   */
  fetchCredits: () => Promise<void>;

  /**
   * Patch current_credits in place (from live SSE update — no round-trip)
   */
  patchCredits: (currentCredits: number) => void;

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
  ) => Promise<PlanChangeResponse>;

  /**
   * Downgrade to a new subscription plan
   */
  downgradeSubscription: (
    planId: string,
    billingPeriod?: BillingPeriod,
  ) => Promise<PlanChangeResponse>;

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
  subscription: null,
  usage: null,
  credits: null,
  subscriptionFetchedAt: null,

  // Subscription state
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
        inFlightSubscriptionFetch = (async () => {
          set({ isLoading: true, error: null });

          try {
            // Use allSettled so that if usage stats fail (500), we still get the subscription
            const [subscriptionResult, usageResult, creditsResult] =
              await Promise.allSettled([
                apiClient.subscriptions.getCurrentPlan(),
                apiClient.subscriptions.getUsageStats(),
                apiClient.subscriptions.getCredits(),
              ]);

            const nextSubscription =
              subscriptionResult.status === "fulfilled"
                ? subscriptionResult.value
                : null;
            const nextUsage =
              usageResult.status === "fulfilled" ? usageResult.value : null;
            const nextCredits =
              creditsResult.status === "fulfilled" ? creditsResult.value : null;

            if (subscriptionResult.status === "rejected") {
              log.error(
                "Subscription fetch failed:",
                subscriptionResult.reason,
              );
            }
            if (usageResult.status === "rejected") {
              log.warn(
                "Usage stats fetch failed (expected if API is 500):",
                usageResult.reason,
              );
            }

            set({
              subscription: nextSubscription,
              usage: nextUsage,
              credits: nextCredits,
              subscriptionFetchedAt: Date.now(),
              isLoading: false,
              error:
                subscriptionResult.status === "rejected"
                  ? String(subscriptionResult.reason)
                  : null,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to fetch subscription";

            set({ isLoading: false, error: errorMessage });
            throw error;
          } finally {
            inFlightSubscriptionFetch = null;
          }
        })();

        return inFlightSubscriptionFetch;
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

      fetchCredits: async () => {
        try {
          const credits = await apiClient.subscriptions.getCredits();
          set({ credits });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch credit balance";

          set({ error: errorMessage });
          throw error;
        }
      },

      patchCredits: (currentCredits: number) => {
        const prev = useSubscriptionStore.getState().credits;
        if (!prev) return;
        const articlesRemaining =
          prev.credits_per_month !== null
            ? Math.floor(currentCredits / 15)
            : null;
        set({
          credits: {
            ...prev,
            current_credits: currentCredits,
            articles_remaining: articlesRemaining,
          },
        });
      },

      fetchPlans: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.subscriptions.getPlans();
          const parsed = SubscriptionListResponseSchema.parse(response);

          set({
            plans: parsed.plans,
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
          const result = await retryTransient(
            () =>
              apiClient.subscriptions.upgradeSubscription(
                planId,
                billingPeriod,
              ),
            { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 },
          );

          set({ isLoading: false, error: null });
          return result;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to upgrade subscription";

          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      downgradeSubscription: async (
        planId: string,
        billingPeriod?: BillingPeriod,
      ) => {
        set({ isLoading: true, error: null });

        try {
          const result = await retryTransient(
            () =>
              apiClient.subscriptions.downgradeSubscription(
                planId,
                billingPeriod,
              ),
            { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000 },
          );

          set({ isLoading: false, error: null });
          return result;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to downgrade subscription";

          set({ isLoading: false, error: errorMessage });
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
          await get().fetchSubscription({ force: true });

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
                undefined,
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
        if (typeof window === "undefined") return;

        // lemon.js only wires up its overlay on DOMContentLoaded. Loaded via
        // <Script strategy="afterInteractive">, that event has usually already
        // fired by the time the script lands, and a client-side navigation
        // never fires it again — so window.LemonSqueezy exists but the overlay
        // opens as a dead frame until a full page reload. This re-init is
        // idempotent and is the documented SPA entry point.
        window.createLemonSqueezy?.();

        const client = getLemonSqueezyClient();
        if (client) {
          // LemonSqueezy only serves a frameable checkout when the URL carries
          // embed=1. The API returns the plain hosted URL, which refuses to be
          // framed — the overlay then renders as the browser's "This content is
          // blocked" page instead of the checkout.
          const overlayUrl = new URL(checkoutUrl);
          overlayUrl.searchParams.set("embed", "1");
          client.Url.Open(overlayUrl.toString());
          return;
        }

        window.open(checkoutUrl, "_blank");
      },

      // ========================================
      // INVOICES ACTIONS
      // ========================================

      fetchInvoices: async () => {
        set({ invoicesLoading: true, invoicesError: null });

        try {
          const response = await apiClient.subscriptions.getInvoices();

          let invoicesData = response;
          // In case the API response returned { invoices: [...] } or array or wrapped data
          if (
            response &&
            typeof response === "object" &&
            !("invoices" in response) &&
            "data" in response
          ) {
            invoicesData = (response as { data: unknown })
              .data as typeof response;
          }

          const parsed = InvoiceListResponseSchema.safeParse(invoicesData);

          let invoicesList: Invoice[] = [];

          if (parsed.success) {
            invoicesList = parsed.data.invoices as Invoice[];
          } else if (
            invoicesData &&
            typeof invoicesData === "object" &&
            "invoices" in invoicesData &&
            Array.isArray((invoicesData as { invoices: unknown[] }).invoices)
          ) {
            const rawList = (invoicesData as { invoices: unknown[] }).invoices;
            invoicesList = rawList
              .map((item) => {
                const itemParse = InvoiceSchema.safeParse(item);
                return itemParse.success ? (itemParse.data as Invoice) : null;
              })
              .filter((item): item is Invoice => item !== null);
          } else if (Array.isArray(invoicesData)) {
            invoicesList = invoicesData
              .map((item) => {
                const itemParse = InvoiceSchema.safeParse(item);
                return itemParse.success ? (itemParse.data as Invoice) : null;
              })
              .filter((item): item is Invoice => item !== null);
          }

          set({
            invoices: invoicesList,
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
