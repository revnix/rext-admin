"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UsageLimitWarning } from "@/components/subscription/usage-limit-warning";
import { UsageMetrics } from "@/components/subscription/usage-metrics";
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
 * Usage Dashboard Page
 *
 * Displays detailed usage statistics and limits for the current subscription.
 * Shows workspaces, topics, knowledge items, and API usage.
 *
 * Features:
 * - Real-time usage statistics
 * - Visual progress bars for each limit
 * - Usage warnings when approaching limits
 * - Refresh button to update stats
 * - Plan upgrade prompts when limits are reached
 */

export default function UsagePage() {
  const { subscription, usage, fetchUsage, fetchSubscription, isLoading } =
    useSubscriptionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch subscription and usage on mount
    if (!subscription || !usage) {
      fetchSubscription();
    }
  }, [subscription, usage, fetchSubscription]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsage();
      toast.success("Usage statistics refreshed");
    } catch (_error) {
      toast.error("Failed to refresh usage statistics");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your usage and plan limits
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Usage Warnings */}
      <div className="space-y-3">
        <UsageLimitWarning resource="workspaces" />
        <UsageLimitWarning resource="topics" />
        <UsageLimitWarning resource="knowledge_items" />
        <UsageLimitWarning resource="ai_requests" />
      </div>

      {/* Detailed Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>
            Your usage across all resources for{" "}
            {subscription?.plan_name || "your plan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageMetrics detailed={true} />
        </CardContent>
      </Card>

      {/* Plan Information */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
            <CardDescription>
              Information about your current subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Current Plan
                </h4>
                <p className="text-lg font-semibold">
                  {subscription.plan_name || "Unknown"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Billing Period
                </h4>
                <p className="text-lg font-semibold capitalize">
                  {subscription.billing_period || "N/A"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Status
                </h4>
                <p className="text-lg font-semibold capitalize">
                  {subscription.status}
                </p>
              </div>

              {subscription.current_period_end && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Next Billing Date
                  </h4>
                  <p className="text-lg font-semibold">
                    {new Date(
                      subscription.current_period_end,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Plan Limits Summary */}
            {subscription.plan_limits && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">
                  Plan Limits
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Workspaces</p>
                    <p className="text-2xl font-bold">
                      {subscription.plan_limits.max_workspaces === -1
                        ? "∞"
                        : subscription.plan_limits.max_workspaces}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Topics</p>
                    <p className="text-2xl font-bold">
                      {subscription.plan_limits.max_topics === -1
                        ? "∞"
                        : subscription.plan_limits.max_topics}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Knowledge Items
                    </p>
                    <p className="text-2xl font-bold">
                      {subscription.plan_limits.max_knowledge_items === -1
                        ? "∞"
                        : subscription.plan_limits.max_knowledge_items}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      API Calls/Month
                    </p>
                    <p className="text-2xl font-bold">
                      {subscription.plan_limits.max_api_calls_per_month === -1
                        ? "∞"
                        : subscription.plan_limits.max_api_calls_per_month.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
