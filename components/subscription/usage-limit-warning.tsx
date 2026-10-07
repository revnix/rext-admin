"use client";

import { TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { Route } from "next";
import { SUBSCRIPTION_ACTION_VARIANTS } from "@/components/subscription/subscription-action-variants";
import { settingsRoutes } from "@/lib/routes";

/**
 * Usage Limit Warning Component
 *
 * Displays warnings when users approach or exceed their plan limits.
 *
 * Features:
 * - Automatic threshold detection (warning at 75%, critical at 90%)
 * - Workspaces, the one resource a plan caps
 * - Dismissible warnings
 * - Upgrade prompts
 * - Customizable thresholds
 */

/**
 * The resources a limit hook can check: workspaces, the one resource a plan caps.
 */
export type LimitedResource = "workspaces";

interface UsageLimitWarningProps {
  /**
   * Resource type to monitor
   */
  resource: "workspaces";

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
  const { usage, subscription, fetchUsage } = useSubscriptionStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [usagePercentage, setUsagePercentage] = useState<number>(0);
  const [currentUsage, setCurrentUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(0);

  useEffect(() => {
    // Fetch usage on mount
    if (!usage) {
      fetchUsage();
    }
  }, [usage, fetchUsage]);

  useEffect(() => {
    if (typeof window === "undefined" || !dismissible) return;
    setIsDismissed(readUsageWarningDismissal(resource));
  }, [resource, dismissible]);

  useEffect(() => {
    if (!usage || !subscription) return;

    const current = usage.workspaces.used;
    const max = usage.workspaces.limit ?? -1;

    setCurrentUsage(current);
    setLimit(max);

    // Calculate percentage (-1 means unlimited)
    if (max === -1) {
      setUsagePercentage(0);
    } else {
      setUsagePercentage((current / max) * 100);
    }
  }, [usage, subscription]);

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

  const getResourceLabel = () => "Workspaces";

  const tone = isExceeded || isCritical ? "danger" : "warning";
  const label = getResourceLabel();
  const dismiss = dismissible ? handleDismiss : undefined;
  const dismissLabel = `Dismiss ${label.toLowerCase()} usage warning`;

  const formatUsage = () => `${currentUsage} / ${limit}`;

  if (compact) {
    return (
      <Notice
        tone={tone}
        className={className}
        action={
          <Button size="sm" variant="outline" onClick={handleUpgrade}>
            Upgrade
          </Button>
        }
        onDismiss={dismiss}
        dismissLabel={dismissLabel}
      >
        <strong>{label}:</strong> {formatUsage()} ({usagePercentage.toFixed(0)}
        %)
      </Notice>
    );
  }

  return (
    <Notice
      tone={tone}
      className={className}
      title={
        isExceeded
          ? `${label} limit exceeded`
          : isCritical
            ? `${label} limit almost reached`
            : `${label} usage warning`
      }
      onDismiss={dismiss}
      dismissLabel={dismissLabel}
    >
      <div className="mt-2 flex flex-col gap-3">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span>Current usage: {formatUsage()}</span>
            <span className="font-semibold">{usagePercentage.toFixed(1)}%</span>
          </div>
          {showProgress && <Meter value={currentUsage} max={limit} low />}
        </div>

        <p>
          {isExceeded ? (
            <>
              You have exceeded your plan's {label.toLowerCase()} limit. Upgrade
              to continue using this feature.
            </>
          ) : isCritical ? (
            <>
              You're almost at your {label.toLowerCase()} limit. Consider
              upgrading to avoid interruptions.
            </>
          ) : (
            <>
              You've used {usagePercentage.toFixed(0)}% of your{" "}
              {label.toLowerCase()} limit. Consider upgrading for higher limits.
            </>
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={SUBSCRIPTION_ACTION_VARIANTS.upgradePrimary}
            onClick={handleUpgrade}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Upgrade plan
          </Button>

          <Button
            size="sm"
            variant={SUBSCRIPTION_ACTION_VARIANTS.navigateSecondary}
            onClick={() => router.push(settingsRoutes.usage as Route)}
          >
            View usage
          </Button>
        </div>
      </div>
    </Notice>
  );
}

/**
 * Hook to check if a resource limit is reached
 * Useful for preventing actions before they happen
 */
export function useResourceLimit(resource: LimitedResource) {
  const { usage, subscription, fetchUsage, fetchSubscription } =
    useSubscriptionStore();
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isLoadingLimit, setIsLoadingLimit] = useState(true);
  const [usagePercentage, setUsagePercentage] = useState(0);
  // The count and the plan's cap (-1 for none), for "2 of 3" beside a create action.
  const [counts, setCounts] = useState<{ used: number; max: number } | null>(
    null,
  );

  useEffect(() => {
    // Both store actions single-flight their requests, so multiple mounted
    // consumers (sidebar + switchers + usage warnings) share one fetch.
    // fetchSubscription's burst already includes usage stats; the standalone
    // fetchUsage only covers the case where the plan landed but usage failed.
    if (!subscription) {
      void fetchSubscription();
    } else if (!usage) {
      void fetchUsage();
    }

    if (!usage || !subscription) {
      setIsLoadingLimit(true);
      setIsLimitReached(false);
      return;
    }

    setIsLoadingLimit(false);

    const subscriptionDetail = subscription.subscription ?? subscription;
    const planLimits = (
      subscriptionDetail as { plan_limits?: Record<string, unknown> }
    )?.plan_limits;
    const usageData = usage as unknown as Record<string, unknown>;

    const getNumber = (value: unknown): number => {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    };

    let current = 0;
    let max = -1;

    switch (resource) {
      case "workspaces": {
        current = getNumber(
          (usageData.workspaces as { used?: number } | undefined)?.used ??
            (usageData as { current_workspaces?: number }).current_workspaces ??
            0,
        );
        max = getNumber(
          planLimits?.max_workspaces ??
            (usageData.workspaces as { limit?: number } | undefined)?.limit ??
            (usageData as { max_workspaces?: number }).max_workspaces ??
            -1,
        );
        break;
      }
    }

    setCounts({ used: current, max });

    if (max === -1) {
      setIsLimitReached(false);
      setUsagePercentage(0);
    } else {
      const percentage = (current / max) * 100;
      setUsagePercentage(percentage);
      setIsLimitReached(current >= max);
    }
  }, [usage, subscription, resource, fetchUsage, fetchSubscription]);

  return {
    isLimitReached,
    isLoading: isLoadingLimit,
    usagePercentage,
    used: counts?.used ?? null,
    max: counts && counts.max >= 0 ? counts.max : null,
    canCreate: !isLimitReached && !isLoadingLimit,
  };
}
