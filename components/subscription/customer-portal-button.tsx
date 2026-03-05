"use client";

import { ExternalLink, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useSubscriptionData } from "@/hooks/use-subscription-data";

/**
 * Customer Portal Button Component
 *
 * Provides access to the LemonSqueezy customer portal where users can:
 * - Update payment methods
 * - View billing history
 * - Update billing information
 * - Manage subscription (pause/resume/cancel)
 *
 * Features:
 * - Generates portal URL via backend API
 * - Opens portal in new tab
 * - Loading states and error handling
 * - Multiple button variants (default, outline, ghost, link)
 * - Customizable text and icons
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
   * @default "Manage Billing"
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
  children = "Manage Billing",
  showIcon = true,
  className = "",
  onOpen,
  onError,
}: CustomerPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { subscription } = useSubscriptionData();

  const handleOpenPortal = async () => {
    if (!subscription) {
      toast.error("No active subscription found");
      return;
    }

    setIsLoading(true);
    try {
      // Get customer portal URL from backend
      const response = await apiClient.subscriptions.getCustomerPortalUrl();

      if (response.portal_url) {
        // Open portal in new tab
        window.open(response.portal_url, "_blank", "noopener,noreferrer");
        onOpen?.();
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to open customer portal";
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // If subscription has a direct customer_portal_url, use it
  const hasDirectPortalUrl = subscription?.customer_portal_url;

  const handleClick = () => {
    if (hasDirectPortalUrl && subscription.customer_portal_url) {
      window.open(
        subscription.customer_portal_url,
        "_blank",
        "noopener,noreferrer",
      );
      onOpen?.();
    } else {
      handleOpenPortal();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || !subscription}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Opening...
        </>
      ) : (
        <>
          {showIcon && <ExternalLink className="h-4 w-4 mr-2" />}
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
      <span className="sr-only">Manage Billing</span>
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
