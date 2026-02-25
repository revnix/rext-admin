"use client";

/**
 * Trial Conversion CTA Component
 *
 * A prominent call-to-action component encouraging trial users to upgrade
 * to a paid subscription. Features benefits, urgency messaging, and direct
 * links to pricing/checkout.
 *
 * Features:
 * - Dynamic urgency messaging based on trial time remaining
 * - List of upgrade benefits
 * - Direct link to pricing page
 * - Highlighted recommended plan
 * - Dismissible option
 */

import { Check, Sparkles, X, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { SubscriptionStatus } from "@/types/subscription";
import type { Route } from "next";

export interface TrialConversionCTAProps {
  /** Additional CSS classes */
  className?: string;
  /** Show as modal/dialog instead of inline card */
  variant?: "inline" | "modal";
  /** Callback when CTA is dismissed */
  onDismiss?: () => void;
  /** Show dismiss button */
  dismissible?: boolean;
}

/**
 * CTA component to encourage trial-to-paid conversion
 */
export function TrialConversionCTA({
  className = "",
  variant = "inline",
  onDismiss,
  dismissible = true,
}: TrialConversionCTAProps) {
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!subscription) {
      fetchSubscription();
    }
  }, [subscription, fetchSubscription]);

  useEffect(() => {
    // Calculate days remaining
    if (
      subscription?.status === SubscriptionStatus.TRIAL &&
      subscription.trial_end_date
    ) {
      const trialEnd = new Date(subscription.trial_end_date);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    } else {
      setDaysRemaining(null);
    }
  }, [subscription]);

  // Don't show if not on trial
  if (subscription?.status !== SubscriptionStatus.TRIAL) {
    return null;
  }

  // Get urgency message
  const getUrgencyMessage = () => {
    if (daysRemaining === null) return "";
    if (daysRemaining <= 0) return "Your trial has ended";
    if (daysRemaining === 1) return "Last day of your trial!";
    if (daysRemaining <= 3)
      return `Only ${daysRemaining} days left in your trial`;
    if (daysRemaining <= 7)
      return `${daysRemaining} days remaining in your trial`;
    return "You're currently on a free trial";
  };

  const benefits = [
    "Unlimited workspaces and team members",
    "AI-powered content generation",
    "Advanced analytics and insights",
    "Priority customer support",
    "Access to all premium features",
    "Regular updates and new features",
  ];

  const urgencyColor =
    daysRemaining !== null && daysRemaining <= 3
      ? "text-red-600 dark:text-red-400"
      : daysRemaining !== null && daysRemaining <= 7
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-blue-600 dark:text-blue-400";

  const isModal = variant === "modal";

  return (
    <Card
      className={`${className} ${isModal ? "border-2 border-primary shadow-2xl" : ""}`}
    >
      <CardHeader className="relative">
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <div className="pr-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`h-5 w-5 ${urgencyColor}`} />
            <span className={`text-sm font-semibold ${urgencyColor}`}>
              {getUrgencyMessage()}
            </span>
          </div>
          <CardTitle className="text-2xl">
            Upgrade to unlock everything
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {daysRemaining !== null && daysRemaining > 0
              ? "Don't lose access to your work. Upgrade now for uninterrupted service."
              : "Your trial has ended. Upgrade to continue using all features."}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Benefits List */}
        <div className="space-y-3">
          <p className="font-semibold text-sm">What you'll get:</p>
          <ul className="space-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1" size="lg">
            <Link href="/pricing">
              <Zap className="mr-2 h-4 w-4" />
              View Plans & Pricing
            </Link>
          </Button>
          {daysRemaining !== null && daysRemaining > 0 && (
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href={`/dashboard/subscription` as Route}>View Trial Status</Link>
            </Button>
          )}
        </div>

        {/* Trust Signal */}
        <div className="pt-4 border-t">
          <p className="text-xs text-center text-muted-foreground">
            ✓ Cancel anytime · ✓ 14-day money-back guarantee · ✓ No credit card
            required for trial
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
