"use client";

import { CreditCard, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBillingActions } from "@/hooks/use-billing-actions";
import { useSubscriptionStore } from "@/stores/subscription-store";

/**
 * Manage Billing Button
 *
 * Opens LemonSqueezy's payment-method form inside the on-site checkout
 * overlay, so updating a card never navigates the user off the site.
 *
 * Everything else the LemonSqueezy customer portal offers is handled natively
 * elsewhere in the app — plan changes, cancel, pause/resume and invoices — so
 * the portal itself is no longer the destination. The one thing that still
 * requires it is tax IDs and billing addresses, which LemonSqueezy only serves
 * from a page that refuses to be framed; `TaxDetailsLink` covers that case.
 */

interface CustomerPortalButtonProps {
  /**
   * Button variant
   * @default "outline"
   */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";

  /**
   * Button size
   * @default "default"
   */
  size?: "default" | "sm" | "lg" | "icon";

  /**
   * Custom button text
   * @default "Update Payment Method"
   */
  children?: React.ReactNode;

  /**
   * Show icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Callback when portal URL is opened
   */
  onOpen?: () => void;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;
}

export function CustomerPortalButton({
  variant = "outline",
  size = "default",
  children = "Update Payment Method",
  showIcon = true,
  className = "",
  onOpen,
  onError,
}: CustomerPortalButtonProps) {
  const { subscription } = useSubscriptionStore();
  const { isLoading, updatePaymentMethod, hasBillingAccount } =
    useBillingActions();

  const handleClick = async () => {
    if (!subscription) {
      toast.error("No active subscription found");
      return;
    }

    try {
      await updatePaymentMethod();
      onOpen?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || !subscription || !hasBillingAccount}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Opening...
        </>
      ) : (
        <>
          {showIcon && <CreditCard className="h-4 w-4 mr-2" />}
          {children}
        </>
      )}
    </Button>
  );
}

/**
 * Settings Icon Variant
 * Compact icon-only button for settings menus
 */
export function CustomerPortalIconButton({
  className = "",
  onOpen,
  onError,
}: Pick<CustomerPortalButtonProps, "className" | "onOpen" | "onError">) {
  return (
    <CustomerPortalButton
      variant="ghost"
      size="icon"
      showIcon={false}
      className={className}
      onOpen={onOpen}
      onError={onError}
    >
      <Settings className="h-4 w-4" />
      <span className="sr-only">Update payment method</span>
    </CustomerPortalButton>
  );
}

/**
 * Link Variant
 * Text link style for inline usage
 */
export function CustomerPortalLink({
  children = "Manage billing in customer portal",
  className = "",
  onOpen,
  onError,
}: Pick<
  CustomerPortalButtonProps,
  "children" | "className" | "onOpen" | "onError"
>) {
  return (
    <CustomerPortalButton
      variant="link"
      size="sm"
      className={`h-auto p-0 ${className}`}
      onOpen={onOpen}
      onError={onError}
    >
      {children}
    </CustomerPortalButton>
  );
}
