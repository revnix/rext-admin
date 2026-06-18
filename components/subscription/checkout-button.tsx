"use client";

/**
 * Checkout Button Component
 *
 * A button component that initiates LemonSqueezy checkout for a subscription plan.
 * Opens the checkout overlay when clicked.
 *
 * @module components/subscription/checkout-button
 */

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { BillingPeriod, SubscriptionPlan } from "@/types/subscription";

export interface CheckoutButtonProps {
  /** The subscription plan to checkout */
  plan: SubscriptionPlan;
  /** The billing period (monthly or yearly) */
  billingPeriod: BillingPeriod;
  /** Button text */
  children?: React.ReactNode;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional CSS classes */
  className?: string;
  /** Callback when checkout is initiated */
  onCheckoutStart?: () => void;
  /** Callback when checkout fails */
  onCheckoutError?: (error: Error) => void;
  /** Callback when checkout succeeds */
  onCheckoutSuccess?: (checkoutUrl: string) => void;
  /** Whether to disable the button */
  disabled?: boolean;
}

/**
 * Checkout button that opens LemonSqueezy overlay
 */
export function CheckoutButton({
  plan,
  billingPeriod,
  children = "Subscribe Now",
  variant = "default",
  size = "default",
  className,
  onCheckoutStart,
  onCheckoutError,
  onCheckoutSuccess,
  disabled = false,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { initiateCheckout, openCheckout } = useSubscriptionStore();

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      onCheckoutStart?.();

      const checkoutSession = await initiateCheckout(plan, billingPeriod);

      openCheckout(checkoutSession.checkout_url);

      onCheckoutSuccess?.(checkoutSession.checkout_url);

      toast.success("Opening checkout...", {
        description: `Subscribing to ${plan.display_name} (${billingPeriod})`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initiate checkout";

      toast.error("Checkout failed", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => {
            void handleCheckout();
          },
        },
      });

      onCheckoutError?.(
        error instanceof Error ? error : new Error(errorMessage),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={cn("relative", className)}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
