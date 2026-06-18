"use client";

import { cn } from "@/lib/utils";
import type { BillingPeriod, SubscriptionPlan } from "@/types/subscription";
import { CheckoutButton } from "./checkout-button";

export interface CheckoutWithDiscountProps {
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
  buttonText?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onCheckoutStart?: () => void;
  onCheckoutError?: (error: Error) => void;
  onCheckoutSuccess?: (checkoutUrl: string) => void;
  disabled?: boolean;
}

export function CheckoutWithDiscount({
  plan,
  billingPeriod,
  buttonText = "Subscribe Now",
  variant = "default",
  size = "default",
  className,
  onCheckoutStart,
  onCheckoutError,
  onCheckoutSuccess,
  disabled = false,
}: CheckoutWithDiscountProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <CheckoutButton
        plan={plan}
        billingPeriod={billingPeriod}
        variant={variant}
        size={size}
        disabled={disabled}
        onCheckoutStart={onCheckoutStart}
        onCheckoutError={onCheckoutError}
        onCheckoutSuccess={onCheckoutSuccess}
        className="w-full"
      >
        {buttonText}
      </CheckoutButton>
    </div>
  );
}
