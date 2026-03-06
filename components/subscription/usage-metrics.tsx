"use client";

/**
 * Usage Metrics Component
 *
 * Displays resource usage for the current subscription with progress bars
 * and color-coded indicators based on usage percentage.
 *
 * @module components/subscription/usage-metrics
 */

import { AlertCircle, Calendar, Loader2, TrendingUp } from "lucide-react";
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
  const { usage, fetchSubscription, isLoading } = useSubscriptionStore();

  // Fetch usage on mount
  useEffect(() => {
    if (!usage) {
      fetchSubscription();
    }
  }, [fetchSubscription, usage]);

  // Get color based on usage percentage
  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return "text-red-600 dark:text-red-400";
    if (percentage >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Get progress bar color
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get status badge
  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          High Usage
        </Badge>
      );
    }
    if (percentage >= 75) {
      return (
        <Badge
          variant="outline"
          className="border-yellow-500 text-yellow-700 dark:text-yellow-400 gap-1"
        >
          <TrendingUp className="h-3 w-3" />
          Moderate
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-green-500 text-green-700 dark:text-green-400"
      >
        Healthy
      </Badge>
    );
  };

  // Format number
  const formatNumber = (value: number): string => {
    if (value === -1) return "Unlimited";
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
      current: usage.current_workspaces,
      max: usage.max_workspaces,
      percentage: usage.workspaces_usage_percent,
      description: "Number of workspaces you can create",
    },
    {
      label: "Topics",
      current: usage.current_topics,
      max: usage.max_topics,
      percentage: usage.topics_usage_percent,
      description: "Total topics across all workspaces",
    },
    {
      label: "Knowledge Items",
      current: usage.current_knowledge_items,
      max: usage.max_knowledge_items,
      percentage: usage.knowledge_items_usage_percent,
      description: "Knowledge base entries and documents",
    },
    {
      label: "API Calls",
      current: usage.current_api_calls,
      max: usage.max_api_calls_per_month,
      percentage: usage.api_calls_usage_percent,
      description: "API calls this billing period",
    },
  ];

  // Get overall status (highest usage percentage)
  const overallPercentage = Math.max(
    usage.workspaces_usage_percent,
    usage.topics_usage_percent,
    usage.knowledge_items_usage_percent,
    usage.api_calls_usage_percent,
  );

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

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Calendar className="h-4 w-4" />
          <span>
            Usage resets on{" "}
            <span className="font-medium text-foreground">
              {formatDate(usage.usage_reset_date)}
            </span>
          </span>
        </div>

        {/* Usage Metrics */}
        <div className="space-y-5">
          {usageMetrics.map((metric) => {
            const isUnlimited = metric.max === -1;
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
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    You're approaching your {metric.label.toLowerCase()} limit
                  </p>
                )}

                {!isUnlimited && percentage >= 75 && percentage < 90 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
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
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                Need more resources? Upgrade your plan to get higher limits and
                more features.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
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
