"use client";

import { AlertTriangle, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSubscriptionData } from "@/hooks/use-subscription-data";
import type { Route } from "next";
import { SUBSCRIPTION_ACTION_VARIANTS } from "@/components/subscription/subscription-action-variants";

/**
 * Usage Limit Warning Component
 *
 * Displays warnings when users approach or exceed their plan limits.
 *
 * Features:
 * - Automatic threshold detection (warning at 75%, critical at 90%)
 * - Multiple resource tracking (workspaces, topics, AI requests, etc.)
 * - Dismissible warnings
 * - Upgrade prompts
 * - Customizable thresholds
 */

interface UsageLimitWarningProps {
  /**
   * Resource type to monitor
   */
  resource:
    | "workspaces"
    | "topics"
    | "knowledge_items"
    | "ai_requests"
    | "storage";

  /**
   * Show warning when usage reaches this percentage (0-100)
   * @default 75
   */
  warningThreshold?: number;

  /**
   * Show critical warning when usage reaches this percentage (0-100)
   * @default 90
   */
  criticalThreshold?: number;

  /**
   * Allow dismissing the warning
   * @default true
   */
  dismissible?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Compact mode (smaller alert)
   * @default false
   */
  compact?: boolean;

  /**
   * Show progress bar
   * @default true
   */
  showProgress?: boolean;
}

const WARNING_DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

type UsageWarningDismissal = {
  dismissedAt: number;
  expiresAt: number;
};

function getUsageWarningDismissalKey(resource: string): string {
  return `usage-warning-${resource}`;
}

function readUsageWarningDismissal(resource: string): boolean {
  const key = getUsageWarningDismissalKey(resource);
  const raw = localStorage.getItem(key);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as UsageWarningDismissal;
    if (parsed.expiresAt > Date.now()) {
      return true;
    }
    localStorage.removeItem(key);
    return false;
  } catch {
    localStorage.removeItem(key);
    return false;
  }
}

