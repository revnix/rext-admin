"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
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
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";

/**
 * Usage Dashboard Page
 *
 * Displays detailed usage statistics and limits for the current subscription.
 *
 * **Permission Required:** none beyond sign-in; shows the caller's own
 * subscription usage. Platform-wide usage stats live in System Monitoring
 * behind `security.read`.
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
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  // Ensure workspace-scoped permissions are loaded into the permission store
  useWorkspacePermissions(workspaceId);

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
    <PageLayout
      title="Usage Dashboard"
      description="Monitor your usage and plan limits"
      actions={
        <Button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      {/* Usage Warnings */}
      <div className="space-y-4 mb-6">
        <UsageLimitWarning resource="workspaces" />
        <UsageLimitWarning resource="knowledge_items" />
        <UsageLimitWarning resource="ai_requests" />
      </div>

      {/* Detailed Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>
            Your usage across all resources for{" "}
            {subscription?.subscription?.plan_name || "your plan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageMetrics detailed={true} />
        </CardContent>
      </Card>

      <br />

      {/* Plan Information */}
      {subscription?.subscription && (
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
                <p className="text-lg font-semibold capitalize">
                  {subscription?.subscription?.plan_name || "Unknown"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Billing Period
                </h4>
                <p className="text-lg font-semibold capitalize">
                  {subscription?.subscription?.billing_period || "N/A"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Status
                </h4>
                <p className="text-lg font-semibold capitalize">
                  {subscription?.subscription?.status}
                </p>
              </div>

              {subscription?.subscription?.current_period_end && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Next Billing Date
                  </h4>
                  <p className="text-lg font-semibold">
                    {subscription.subscription.current_period_end &&
                      new Date(
                        subscription.subscription.current_period_end,
                      ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Plan Limits Summary */}
            {subscription?.subscription?.plan_limits && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">
                  Plan Limits
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Workspaces</p>
                    <p className="text-2xl font-bold">
                      {subscription?.subscription?.plan_limits
                        ?.max_workspaces === -1
                        ? "∞"
                        : subscription?.subscription?.plan_limits
                            ?.max_workspaces}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Topics</p>
                    <p className="text-2xl font-bold">
                      {subscription?.subscription?.plan_limits?.max_topics ===
                      -1
                        ? "∞"
                        : subscription?.subscription?.plan_limits?.max_topics}
                    </p>
                  </div>
                  {/* <div>
                    <p className="text-sm text-muted-foreground">
                      Knowledge Items
                    </p>
                    <p className="text-2xl font-bold">
                      {subscription?.subscription?.plan_limits
                        ?.max_knowledge_items === -1
                        ? "∞"
                        : subscription?.subscription?.plan_limits
                            ?.max_knowledge_items}
                    </p>
                  </div> */}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      API Calls/Month
                    </p>
                    <p className="text-2xl font-bold">
                      {subscription?.subscription?.plan_limits
                        ?.max_api_calls_per_month === -1
                        ? "∞"
                        : subscription?.subscription?.plan_limits?.max_api_calls_per_month?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
