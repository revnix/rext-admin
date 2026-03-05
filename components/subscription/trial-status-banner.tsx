"use client";

import { AlertCircle, Clock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionData } from "@/hooks/use-subscription-data";
import { SubscriptionStatus } from "@/types/subscription";
import type { Route } from "next";

/**
 * Trial Status Banner Component
 *
 * Displays a prominent banner when user is on trial or trial is ending soon.
 * Encourages conversion to paid subscription.
 *
 * Features:
 * - Auto-hides when subscription is active (not trial)
 * - Shows days remaining in trial
 * - Color-coded urgency (yellow for >3 days, red for <=3 days)
 * - CTA to upgrade
 * - Dismissible (hides for current session)
 */

interface TrialStatusBannerProps {
  /**
   * Minimum days remaining to show the banner
   * @default 0 (show always during trial)
   */
  showWhenDaysRemaining?: number;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Show on all pages (true) or only on dashboard (false)
   * @default true
   */
  showGlobally?: boolean;
}

export function TrialStatusBanner({
  showWhenDaysRemaining = 0,
  className = "",
}: TrialStatusBannerProps) {
  const router = useRouter();
  const { subscription } = useSubscriptionData();
  const [isDismissed, setIsDismissed] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Calculate time remaining in trial with real-time updates
    const calculateTimeRemaining = () => {
      if (
        subscription?.status === SubscriptionStatus.TRIAL &&
        subscription.trial_end_date
      ) {
        const trialEnd = new Date(subscription.trial_end_date);
        const now = new Date();
        const diffTime = trialEnd.getTime() - now.getTime();

        if (diffTime <= 0) {
          setDaysRemaining(0);
          setHoursRemaining(0);
          setMinutesRemaining(0);
          return;
        }

        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

        setDaysRemaining(days);
        setHoursRemaining(hours);
        setMinutesRemaining(minutes);
      } else {
        setDaysRemaining(null);
        setHoursRemaining(null);
        setMinutesRemaining(null);
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every minute for real-time countdown
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [subscription]);

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  // Don't show if not on trial
  if (subscription?.status !== SubscriptionStatus.TRIAL) {
    return null;
  }

  // Don't show if days remaining is less than threshold
  if (daysRemaining !== null && daysRemaining < showWhenDaysRemaining) {
    return null;
  }

  // Determine urgency level
  const isLastDay =
    daysRemaining === 0 && hoursRemaining !== null && hoursRemaining > 0;
  const isUrgent = daysRemaining !== null && daysRemaining <= 3;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;

  // Get appropriate colors based on urgency
  const getBannerColors = () => {
    if (isUrgent) {
      return {
        bg: "bg-red-50 dark:bg-red-950/20",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-900 dark:text-red-100",
        icon: "text-red-600 dark:text-red-400",
        button: "bg-red-600 hover:bg-red-700 text-white",
      };
    }
    if (isExpiringSoon) {
      return {
        bg: "bg-yellow-50 dark:bg-yellow-950/20",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-900 dark:text-yellow-100",
        icon: "text-yellow-600 dark:text-yellow-400",
        button: "bg-yellow-600 hover:bg-yellow-700 text-white",
      };
    }
    return {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-900 dark:text-blue-100",
      icon: "text-blue-600 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    };
  };

  const colors = getBannerColors();

  const handleUpgrade = () => {
    router.push("/pricing" as Route);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Get trial message with countdown
  const getTrialMessage = () => {
    if (daysRemaining === null) {
      return "You're currently on a trial period.";
    }

    // Expired
    if (daysRemaining === 0 && hoursRemaining === 0 && minutesRemaining === 0) {
      return "Your trial has expired.";
    }

    // Last day warning
    if (isLastDay) {
      return `⚡ Last Day! ${hoursRemaining}h ${minutesRemaining}m remaining`;
    }

    // Less than 24 hours
    if (daysRemaining === 0 && hoursRemaining !== null) {
      return `${hoursRemaining}h ${minutesRemaining}m remaining in your trial`;
    }

    // 1 day + hours
    if (daysRemaining === 1) {
      return `${daysRemaining} day, ${hoursRemaining}h remaining`;
    }

    // Multiple days + hours
    if (daysRemaining <= 7) {
      return `${daysRemaining} days, ${hoursRemaining}h remaining`;
    }

    // More than a week
    return `${daysRemaining} days left in your trial`;
  };

  return (
    <Card className={`${colors.bg} ${colors.border} border-l-4 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {isUrgent ? (
              <AlertCircle className={`h-5 w-5 ${colors.icon}`} />
            ) : isExpiringSoon ? (
              <Clock className={`h-5 w-5 ${colors.icon}`} />
            ) : (
              <Zap className={`h-5 w-5 ${colors.icon}`} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-sm font-semibold ${colors.text}`}>
                  {getTrialMessage()}
                </h3>
                <p className={`mt-1 text-sm ${colors.text} opacity-90`}>
                  {daysRemaining !== null && daysRemaining > 0
                    ? "Upgrade now to continue enjoying all features without interruption. Get access to unlimited workspaces, AI-powered content, and priority support."
                    : "Your trial has ended. Upgrade to a paid plan to continue using all features."}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={handleUpgrade}
                  className={colors.button}
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Upgrade Now
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className={`${colors.text} hover:bg-black/5 dark:hover:bg-white/5`}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
