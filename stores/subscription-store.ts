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
import { ensureLemonSqueezy } from "@/lib/lemonsqueezy/get-client";
import {
  getPurchaseState,
  type PurchaseState,
} from "@/hooks/use-subscription-sync";
import { log } from "@/lib/logger";
import { useWorkspaceContextStore } from "@/stores/workspace/use-workspace-context-store";

/**
 * Single-flight promise for fetchSubscription — concurrent callers share one
 * network burst instead of each firing the 3-endpoint fan-out.
 */
let inFlightSubscriptionFetch: Promise<void> | null = null;

/**
 * Single-flight promise for fetchUsage — concurrent callers share one request.
 */
let inFlightUsageFetch: Promise<void> | null = null;

/**
 * In-flight + freshness tracking for fetchCredits, keyed by credits scope
 * (workspace UUID, "" for account-level credits).
 */
const inFlightCreditsFetches = new Map<string, Promise<void>>();
const creditsFetchedAt = new Map<string, number>();

/**
 * How long a successful subscription/credits fetch stays fresh. Callers that
 * need newer data must pass { force: true } (e.g. checkout settlement).
 */
const SUBSCRIPTION_FETCH_TTL_MS = 60 * 1000;
const CREDITS_FETCH_TTL_MS = 30 * 1000;

/**
 * Resolve the credits scope for the current page.
 *
 * Mirrors the WorkspaceProvider mount boundary (app/w/[workspaceSlug]/layout.tsx):
 * - workspace UUID on /w/<slug>/ pages (owner's credits) once the workspace resolves
 * - null while the workspace id is still resolving — caller should skip the fetch
 * - undefined on account-level pages (signed-in user's own credits)
 */
