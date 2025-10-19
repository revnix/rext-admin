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
  /** Optional discount code to apply */
  discountCode?: string;
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
  discountCode,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { initiateCheckout, openCheckout } = useSubscriptionStore();

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      onCheckoutStart?.();

      // Create checkout session with optional discount code
      const checkoutSession = await initiateCheckout(
        plan,
        billingPeriod,
        discountCode,
      );

      // Open LemonSqueezy checkout overlay
      openCheckout(checkoutSession.checkout_url);

      onCheckoutSuccess?.(checkoutSession.checkout_url);

      toast.success("Opening checkout...", {
        description: `Subscribing to ${plan.display_name} (${billingPeriod})${discountCode ? ` with code ${discountCode}` : ""}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initiate checkout";

      toast.error("Checkout failed", {
        description: errorMessage,
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

/**
 * Simple checkout link that uses LemonSqueezy's automatic button detection
 *
 * This component creates a link with the `lemonsqueezy-button` class
 * which is automatically detected by LemonSqueezy's Lemon.js script.
 */
export interface CheckoutLinkProps {
  /** The checkout URL from LemonSqueezy */
  checkoutUrl: string;
  /** Link text */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function CheckoutLink({
  checkoutUrl,
  children = "Subscribe Now",
  className,
}: CheckoutLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Open LemonSqueezy checkout overlay
    if (typeof window !== "undefined" && window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      // Fallback to opening in new window if script not loaded
      window.open(checkoutUrl, "_blank");
    }
  };

  return (
    <a
      href={checkoutUrl}
      className={cn("lemonsqueezy-button", className)}
      onClick={handleClick}
      data-checkout-url={checkoutUrl}
    >
      {children}
    </a>
  );
}
