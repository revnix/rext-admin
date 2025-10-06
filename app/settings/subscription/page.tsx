"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Clock,
  CreditCard,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
  formatLimit,
  isSubscriptionActive,
  isUnlimited,
  type SubscriptionHistoryEntry,
  type SubscriptionPlan,
  SubscriptionStatus,
  type TrialStatus,
  type UsageStats,
  type UserSubscription,
} from "@/types/subscription";

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [showPlans, setShowPlans] = useState(false);

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

  // Fetch subscription history
  const { data: history } = useQuery<{
    subscriptions: SubscriptionHistoryEntry[];
  }>({
    queryKey: ["subscription-history"],
    queryFn: () => apiClient.subscriptions.getHistory(10, 0),
  });

  // Fetch available plans
  const { data: plansData } = useQuery<{
    plans: SubscriptionPlan[];
  }>({
    queryKey: ["subscription-plans"],
    queryFn: apiClient.subscriptions.getPlans,
    enabled: showPlans,
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) => apiClient.subscriptions.cancel({ reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription cancelled", {
        description:
          "Your subscription will remain active until the end of your billing period.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to cancel subscription", {
        description: error.message,
      });
    },
  });

  if (subscriptionError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Subscription & Billing</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, usage, and billing
          </p>
        </div>

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
            <Button
              className="mt-4"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["subscription"] })
              }
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscriptionLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Subscription & Billing</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, usage, and billing
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Subscription & Billing</h2>
          <p className="text-sm text-muted-foreground">
            No active subscription found
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Choose a plan to unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowPlans(true)}>View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = isSubscriptionActive(subscription);
  const statusColor =
    subscription.status === SubscriptionStatus.ACTIVE
      ? "text-green-600"
      : subscription.status === SubscriptionStatus.TRIAL
        ? "text-blue-600"
        : "text-gray-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Subscription & Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, usage, and billing
        </p>
      </div>

      {/* Trial Banner */}
      {trialStatus?.is_in_trial && !trialStatus.trial_expired && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock className="h-5 w-5" />
              Trial Period Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {trialStatus.days_remaining} days remaining in your free trial
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {subscription.plan_display_name || subscription.plan_name}
                </span>
                <span
                  className={`text-sm font-medium capitalize ${statusColor}`}
                >
                  {subscription.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {subscription.billing_period} billing
              </p>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date:</span>
                <span>
                  {new Date(subscription.start_date).toLocaleDateString()}
                </span>
              </div>
              {subscription.trial_end_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial Ends:</span>
                  <span>
                    {new Date(subscription.trial_end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.cancelled_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelled:</span>
                  <span className="text-destructive">
                    {new Date(subscription.cancelled_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowPlans(!showPlans)}
              >
                {showPlans ? "Hide Plans" : "Change Plan"}
              </Button>
              {isActive && !subscription.cancelled_at && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to cancel your subscription?",
                      )
                    ) {
                      const reason = window.prompt(
                        "Reason for cancellation (optional):",
                      );
                      cancelMutation.mutate(reason || "");
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        {usage && !usageLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage Overview
              </CardTitle>
              <CardDescription>Current usage vs plan limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Workspaces */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Workspaces</span>
                  <span className="text-muted-foreground">
                    {usage.current_workspaces} /{" "}
                    {formatLimit(usage.max_workspaces)}
                  </span>
                </div>
                {!isUnlimited(usage.max_workspaces) && (
                  <Progress
                    value={usage.workspaces_usage_percent}
                    className="h-2"
                  />
                )}
              </div>

              {/* Topics */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Topics</span>
                  <span className="text-muted-foreground">
                    {usage.current_topics} / {formatLimit(usage.max_topics)}
                  </span>
                </div>
                {!isUnlimited(usage.max_topics) && (
                  <Progress
                    value={usage.topics_usage_percent}
                    className="h-2"
                  />
                )}
              </div>

              {/* Knowledge Items */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Knowledge Items</span>
                  <span className="text-muted-foreground">
                    {usage.current_knowledge_items} /{" "}
                    {formatLimit(usage.max_knowledge_items)}
                  </span>
                </div>
                {!isUnlimited(usage.max_knowledge_items) && (
                  <Progress
                    value={usage.knowledge_items_usage_percent}
                    className="h-2"
                  />
                )}
              </div>

              {/* API Calls */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>API Calls (Monthly)</span>
                  <span className="text-muted-foreground">
                    {usage.current_api_calls.toLocaleString()} /{" "}
                    {formatLimit(usage.max_api_calls_per_month)}
                  </span>
                </div>
                {!isUnlimited(usage.max_api_calls_per_month) && (
                  <Progress
                    value={usage.api_calls_usage_percent}
                    className="h-2"
                  />
                )}
              </div>

              <Separator />

              <p className="text-xs text-muted-foreground">
                Resets on{" "}
                {new Date(usage.usage_reset_date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Available Plans */}
      {showPlans && plansData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Plans</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {plansData.plans
              .filter((plan) => plan.is_public && plan.is_active)
              .map((plan) => {
                const isCurrent = plan.id === subscription.plan_id;
                return (
                  <Card
                    key={plan.id}
                    className={isCurrent ? "border-primary" : ""}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{plan.display_name}</span>
                        {isCurrent && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <span className="text-3xl font-bold">
                            ${plan.price_monthly}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                          {plan.price_yearly > 0 && (
                            <p className="text-sm text-muted-foreground">
                              or ${plan.price_yearly}/year
                            </p>
                          )}
                        </div>

                        <Separator />

                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            {formatLimit(plan.max_workspaces)} workspaces
                          </li>
                          <li className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            {formatLimit(plan.max_topics)} topics
                          </li>
                          <li className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            {formatLimit(plan.max_knowledge_items)} knowledge
                            items
                          </li>
                          <li className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            {formatLimit(plan.max_api_calls_per_month)} API
                            calls/mo
                          </li>
                        </ul>

                        <Button
                          className="w-full"
                          variant={isCurrent ? "outline" : "default"}
                          disabled={isCurrent}
                        >
                          {isCurrent ? "Current Plan" : "Upgrade"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Subscription History */}
      {history && history.subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>Your past subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.subscriptions.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {entry.plan_display_name || entry.plan_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.start_date).toLocaleDateString()} -{" "}
                      {entry.end_date
                        ? new Date(entry.end_date).toLocaleDateString()
                        : "Present"}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium capitalize ${
                      entry.status === SubscriptionStatus.ACTIVE
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
