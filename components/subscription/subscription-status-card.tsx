"use client";

/**
 * Subscription Status Card Component
 *
 * Displays current subscription status, plan details, and billing information.
 * Provides quick access to customer portal for managing billing.
 *
 * @module components/subscription/subscription-status-card
 */

import { Calendar, CreditCard, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBillingActions } from "@/hooks/use-billing-actions";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { SubscriptionStatus } from "@/types/subscription";

export interface SubscriptionStatusCardProps {
  /** Additional CSS classes */
  className?: string;
  /** Show manage billing button */
  showManageButton?: boolean;
}

/**
 * Subscription status card with plan details and billing info
 */
export function SubscriptionStatusCard({
  className,
  showManageButton = true,
}: SubscriptionStatusCardProps) {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const { subscription, isLoading } = useSubscriptionStore();
  const { updatePaymentMethod, hasBillingAccount } = useBillingActions();

  const handleManageBilling = async () => {
    try {
      setIsLoadingPortal(true);

      // Opens in the on-site overlay instead of navigating to LemonSqueezy.
      await updatePaymentMethod();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to open billing portal";

      toast.error("Failed to open billing portal", {
        description: errorMessage,
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        );
      case SubscriptionStatus.TRIAL:
        return <Badge variant="secondary">Trial</Badge>;
      case SubscriptionStatus.PAST_DUE:
        return <Badge variant="destructive">Past Due</Badge>;
      case SubscriptionStatus.PAUSED:
        return <Badge variant="outline">Paused</Badge>;
      case SubscriptionStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case SubscriptionStatus.EXPIRED:
        return <Badge variant="outline">Expired</Badge>;
      case SubscriptionStatus.SUSPENDED:
        return <Badge variant="outline">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Calculate days remaining for trial
  const getTrialDaysRemaining = (trialEndDate: string | null | undefined) => {
    if (!trialEndDate) return 0;
    const now = new Date();
    const end = new Date(trialEndDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.subscription) {
    const usagePlanName = useSubscriptionStore.getState().usage?.plan_name;

    if (usagePlanName) {
      return (
        <Card className={className}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{usagePlanName}</CardTitle>
                <CardDescription className="mt-1">
                  Your current usage plan
                </CardDescription>
              </div>
              <Badge variant="outline">Free / Default</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are currently on the {usagePlanName} plan. Upgrade to a
              premium plan to get higher limits and advanced features.
            </p>
            <Button asChild className="w-full">
              <a href="/pricing">View Upgrade Options</a>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Subscribe to a plan to get
            started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href="/pricing">View Plans</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isTrialActive =
    subscription?.subscription?.status === SubscriptionStatus.TRIAL;
  const trialDaysRemaining = subscription?.subscription?.trial_end_date
    ? getTrialDaysRemaining(subscription?.subscription?.trial_end_date)
    : null;

  return (
    <Card className={className}>
      {subscription?.subscription?.status && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {subscription?.subscription?.plan_display_name ||
                  subscription?.subscription?.plan_name}
              </CardTitle>
              <CardDescription className="mt-1">
                Your current subscription plan
              </CardDescription>
            </div>
            {getStatusBadge(subscription?.subscription?.status)}
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {/* Trial Warning */}
        {isTrialActive && trialDaysRemaining !== null && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Trial Period
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {trialDaysRemaining > 0
                    ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} remaining`
                    : "Trial expires today"}
                </p>
                {subscription?.subscription?.trial_end_date && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Ends on{" "}
                    {formatDate(subscription?.subscription?.trial_end_date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Billing Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing Period
            </p>
            <p className="font-medium capitalize">
              {subscription?.subscription?.billing_period}
            </p>
          </div>

          {subscription?.subscription?.start_date && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </p>
              <p className="font-medium">
                {formatDate(subscription?.subscription?.start_date)}
              </p>
            </div>
          )}

          {subscription?.subscription?.end_date && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {subscription?.subscription?.status ===
                SubscriptionStatus.CANCELLED
                  ? "Expires On"
                  : "Renews On"}
              </p>
              <p className="font-medium">
                {formatDate(subscription?.subscription?.end_date)}
              </p>
            </div>
          )}

          {subscription?.subscription?.cancelled_at && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cancelled On</p>
              <p className="font-medium">
                {formatDate(subscription?.subscription?.cancelled_at)}
              </p>
            </div>
          )}
        </div>

        {/* Cancelled Subscription Warning */}
        {subscription?.subscription?.status ===
          SubscriptionStatus.CANCELLED && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-4 space-y-3">
            <p className="text-sm text-orange-900 dark:text-orange-100">
              Your subscription has been cancelled and will remain active until{" "}
              {subscription?.subscription?.end_date &&
                formatDate(subscription?.subscription?.end_date)}
              . After that, you'll lose access to premium features.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/pricing">Re-subscribe to a Plan</a>
            </Button>
          </div>
        )}

        {/* Manage Billing Button */}
        {showManageButton && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleManageBilling}
              disabled={isLoadingPortal || !hasBillingAccount}
              variant="outline"
              className="w-full"
            >
              {isLoadingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Update Payment Method
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {hasBillingAccount
                ? "Change the card we bill, without leaving this page"
                : "Available once you're on a paid plan"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