export function UsageLimitWarning({
  resource,
  warningThreshold = 75,
  criticalThreshold = 90,
  dismissible = true,
  className = "",
  compact = false,
  showProgress = true,
}: UsageLimitWarningProps) {
  const router = useRouter();
  const { usage, subscription } = useSubscriptionData();
  const [isDismissed, setIsDismissed] = useState(false);
  const [usagePercentage, setUsagePercentage] = useState<number>(0);
  const [currentUsage, setCurrentUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined" || !dismissible) return;
    setIsDismissed(readUsageWarningDismissal(resource));
  }, [resource, dismissible]);

  useEffect(() => {
    if (!usage || !subscription) return;

    // Calculate usage percentage based on resource type
    let current = 0;
    let max = 0;

    switch (resource) {
      case "workspaces":
        current = usage.current_workspaces;
        max = subscription.plan_limits?.max_workspaces ?? -1;
        break;
      case "topics":
        current = usage.current_topics;
        max = subscription.plan_limits?.max_topics ?? -1;
        break;
      case "knowledge_items":
        current = usage.current_knowledge_items;
        max = subscription.plan_limits?.max_knowledge_items ?? -1;
        break;
      case "ai_requests":
        current = usage.current_api_calls;
        max = subscription.plan_limits?.max_api_calls_per_month ?? -1;
        break;
      case "storage":
        current = 0; // Storage tracking not yet implemented
        max = -1; // Storage tracking not yet implemented
        break;
    }

    setCurrentUsage(current);
    setLimit(max);

    // Calculate percentage (-1 means unlimited)
    if (max === -1) {
      setUsagePercentage(0);
    } else {
      setUsagePercentage((current / max) * 100);
    }
  }, [usage, subscription, resource]);

  const handleUpgrade = () => {
    router.push("/pricing" as Route);
  };

  const handleDismiss = () => {
    setIsDismissed(true);

    const now = Date.now();
    const payload: UsageWarningDismissal = {
      dismissedAt: now,
      expiresAt: now + WARNING_DISMISS_TTL_MS,
    };

    localStorage.setItem(
      getUsageWarningDismissalKey(resource),
      JSON.stringify(payload),
    );
  };

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  // Don't show if unlimited
  if (limit === -1) {
    return null;
  }

  // Don't show if below warning threshold
  if (usagePercentage < warningThreshold) {
    return null;
  }

  const isCritical = usagePercentage >= criticalThreshold;
  const isExceeded = usagePercentage >= 100;

  const getResourceLabel = () => {
    switch (resource) {
      case "workspaces":
        return "Workspaces";
      case "topics":
        return "Topics";
      case "knowledge_items":
        return "Knowledge Items";
      case "ai_requests":
        return "AI Requests";
      case "storage":
        return "Storage";
      default:
        return resource;
    }
  };

  const getAlertVariant = () => {
    if (isExceeded || isCritical) {
      return "destructive";
    }
    return "default";
  };

  const formatUsage = () => {
    if (resource === "storage") {
      const currentGB = (currentUsage / 1024).toFixed(2);
      const limitGB = (limit / 1024).toFixed(2);
      return `${currentGB} GB / ${limitGB} GB`;
    }
    return `${currentUsage} / ${limit}`;
  };

  if (compact) {
    return (
      <Alert variant={getAlertVariant()} className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">
            <strong>{getResourceLabel()}:</strong> {formatUsage()} (
            {usagePercentage.toFixed(0)}%)
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleUpgrade}>
              Upgrade
            </Button>
            {dismissible && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
                aria-label={`Dismiss ${getResourceLabel().toLowerCase()} usage warning`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant={getAlertVariant()} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <AlertTitle>
              {isExceeded
                ? `${getResourceLabel()} Limit Exceeded`
                : isCritical
                  ? `${getResourceLabel()} Limit Almost Reached`
                  : `${getResourceLabel()} Usage Warning`}
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Current usage: {formatUsage()}</span>
                  <span className="font-semibold">
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                {showProgress && (
                  <Progress
                    value={Math.min(usagePercentage, 100)}
                    className={`h-2 ${
                      isCritical
                        ? "[&>div]:bg-destructive"
                        : "[&>div]:bg-yellow-500"
                    }`}
                  />
                )}
              </div>

              <p className="text-sm">
                {isExceeded ? (
                  <>
                    You have exceeded your plan's{" "}
                    {getResourceLabel().toLowerCase()} limit. Upgrade to
                    continue using this feature.
                  </>
                ) : isCritical ? (
                  <>
                    You're almost at your {getResourceLabel().toLowerCase()}{" "}
                    limit. Consider upgrading to avoid interruptions.
                  </>
                ) : (
                  <>
                    You've used {usagePercentage.toFixed(0)}% of your{" "}
                    {getResourceLabel().toLowerCase()} limit. Consider upgrading
                    for higher limits.
                  </>
                )}
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={SUBSCRIPTION_ACTION_VARIANTS.upgradePrimary}
                  onClick={handleUpgrade}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>

                <Button
                  size="sm"
                  variant={SUBSCRIPTION_ACTION_VARIANTS.navigateSecondary}
                  onClick={() =>
                    router.push("/dashboard/subscription" as Route)
                  }
                >
                  View Usage
                </Button>
              </div>
            </AlertDescription>
          </div>

          {dismissible && (
            <Button
              size="sm"
              variant={SUBSCRIPTION_ACTION_VARIANTS.dismissTertiary}
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

/**
 * Hook to check if a resource limit is reached
 * Useful for preventing actions before they happen
 */
export function useResourceLimit(
  resource:
    | "workspaces"
    | "topics"
    | "knowledge_items"
    | "ai_requests"
    | "storage",
) {
  const { usage, subscription } = useSubscriptionData();
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [usagePercentage, setUsagePercentage] = useState(0);

  useEffect(() => {
    if (!usage || !subscription) {
      setIsLimitReached(false);
      return;
    }

    let current = 0;
    let max = 0;

    switch (resource) {
      case "workspaces":
        current = usage.current_workspaces;
        max = subscription.plan_limits?.max_workspaces ?? -1;
        break;
      case "topics":
        current = usage.current_topics;
        max = subscription.plan_limits?.max_topics ?? -1;
        break;
      case "knowledge_items":
        current = usage.current_knowledge_items;
        max = subscription.plan_limits?.max_knowledge_items ?? -1;
        break;
      case "ai_requests":
        current = usage.current_api_calls;
        max = subscription.plan_limits?.max_api_calls_per_month ?? -1;
        break;
      case "storage":
        current = 0; // Storage tracking not yet implemented
        max = -1; // Storage tracking not yet implemented
        break;
    }

    // -1 means unlimited
    if (max === -1) {
      setIsLimitReached(false);
      setUsagePercentage(0);
    } else {
      const percentage = (current / max) * 100;
      setUsagePercentage(percentage);
      setIsLimitReached(current >= max);
    }
  }, [usage, subscription, resource]);

  return {
    isLimitReached,
    usagePercentage,
    canCreate: !isLimitReached,
  };
}
