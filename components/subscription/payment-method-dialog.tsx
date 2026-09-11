"use client";

/**
 * Payment Method Dialog
 *
 * Renders Lemon Squeezy's frameable payment-method form inside our own Dialog
 * shell, matching the styling and structure of our Receipt Dialog.
 *
 * Card fields remain hosted by Lemon Squeezy inside the iframe for PCI SAQ-A
 * compliance, while the header, metadata, and actions are rendered natively.
 *
 * @module components/subscription/payment-method-dialog
 */

import { CreditCard, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBillingActions } from "@/hooks/use-billing-actions";
import { useSubscriptionStore } from "@/stores/subscription-store";

export function PaymentMethodDialog() {
  const paymentMethodDialogOpen = useSubscriptionStore(
    (state) => state.paymentMethodDialogOpen,
  );
  const paymentMethodUrl = useSubscriptionStore(
    (state) => state.paymentMethodUrl,
  );
  const closePaymentMethodDialog = useSubscriptionStore(
    (state) => state.closePaymentMethodDialog,
  );
  const subscription = useSubscriptionStore((state) => state.subscription);

  const planName =
    subscription?.subscription?.plan_display_name ||
    subscription?.subscription?.plan_name ||
    "Current Plan";

  const { cardBrandLabel, cardLastFour } = useBillingActions();

  const currentPaymentMethod = useMemo(() => {
    if (cardBrandLabel && cardLastFour) {
      return `${cardBrandLabel} •••• ${cardLastFour}`;
    }
    if (cardLastFour) {
      return `•••• ${cardLastFour}`;
    }
    return "No card on file";
  }, [cardBrandLabel, cardLastFour]);

  const iframeUrl = useMemo(() => {
    if (!paymentMethodUrl) return null;
    try {
      const url = new URL(paymentMethodUrl);
      url.searchParams.set("embed", "1");
      return url.toString();
    } catch {
      return paymentMethodUrl;
    }
  }, [paymentMethodUrl]);

  return (
    <Dialog
      open={paymentMethodDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closePaymentMethodDialog();
        }
      }}
    >
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Update Payment Method
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                Plan:{" "}
                <span className="font-semibold text-foreground">
                  {planName}
                </span>{" "}
                · Current Card:{" "}
                <span className="font-semibold text-foreground">
                  {currentPaymentMethod}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative w-full h-[460px] min-h-[460px] rounded-md overflow-hidden bg-muted/20 border">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              title="Update Payment Method"
              className="w-full h-full border-0"
              allow="payment"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Unable to load payment method form.
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between items-center">
          {paymentMethodUrl && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-full sm:w-auto"
            >
              <a
                href={paymentMethodUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open on Lemon Squeezy
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={closePaymentMethodDialog}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
