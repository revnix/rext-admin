"use client";

/**
 * Checkout with Discount Component
 *
 * An enhanced checkout button that includes a discount code input field.
 * Allows users to apply promo codes before initiating checkout.
 *
 * @module components/subscription/checkout-with-discount
 */

import { Tag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BillingPeriod, SubscriptionPlan } from "@/types/subscription";
import { CheckoutButton } from "./checkout-button";

export interface CheckoutWithDiscountProps {
  /** The subscription plan to checkout */
  plan: SubscriptionPlan;
  /** The billing period (monthly or yearly) */
  billingPeriod: BillingPeriod;
  /** Button text */
  buttonText?: string;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to show discount input by default */
  showDiscountByDefault?: boolean;
  /** Placeholder text for discount input */
  discountPlaceholder?: string;
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
 * Checkout button with integrated discount code input
 */
export function CheckoutWithDiscount({
  plan,
  billingPeriod,
  buttonText = "Subscribe Now",
  variant = "default",
  size = "default",
  className,
  showDiscountByDefault = false,
  discountPlaceholder = "Enter discount code",
  onCheckoutStart,
  onCheckoutError,
  onCheckoutSuccess,
  disabled = false,
}: CheckoutWithDiscountProps) {
  const [showDiscountInput, setShowDiscountInput] = useState(
    showDiscountByDefault,
  );
  const [discountCode, setDiscountCode] = useState("");

  const handleClearDiscount = () => {
    setDiscountCode("");
    setShowDiscountInput(false);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Discount Code Input (Collapsible) */}
      {showDiscountInput ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="discount-code" className="text-sm font-medium">
            Discount Code
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="discount-code"
                type="text"
                placeholder={discountPlaceholder}
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="pl-9 pr-9"
                maxLength={100}
              />
              {discountCode && (
                <button
                  type="button"
                  onClick={handleClearDiscount}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear discount code"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {discountCode && (
            <p className="text-xs text-muted-foreground">
              Code <strong>{discountCode}</strong> will be applied at checkout
            </p>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDiscountInput(true)}
          className="w-fit text-xs text-muted-foreground hover:text-foreground"
        >
          <Tag className="mr-1.5 h-3.5 w-3.5" />
          Have a discount code?
        </Button>
      )}

      {/* Checkout Button */}
      <CheckoutButton
        plan={plan}
        billingPeriod={billingPeriod}
        variant={variant}
        size={size}
        disabled={disabled}
        discountCode={discountCode || undefined}
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
