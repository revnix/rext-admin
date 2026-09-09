"use client";

/**
 * Billing Actions Hook
 *
 * The billing operations that used to send users to LemonSqueezy's customer
 * portal, done in place instead.
 *
 * Updating a card still uses LemonSqueezy's own form — card fields have to
 * live in their origin for PCI reasons — but that form is frameable, so it
 * opens in the same on-site overlay as checkout rather than a new tab.
 *
 * Not covered here because the app already handles them natively: plan
 * changes, cancellation and invoices. The only thing still needing the portal
 * proper is tax IDs and billing addresses, which LemonSqueezy serves from a
 * page that refuses framing.
 *
 * @module hooks/use-billing-actions
 */

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { useSubscriptionStore } from "@/stores/subscription-store";

export function useBillingActions() {
  const [isLoading, setIsLoading] = useState(false);
  const openPaymentMethodDialog = useSubscriptionStore(
    (state) => state.openPaymentMethodDialog,
  );
  const fetchSubscription = useSubscriptionStore(
    (state) => state.fetchSubscription,
  );
  const subscription = useSubscriptionStore((state) => state.subscription);

  /**
   * Whether there is a LemonSqueezy subscription behind this account.
   *
   * Trials are created locally and never reach LemonSqueezy, so a trial user
   * has no customer, no card and nothing to manage. Every billing action here
   * needs this, and callers should use it to hide the controls rather than
   * letting the user click into a guaranteed error.
   */
  const hasBillingAccount = Boolean(
    subscription?.subscription?.lemonsqueezy_subscription_id,
  );

  /**
   * Open LemonSqueezy's payment-method form in our dedicated Dialog.
   */
  const updatePaymentMethod = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetched per click, not cached: these signed URLs expire after ~24h.
      const urls = await apiClient.subscriptions.getBillingUrls();

      if (!urls.update_payment_method) {
        throw new Error(
          "Payment method updates aren't available for this subscription yet.",
        );
      }

      openPaymentMethodDialog(urls.update_payment_method);
    } catch (error) {
      log.error("Failed to open payment method form", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to open payment settings",
      );
    } finally {
      setIsLoading(false);
    }
  }, [openPaymentMethodDialog]);

  /**
   * Open the LemonSqueezy portal for tax ID and billing address only.
   *
   * This is the one flow that genuinely cannot stay on our site: the portal
   * page sets headers that refuse framing.
   */
  const openTaxDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const urls = await apiClient.subscriptions.getBillingUrls();

      if (!urls.customer_portal) {
        throw new Error("Billing details aren't available for this account.");
      }

      window.open(urls.customer_portal, "_blank", "noopener,noreferrer");
    } catch (error) {
      log.error("Failed to open billing details", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to open billing details",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runSubscriptionAction = useCallback(
    async (
      action: () => Promise<unknown>,
      successMessage: string,
      failureMessage: string,
    ) => {
      setIsLoading(true);
      try {
        await action();
        // The webhook is what actually updates our record; this refresh just
        // pulls in whatever has landed by now.
        await fetchSubscription();
        toast.success(successMessage);
      } catch (error) {
        log.error(failureMessage, error);
        toast.error(error instanceof Error ? error.message : failureMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSubscription],
  );

  /** Pause billing and access. */
  const pauseSubscription = useCallback(
    () =>
      runSubscriptionAction(
        apiClient.subscriptions.pauseSubscription,
        "Subscription paused",
        "Failed to pause subscription",
      ),
    [runSubscriptionAction],
  );

  /** Resume a paused subscription. */
  const resumeSubscription = useCallback(
    () =>
      runSubscriptionAction(
        apiClient.subscriptions.resumeSubscription,
        "Subscription resumed",
        "Failed to resume subscription",
      ),
    [runSubscriptionAction],
  );

  return {
    isLoading,
    hasBillingAccount,
    updatePaymentMethod,
    openTaxDetails,
    pauseSubscription,
    resumeSubscription,
  };
}
