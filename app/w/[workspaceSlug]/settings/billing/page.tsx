"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Clock,
  CreditCard,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { useWorkspace } from "@/providers/workspace-provider";
import type {
  TrialStatus,
  UsageStats,
  UserSubscription,
} from "@/types/subscription";

/**
 * Workspace Billing Settings Page
 *
 * Displays:
 * - Current subscription plan details
 * - Usage vs limits with progress bars
 * - Trial status (if applicable)
 * - Quick actions (upgrade, manage)
 */
export default function WorkspaceBillingSettings() {
  const { workspace } = useWorkspace();

  // Fetch current subscription
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useQuery<UserSubscription>({
    queryKey: ["subscription"],
    queryFn: () => apiClient.subscriptions.getCurrentPlan(),
  });

  // Fetch usage stats
  const { data: usage, isLoading: usageLoading } = useQuery<UsageStats>({
    queryKey: ["usage"],
    queryFn: () => apiClient.subscriptions.getUsageStats(),
    enabled: !!subscription,
  });

  // Fetch trial status
  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ["trial-status"],
    queryFn: () => apiClient.subscriptions.getTrialStatus(),
    enabled: !!subscription,
  });

  const formatLimit = (limit: number | null | undefined): string => {
    if (limit === null || limit === undefined || limit < 0) return "Unlimited";
    return limit.toLocaleString();
  };

  const calculatePercentage = (
    current: number | undefined,
    max: number | null | undefined,
  ): number => {
    if (!current) return 0;
    if (max === null || max === undefined || max < 0) return 0; // Unlimited
    return Math.min(Math.round((current / max) * 100), 100);
  };

  const isUnlimited = (limit: number | null | undefined): boolean => {
    return limit === null || limit === undefined || limit < 0;
  };

  if (subscriptionError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to load subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(subscriptionError as Error).message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscriptionLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isTrial = subscription?.status === "trial";
  const isActive = subscription?.status === "active";

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {isTrial && trialStatus && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Clock className="h-5 w-5" />
              Trial Period Active
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              You have {trialStatus.days_remaining} days remaining in your
              trial. Upgrade to continue using all features after your trial
              ends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pricing">
              <Button variant="default">View Plans</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>
              Your active subscription for {workspace?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">
                  {subscription?.plan_display_name || "Free"}
                </span>
                <Badge
                  variant={
                    isActive ? "default" : isTrial ? "secondary" : "outline"
                  }
                >
                  {subscription?.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription?.billing_period === "monthly"
                  ? "Billed monthly"
                  : subscription?.billing_period === "yearly"
                    ? "Billed annually"
                    : "Free forever"}
              </p>
            </div>

            <Separator />

            {subscription?.start_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Started</span>
                <span>
                  {new Date(subscription.start_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {subscription?.end_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {subscription.status === "cancelled" ? "Ends" : "Renews"}
                </span>
                <span>
                  {new Date(subscription.end_date).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <Link href="/pricing">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Change Plan
                </Button>
              </Link>
              <Link href="/settings/subscription">
                <Button variant="ghost" className="w-full">
                  View Full Billing Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Usage & Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Usage & Limits
            </CardTitle>
            <CardDescription>
              Monitor your resource usage this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : usage ? (
              <div className="space-y-4">
                {/* Workspaces */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Workspaces</span>
                    <span className="text-sm text-muted-foreground">
                      {usage.current_workspaces} /{" "}
                      {formatLimit(usage.max_workspaces)}
                    </span>
                  </div>
                  {!isUnlimited(usage.max_workspaces) && (
                    <Progress
                      value={calculatePercentage(
                        usage.current_workspaces,
                        usage.max_workspaces,
                      )}
                      className="h-2"
                    />
                  )}
                </div>

                {/* Topics */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Topics</span>
                    <span className="text-sm text-muted-foreground">
                      {usage.current_topics} / {formatLimit(usage.max_topics)}
                    </span>
                  </div>
                  {!isUnlimited(usage.max_topics) && (
                    <Progress
                      value={calculatePercentage(
                        usage.current_topics,
                        usage.max_topics,
                      )}
                      className="h-2"
                    />
                  )}
                </div>

                {/* Knowledge Items */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Knowledge Items</span>
                    <span className="text-sm text-muted-foreground">
                      {usage.current_knowledge_items} /{" "}
                      {formatLimit(usage.max_knowledge_items)}
                    </span>
                  </div>
                  {!isUnlimited(usage.max_knowledge_items) && (
                    <Progress
                      value={calculatePercentage(
                        usage.current_knowledge_items,
                        usage.max_knowledge_items,
                      )}
                      className="h-2"
                    />
                  )}
                </div>

                {/* API Calls */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">API Calls</span>
                    <span className="text-sm text-muted-foreground">
                      {usage.current_api_calls?.toLocaleString()} /{" "}
                      {formatLimit(usage.max_api_calls_per_month)}
                    </span>
                  </div>
                  {!isUnlimited(usage.max_api_calls_per_month) && (
                    <Progress
                      value={calculatePercentage(
                        usage.current_api_calls,
                        usage.max_api_calls_per_month,
                      )}
                      className="h-2"
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Resets on{" "}
                    {usage.usage_reset_date
                      ? new Date(usage.usage_reset_date).toLocaleDateString()
                      : "monthly"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No usage data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Included */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>
            What's included in your current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Workspace Collaboration</p>
                <p className="text-xs text-muted-foreground">
                  Invite team members and collaborate
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Knowledge Management</p>
                <p className="text-xs text-muted-foreground">
                  Organize and search your content
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Topic Organization</p>
                <p className="text-xs text-muted-foreground">
                  Structure your content with topics
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">API Access</p>
                <p className="text-xs text-muted-foreground">
                  Integrate with your applications
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
