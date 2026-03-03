"use client";

/**
 * Subscription Status Card Component
 *
 * Displays current subscription status, plan details, and billing information.
 * Provides quick access to customer portal for managing billing.
 *
 * @module components/subscription/subscription-status-card
 */

import {
  Calendar,
  CreditCard,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
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

  const handleManageBilling = async () => {
    try {
      setIsLoadingPortal(true);

      const { getPortalUrl } = useSubscriptionStore.getState();
      const response = await getPortalUrl();

      // Open customer portal in new window
      window.open(response.portal_url, "_blank");

      toast.success("Opening billing portal...");
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate days remaining for trial
  const getTrialDaysRemaining = (trialEndDate: string) => {
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

  if (!subscription) {
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
          <Button asChild>
            <a href="/pricing">View Plans</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isTrialActive = subscription.status === SubscriptionStatus.TRIAL;
  const trialDaysRemaining = subscription.trial_end_date
    ? getTrialDaysRemaining(subscription.trial_end_date)
    : null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">
              {subscription.plan_display_name || subscription.plan_name}
            </CardTitle>
            <CardDescription className="mt-1">
              Your current subscription plan
            </CardDescription>
          </div>
          {getStatusBadge(subscription.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trial Warning */}
        {isTrialActive && trialDaysRemaining !== null && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Trial Period
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {trialDaysRemaining > 0
                    ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} remaining`
                    : "Trial expires today"}
                </p>
                {subscription.trial_end_date && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Ends on {formatDate(subscription.trial_end_date)}
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
              {subscription.billing_period}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </p>
            <p className="font-medium">{formatDate(subscription.start_date)}</p>
          </div>

          {subscription.end_date && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {subscription.status === SubscriptionStatus.CANCELLED
                  ? "Expires On"
                  : "Renews On"}
              </p>
              <p className="font-medium">{formatDate(subscription.end_date)}</p>
            </div>
          )}

          {subscription.cancelled_at && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cancelled On</p>
              <p className="font-medium">
                {formatDate(subscription.cancelled_at)}
              </p>
            </div>
          )}
        </div>

        {/* Cancelled Subscription Warning */}
        {subscription.status === SubscriptionStatus.CANCELLED && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm text-orange-900 dark:text-orange-100">
              Your subscription has been cancelled and will remain active until{" "}
              {subscription.end_date && formatDate(subscription.end_date)}.
              After that, you'll lose access to premium features.
            </p>
          </div>
        )}

        {/* Manage Billing Button */}
        {showManageButton && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleManageBilling}
              disabled={isLoadingPortal}
              variant="outline"
              className="w-full"
            >
              {isLoadingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Billing
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Update payment method, view invoices, and more
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
