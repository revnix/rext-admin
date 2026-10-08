"use client";

/**
 * Checkout Dialog Component
 *
 * Renders Lemon Squeezy's checkout form inside our own custom Dialog shell,
 * matching the styling and structure of our Receipt & Payment Method dialogs.
 *
 * @module components/subscription/checkout-dialog
 */

import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
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
import { useSubscriptionStore } from "@/stores/subscription-store";

export function CheckoutDialog() {
  const checkoutDialogOpen = useSubscriptionStore(
    (state) => state.checkoutDialogOpen,
  );
  const checkoutUrl = useSubscriptionStore((state) => state.checkoutUrl);
  const selectedPlan = useSubscriptionStore((state) => state.selectedPlan);
  const selectedPeriod = useSubscriptionStore((state) => state.selectedPeriod);
  const closeCheckoutDialog = useSubscriptionStore(
    (state) => state.closeCheckoutDialog,
  );

  const planTitle =
    selectedPlan?.display_name || selectedPlan?.name || "Subscription Plan";

  const periodLabel = selectedPeriod
    ? selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)
    : null;

  const iframeUrl = useMemo(() => {
    if (!checkoutUrl) return null;
    try {
      const url = new URL(checkoutUrl);
      url.searchParams.set("embed", "1");
      return url.toString();
    } catch {
      return checkoutUrl;
    }
  }, [checkoutUrl]);

  return (
    <Dialog
      open={checkoutDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeCheckoutDialog();
        }
      }}
    >
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-foreground" />
                {selectedPlan ? `Subscribe to ${planTitle}` : "Checkout"}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-muted-foreground flex items-center gap-2">
                {periodLabel ? (
                  <span>
                    Billing:{" "}
                    <span className="font-semibold text-foreground">
                      {periodLabel}
                    </span>
                  </span>
                ) : null}
                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <ShieldCheck className="h-3.5 w-3.5 text-success-600" />
                  Secured by Lemon Squeezy
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative w-full h-[520px] min-h-[520px] rounded-md overflow-hidden bg-muted/20 border">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              title="Checkout"
              className="w-full h-full border-0"
              allow="payment"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Unable to load checkout form.
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between items-center">
          {checkoutUrl && (
            <Button
              data-rec="show"
              variant="ghost"
              size="sm"
              asChild
              className="w-full sm:w-auto"
            >
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open on Lemon Squeezy
              </a>
            </Button>
          )}
          <Button
            data-rec="show"
            variant="outline"
            size="sm"
            onClick={closeCheckoutDialog}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
