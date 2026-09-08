"use client";

/**
 * LemonSqueezy Provider
 *
 * Loads lemon.js and owns the checkout overlay lifecycle so a purchase never
 * takes the user off the site.
 *
 * Without this, the overlay's iframe navigates to /checkout/success after
 * payment and the user is left staring at a full success page rendered inside
 * a small overlay, which they then have to close by hand. Here we intercept
 * Checkout.Success, close the overlay ourselves, wait for the webhook to land,
 * and confirm in place.
 *
 * @module components/subscription/lemonsqueezy-provider
 */

import Script from "next/script";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  getPurchaseState,
  useSubscriptionSync,
} from "@/hooks/use-subscription-sync";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { analytics } from "@/lib/analytics";
import { log } from "@/lib/logger";
import {
  ensureLemonSqueezy,
  setCheckoutEventHandler,
} from "@/lib/lemonsqueezy/get-client";

export function LemonSqueezyProvider() {
  const { waitForPurchaseSettled } = useSubscriptionSync();

  useEffect(() => {
    setCheckoutEventHandler((event) => {
      if (event.event !== "Checkout.Success") return;

      // Close the overlay ourselves so the user is returned to the page they
      // started from, rather than being left on the success page LemonSqueezy
      // renders inside the iframe.
      ensureLemonSqueezy()?.Url.Close();

      // Belt and braces: our scroll lock keys off these body classes, which
      // lemon.js normally clears on close. If that ever fails the page would be
      // left permanently unscrollable — far worse than the scroll we locked.
      document.body.classList.remove(
        "lemonsqueezy-open",
        "lemonsqueezy-loading",
      );

      const toastId = toast.loading("Payment received", {
        description: "Activating your subscription…",
      });

      // Payment succeeds on LemonSqueezy's side before their webhook reaches
      // our backend, so the subscription is briefly stale. The webhook is what
      // actually grants access; this only waits for it to show up.
      //
      // Compared against the state captured when checkout opened, so neither
      // a pre-existing trial nor an unrelated change (a cancellation, say) can
      // be mistaken for a completed purchase.
      const baseline =
        useSubscriptionStore.getState().checkoutBaseline ??
        getPurchaseState(null);

      waitForPurchaseSettled(baseline)
        .then((synced) => {
          if (synced) {
            const latest =
              useSubscriptionStore.getState().subscription?.subscription;
            analytics.track("subscription_purchased", {
              plan_name: latest?.plan_display_name ?? undefined,
              billing_period: latest?.billing_period ?? undefined,
              status: latest?.status ?? undefined,
            });

            toast.success("You're all set", {
              id: toastId,
              description: "Your subscription is active.",
            });
            return;
          }

          // Never claim success we could not observe. Payment may well have
          // gone through, but the webhook has not reached us.
          toast.warning("Still confirming your payment", {
            id: toastId,
            description:
              "Your payment went through, but we haven't been able to confirm activation yet. Refresh in a moment, or contact support if it doesn't appear.",
          });
        })
        .catch((error) => {
          log.error("Failed to sync subscription after checkout", error);
          // The payment itself succeeded — never imply otherwise.
          toast.info("Payment received", {
            id: toastId,
            description:
              "We couldn't confirm activation just yet. Refresh in a moment.",
          });
        });
    });

    return () => setCheckoutEventHandler(null);
  }, [waitForPurchaseSettled]);

  return (
    <Script
      src="https://app.lemonsqueezy.com/js/lemon.js"
      strategy="afterInteractive"
      onLoad={() => ensureLemonSqueezy()}
    />
  );
}
