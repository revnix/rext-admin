"use client";

/**
 * Usage Metrics Component
 *
 * Displays resource usage for the current subscription with progress bars
 * and color-coded indicators based on usage percentage.
 *
 * @module components/subscription/usage-metrics
 */

import { AlertCircle, Calendar, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";

export interface UsageMetricsProps {
  /** Additional CSS classes */
  className?: string;
  /** Show detailed metrics */
  detailed?: boolean;
}

/**
 * Usage metrics with progress bars and color-coded indicators
 */
export function UsageMetrics({
  className,
  detailed = false,
}: UsageMetricsProps) {
  const { usage, credits, fetchSubscription, isLoading } =
    useSubscriptionStore();

  // Fetch usage on mount
  useEffect(() => {
    if (!usage || !credits) {
      fetchSubscription();
    }
  }, [fetchSubscription, usage, credits]);

  // Get color based on usage percentage
  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return "text-danger-600";
    if (percentage >= 75) return "text-warning-600";
    return "text-foreground";
  };

  // Get progress bar color
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-danger-600";
    if (percentage >= 75) return "bg-warning-600";
    return "bg-foreground";
  };

  // Get status badge
  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge variant="danger">High usage</Badge>;
    }
    if (percentage >= 75) {
      return <Badge variant="warning">Moderate</Badge>;
    }
    return <Badge variant="neutral">Healthy</Badge>;
  };

  // Format number
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === -1)
      return "Unlimited";
    return value.toLocaleString();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading && !usage) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>
            No usage data available. Subscribe to a plan to track your usage.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const usageMetrics = [
    {
      label: "Workspaces",
      current: usage.workspaces.used,
      max: usage.workspaces.limit,
      percentage: usage.workspaces.percentage,
      description: "Number of workspaces you can create",
    },
    {
      label: "Members",
      current: usage.members.used ?? 0,
      max: usage.members.limit ?? 0,
      percentage: usage.members.percentage ?? 0,
      description: "Total team members across all workspaces",
    },
  ];

  // Get overall status (highest usage percentage)
  const overallPercentage = Math.max(
    usage.workspaces.percentage,
    usage.members.percentage ?? 0,
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-2 items-start justify-between">
          <div>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription className="mt-1">
              Track your resource usage for {usage.plan_name}
            </CardDescription>
          </div>
          {getStatusBadge(overallPercentage)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Usage Reset Date */}
        {usage.usage_reset_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            <Calendar className="h-4 w-4" />
            <span>
              Usage resets on{" "}
              <span className="font-medium text-foreground">
                {formatDate(usage.usage_reset_date)}
              </span>
            </span>
          </div>
        )}

        {/* Credits Section */}
        {credits && (
          <div className="space-y-3 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Content Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    getUsageColor(
                      credits.credits_per_month
                        ? ((credits.credits_per_month -
                            credits.current_credits) /
                            credits.credits_per_month) *
                            100
                        : 0,
                    ),
                  )}
                >
                  {credits.current_credits.toLocaleString()}{" "}
                  {credits.credits_per_month
                    ? `/ ${credits.credits_per_month.toLocaleString()}`
                    : "Remaining"}
                </span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {credits.articles_remaining !== null ? (
                <>
                  You have enough credits for approximately{" "}
                  <span className="font-semibold text-foreground">
                    {credits.articles_remaining} articles
                  </span>{" "}
                  this month.
                </>
              ) : (
                <>Unlimited articles generation available.</>
              )}
            </div>

            {credits.credits_per_month && (
              <div className="relative mt-2">
                <Progress
                  value={
                    ((credits.credits_per_month - credits.current_credits) /
                      credits.credits_per_month) *
                    100
                  }
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Usage Metrics */}
        <div className="space-y-5">
          {usageMetrics?.map((metric) => {
            const isUnlimited =
              metric.max === -1 ||
              metric.max === null ||
              metric.max === undefined;
            const percentage = isUnlimited ? 0 : metric.percentage;

            return (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm font-medium cursor-help">
                          {metric.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{metric.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        !isUnlimited && getUsageColor(percentage),
                      )}
                    >
                      {formatNumber(metric.current)} /{" "}
                      {formatNumber(metric.max)}
                    </span>
                    {!isUnlimited && detailed && (
                      <span className="text-xs text-muted-foreground">
                        ({percentage.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>

                {!isUnlimited && (
                  <div className="relative">
                    <Progress
                      value={percentage}
                      className="h-2"
                      aria-label={`${metric.label} usage`}
                      aria-valuetext={`${percentage.toFixed(0)} percent used`}
                    />
                    <div
                      className={cn(
                        "absolute inset-0 h-2 rounded-full transition-all",
                        getProgressColor(percentage),
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}

                {isUnlimited && (
                  <div className="text-xs text-muted-foreground italic">
                    No limits on this resource
                  </div>
                )}

                {/* Warning for high usage */}
                {!isUnlimited && percentage >= 90 && (
                  <p className="text-xs text-danger-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    You're approaching your {metric.label.toLowerCase()} limit
                  </p>
                )}

                {!isUnlimited && percentage >= 75 && percentage < 90 && (
                  <p className="text-xs text-warning-600">
                    Consider upgrading if you need more{" "}
                    {metric.label.toLowerCase()}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Upgrade CTA */}
        {overallPercentage >= 75 && (
          <div className="pt-4 border-t">
            <div className="bg-info-50 rounded-md p-4">
              <p className="text-sm text-info-700 mb-3">
                Need more resources? Upgrade your plan to get higher limits and
                more features.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                View upgrade options →
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
