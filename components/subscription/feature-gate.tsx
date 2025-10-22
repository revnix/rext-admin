"use client";

import { Lock, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSubscriptionStore } from "@/stores/subscription-store";

/**
 * Feature Gate Component
 *
 * Controls access to features based on subscription plan.
 * Displays upgrade prompts for users on lower-tier plans.
 *
 * Features:
 * - Plan-based feature access control
 * - Custom upgrade messages
 * - Fallback UI for blocked features
 * - Inline or card-style gates
 * - Optional soft gate (show warning but allow access)
 */

interface FeatureGateProps {
  /**
   * Feature identifier to check against plan features
   */
  feature: string;

  /**
   * Minimum plan required (or array of allowed plans)
   */
  requiredPlan?: string | string[];

  /**
   * Children to render when access is granted
   */
  children: ReactNode;

  /**
   * Fallback content when access is denied (optional)
   * If not provided, shows default upgrade prompt
   */
  fallback?: ReactNode;

  /**
   * Custom title for upgrade prompt
   */
  upgradeTitle?: string;

  /**
   * Custom description for upgrade prompt
   */
  upgradeDescription?: string;

  /**
   * Display mode
   * - "card": Show as a card (default)
   * - "inline": Show as inline alert
   * - "modal": Show as modal (future implementation)
   */
  mode?: "card" | "inline" | "modal";

  /**
   * Soft gate - show warning but still allow access
   * Useful for encouraging upgrades without blocking
   */
  soft?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;
}

export function FeatureGate({
  feature,
  requiredPlan,
  children,
  fallback,
  upgradeTitle,
  upgradeDescription,
  mode = "card",
  soft = false,
  className = "",
}: FeatureGateProps) {
  const router = useRouter();
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetch subscription on mount if not loaded
    if (!subscription) {
      fetchSubscription();
    }
  }, [subscription, fetchSubscription]);

  useEffect(() => {
    // Check if user has access to this feature
    if (!subscription) {
      setHasAccess(null); // Loading state
      return;
    }

    // Check plan-based access
    if (requiredPlan) {
      const allowedPlans = Array.isArray(requiredPlan)
        ? requiredPlan
        : [requiredPlan];

      if (
        !subscription.plan_name ||
        !allowedPlans.includes(subscription.plan_name.toLowerCase())
      ) {
        setHasAccess(false);
        return;
      }
    }

    // Check feature flags in plan
    if (subscription.plan_features) {
      const featureValue = subscription.plan_features[feature];

      // Handle boolean features
      if (typeof featureValue === "boolean") {
        setHasAccess(featureValue);
        return;
      }

      // Handle numeric features (assume > 0 means enabled)
      if (typeof featureValue === "number") {
        setHasAccess(featureValue > 0);
        return;
      }

      // Handle string features (assume non-empty means enabled)
      if (typeof featureValue === "string") {
        setHasAccess(featureValue.length > 0);
        return;
      }
    }

    // Default to allowing access if feature not found in plan
    setHasAccess(true);
  }, [subscription, feature, requiredPlan]);

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const handleManageSubscription = () => {
    router.push("/dashboard/subscription");
  };

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Access granted - show children
  if (hasAccess || soft) {
    return (
      <>
        {soft && !hasAccess && (
          <Alert className="mb-4">
            <Zap className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Upgrade to unlock full access:</strong>{" "}
                {upgradeDescription ||
                  `This feature is limited on your current plan.`}
              </span>
              <Button size="sm" onClick={handleUpgrade}>
                Upgrade
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {children}
      </>
    );
  }

  // Access denied - show fallback or default upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompts based on mode
  if (mode === "inline") {
    return (
      <Alert className={className}>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-start justify-between gap-4">
            <div>
              <strong>{upgradeTitle || "Feature Locked"}</strong>
              <p className="text-sm mt-1">
                {upgradeDescription ||
                  "This feature is not available on your current plan. Upgrade to unlock."}
              </p>
            </div>
            <Button size="sm" onClick={handleUpgrade}>
              Upgrade
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Card mode (default)
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{upgradeTitle || "Upgrade Required"}</CardTitle>
              <CardDescription>
                {upgradeDescription ||
                  "This feature is not available on your current plan"}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Unlock with a Premium Plan
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Access to {feature.replace(/_/g, " ")}</li>
            <li>Higher usage limits</li>
            <li>Priority support</li>
            <li>Advanced analytics</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleUpgrade} className="flex-1">
            <Zap className="mr-2 h-4 w-4" />
            View Plans
          </Button>
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            className="flex-1"
          >
            Manage Subscription
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Already upgraded?{" "}
          <button
            type="button"
            onClick={() => fetchSubscription()}
            className="text-primary hover:underline"
          >
            Refresh subscription
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to check feature access programmatically
 */
export function useFeatureAccess(
  feature: string,
  requiredPlan?: string | string[],
) {
  const { subscription } = useSubscriptionStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!subscription) {
      setHasAccess(null);
      return;
    }

    // Check plan-based access
    if (requiredPlan) {
      const allowedPlans = Array.isArray(requiredPlan)
        ? requiredPlan
        : [requiredPlan];

      if (
        !subscription.plan_name ||
        !allowedPlans.includes(subscription.plan_name.toLowerCase())
      ) {
        setHasAccess(false);
        return;
      }
    }

    // Check feature flags
    if (subscription.plan_features) {
      const featureValue = subscription.plan_features[feature];

      if (typeof featureValue === "boolean") {
        setHasAccess(featureValue);
        return;
      }

      if (typeof featureValue === "number") {
        setHasAccess(featureValue > 0);
        return;
      }

      if (typeof featureValue === "string") {
        setHasAccess(featureValue.length > 0);
        return;
      }
    }

    setHasAccess(true);
  }, [subscription, feature, requiredPlan]);

  return hasAccess;
}
