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
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "@/components/subscription/checkout-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentMethodDialog } from "@/components/subscription/payment-method-dialog";
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
import type { Route } from "next";

export function LemonSqueezyProvider() {
  const router = useRouter();
  const { waitForPurchaseSettled } = useSubscriptionSync();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<
    "confirming" | "active" | "unconfirmed"
  >("confirming");
  const purchaseSyncRef = useRef<AbortController | null>(null);

  const cancelPurchaseDialog = () => {
    purchaseSyncRef.current?.abort();
    purchaseSyncRef.current = null;
    setPurchaseDialogOpen(false);
  };

  const goToDashboard = () => {
    cancelPurchaseDialog();
    router.push("/" as Route);
  };

  useEffect(() => {
    setCheckoutEventHandler((event) => {
      if (event.event !== "Checkout.Success") return;

      // Close our custom checkout dialog when checkout succeeds
      useSubscriptionStore.getState().closeCheckoutDialog();

      // Close the overlay if lemon.js opened one
      ensureLemonSqueezy()?.Url.Close();

      // Belt and braces: our scroll lock keys off these body classes, which
      // lemon.js normally clears on close. If that ever fails the page would be
      // left permanently unscrollable — far worse than the scroll we locked.
      document.body.classList.remove(
        "lemonsqueezy-open",
        "lemonsqueezy-loading",
      );

      const controller = new AbortController();
      purchaseSyncRef.current = controller;
      setPurchaseStatus("confirming");
      setPurchaseDialogOpen(true);

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

      waitForPurchaseSettled(baseline, controller.signal)
        .then((synced) => {
          if (controller.signal.aborted) return;
          if (synced) {
            const latest =
              useSubscriptionStore.getState().subscription?.subscription;
            analytics.track("subscription_purchased", {
              plan_name: latest?.plan_display_name ?? undefined,
              billing_period: latest?.billing_period ?? undefined,
              status: latest?.status ?? undefined,
            });

            setPurchaseStatus("active");
            return;
          }

          // Never claim success we could not observe. Payment may well have
          // gone through, but the webhook has not reached us.
          setPurchaseStatus("unconfirmed");
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          log.error("Failed to sync subscription after checkout", error);
          // The payment itself succeeded — never imply otherwise.
          setPurchaseStatus("unconfirmed");
        })
        .finally(() => {
          if (purchaseSyncRef.current === controller) {
            purchaseSyncRef.current = null;
          }
        });
    });

    return () => {
      setCheckoutEventHandler(null);
      purchaseSyncRef.current?.abort();
    };
  }, [waitForPurchaseSettled]);

  return (
    <>
      <Script
        src="https://app.lemonsqueezy.com/js/lemon.js"
        strategy="afterInteractive"
        onLoad={() => ensureLemonSqueezy()}
      />
      <CheckoutDialog />
      <PaymentMethodDialog />
      <Dialog
        open={purchaseDialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelPurchaseDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {purchaseStatus === "confirming" ? (
                <Loader2 className="h-5 w-5 animate-spin text-foreground" />
              ) : purchaseStatus === "active" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : null}
              {purchaseStatus === "confirming"
                ? "Confirming your subscription"
                : purchaseStatus === "active"
                  ? "Subscription active"
                  : "Payment received"}
            </DialogTitle>
            <DialogDescription>
              {purchaseStatus === "confirming"
                ? "Your payment was received. We're waiting for the subscription to activate."
                : purchaseStatus === "active"
                  ? "Your subscription is active and ready to use."
                  : "Your payment was received, but activation could not be confirmed yet. Check your billing page in a moment."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelPurchaseDialog}>
              Cancel
            </Button>
            <Button onClick={goToDashboard}>Go to Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