function resolveCreditsWorkspaceId(): string | null | undefined {
  if (typeof window === "undefined") return undefined;
  const segments = window.location.pathname.split("/").filter(Boolean);
  const isWorkspacePage =
    segments[0] === "w" && segments.length > 1 && segments[1] !== "create";
  if (!isWorkspacePage) return undefined;
  const id = useWorkspaceContextStore.getState().currentWorkspace?.id;
  return id || null;
}

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
  checkoutDialogOpen: boolean;
  /** Purchase state captured when checkout opened, so the post-payment
   *  poll can tell a completed purchase from the pre-existing state. */
  checkoutBaseline: PurchaseState | null;

  // ========================================
  // PAYMENT METHOD DIALOG STATE
  // ========================================
  paymentMethodDialogOpen: boolean;
  paymentMethodUrl: string | null;

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
   *
   * @param options.force - Bypass the freshness TTL (post-mutation/checkout)
   * @param options.planOnly - Fetch only the current plan; leaves usage/credits
   *   untouched. For settlement polling that only needs the plan status.
   */
  fetchSubscription: (options?: {
    force?: boolean;
    planOnly?: boolean;
  }) => Promise<void>;

  /**
   * Fetch usage stats only
   */
  fetchUsage: () => Promise<void>;

  /**
   * Fetch credit balance (optionally for an active workspace's owner)
   */
  fetchCredits: (workspaceId?: string) => Promise<void>;

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
   * Open LemonSqueezy checkout dialog
   */
  openCheckout: (checkoutUrl: string) => void;

  /**
   * Close dedicated purchase checkout dialog
   */
  closeCheckoutDialog: () => void;

  /**
   * Open dedicated payment method dialog
   */
  openPaymentMethodDialog: (url: string) => void;

  /**
   * Close dedicated payment method dialog and refresh subscription details
   */
  closePaymentMethodDialog: () => void;

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
  checkoutBaseline: null,
  checkoutDialogOpen: false,

  // Payment method dialog state
  paymentMethodDialogOpen: false,
  paymentMethodUrl: null,

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

      fetchSubscription: async (options) => {
        // Deduplicate concurrent callers: they all await the same burst.
        if (inFlightSubscriptionFetch) {
          return inFlightSubscriptionFetch;
        }

        // Skip when the last successful fetch is still fresh (unless forced)
        // so mount-effects across the page tree don't re-fire the burst.
        const fetchedAt = get().subscriptionFetchedAt;
        if (
          !options?.force &&
          fetchedAt !== null &&
          Date.now() - fetchedAt < SUBSCRIPTION_FETCH_TTL_MS
        ) {
          return Promise.resolve();
        }

        // Plan-only mode: used by checkout settlement polling, which only
        // needs the subscription status each tick — fetching usage/credits
        // per 1.5s tick tripled the polling traffic (finding #24).
        if (options?.planOnly) {
          inFlightSubscriptionFetch = (async () => {
            set({ isLoading: true, error: null });
            try {
              const nextSubscription =
                await apiClient.subscriptions.getCurrentPlan();
              set({
                subscription: nextSubscription,
                subscriptionFetchedAt: Date.now(),
                isLoading: false,
                error: null,
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
        }

        inFlightSubscriptionFetch = (async () => {
          set({ isLoading: true, error: null });

          try {
            // Workspace page with an unresolved id yet — skipping keeps the
            // scope-correct credits already shown instead of clobbering them
            // with personal credits.
            const creditsWorkspaceId = resolveCreditsWorkspaceId();

            // Use allSettled so that if usage stats fail (500), we still get the subscription
            const [subscriptionResult, usageResult, creditsResult] =
              await Promise.allSettled([
                apiClient.subscriptions.getCurrentPlan(),
                apiClient.subscriptions.getUsageStats(),
                creditsWorkspaceId === null
                  ? Promise.resolve(null)
                  : apiClient.subscriptions.getCredits(creditsWorkspaceId),
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
              // null = skipped or failed — keep the credits already displayed
              ...(nextCredits ? { credits: nextCredits } : {}),
              // Only stamp freshness on a successful plan fetch so failed
              // fetches are not TTL-cached and callers can retry promptly.
              ...(subscriptionResult.status === "fulfilled"
                ? { subscriptionFetchedAt: Date.now() }
                : {}),
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
        // Deduplicate concurrent callers — they share one request.
        if (inFlightUsageFetch) {
          return inFlightUsageFetch;
        }

        // If a full subscription fetch is already in flight, await it since it includes usage stats
        if (inFlightSubscriptionFetch) {
          await inFlightSubscriptionFetch;
          return;
        }

        inFlightUsageFetch = (async () => {
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
          } finally {
            inFlightUsageFetch = null;
          }
        })();

        return inFlightUsageFetch;
      },

      fetchCredits: async (workspaceId?: string) => {
        // Deduplicate concurrent callers and throttle repeat fetches per
        // credits scope (workspace UUID, or "" for account-level credits).
        // Live updates arrive via patchCredits (SSE), so a short TTL is safe.
        const scopeKey = workspaceId ?? "";
        const inFlight = inFlightCreditsFetches.get(scopeKey);
        if (inFlight) {
          return inFlight;
        }
        const fetchedAt = creditsFetchedAt.get(scopeKey);
        if (
          fetchedAt !== undefined &&
          Date.now() - fetchedAt < CREDITS_FETCH_TTL_MS
        ) {
          return Promise.resolve();
        }

        const request = (async () => {
          try {
            const credits =
              await apiClient.subscriptions.getCredits(workspaceId);
            set({ credits });
            creditsFetchedAt.set(scopeKey, Date.now());
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to fetch credit balance";

            set({ error: errorMessage });
            throw error;
          } finally {
            inFlightCreditsFetches.delete(scopeKey);
          }
        })();

        inFlightCreditsFetches.set(scopeKey, request);
        return request;
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

        // Ensure lemon.js script state setup
        ensureLemonSqueezy();

        // Snapshot current subscription so post-payment sync can verify purchase
        set({
          checkoutBaseline: getPurchaseState(get().subscription),
          checkoutDialogOpen: true,
          checkoutUrl: checkoutUrl,
        });
      },

      closeCheckoutDialog: () => {
        set({
          checkoutDialogOpen: false,
          checkoutUrl: null,
        });
      },

      openPaymentMethodDialog: (url: string) => {
        set({
          paymentMethodDialogOpen: true,
          paymentMethodUrl: url,
        });
      },

      closePaymentMethodDialog: () => {
        set({
          paymentMethodDialogOpen: false,
          paymentMethodUrl: null,
        });

        // Immediately refetch subscription details to update UI if card changed
        get()
          .fetchSubscription({ force: true })
          .catch((err) => {
            log.error("Failed to refresh subscription on dialog close", err);
          });
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
       * Setup LemonSqueezy. Pass an eventHandler to receive checkout
       * lifecycle events such as Checkout.Success.
       */
      Setup: (options?: {
        eventHandler?: (event: { event: string; data?: unknown }) => void;
      }) => void;
    };
    createLemonSqueezy?: () => void;
  }
}
