"use client";

import {
  AlertCircle,
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  Folder,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { Route } from "next";

interface UsageMetric {
  used: number;
  limit: number | null | undefined;
  percentage: number;
  unlimited: boolean;
}

interface UsageData {
  workspaces: UsageMetric;
  members: UsageMetric;
  topics: UsageMetric;
  knowledge_items: UsageMetric;
  api_calls: UsageMetric & { reset_date: string | null };
}

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    billing_period: string;
    start_date: string;
    end_date: string | null;
    cancelled_at: string | null;
  };
  plan: {
    id: string;
    name: string;
    display_name: string;
    price_monthly: number;
    price_yearly: number;
  };
  usage: UsageData;
}

function BillingDashboardContent() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!session?.user?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = resolveApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/v1/subscriptions/status`, {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      });
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (_error) {
      toast.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchSubscriptionStatus();
    }
  }, [session, fetchSubscriptionStatus]);

  // Show success message after checkout
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("🎉 Subscription activated successfully!");
      // Force refresh subscription data
      if (session?.user?.accessToken) {
        fetchSubscriptionStatus();
      }
      // Clean up URL
      router.replace("/settings/billing", { scroll: false });
    } else if (checkout === "cancelled") {
      toast.info("Checkout was cancelled");
      router.replace("/settings/billing", { scroll: false });
    }
  }, [searchParams, router, session, fetchSubscriptionStatus]);

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.",
      )
    ) {
      return;
    }

    if (!session?.user?.accessToken) {
      toast.error("Please log in to cancel subscription");
      return;
    }

    setCancelLoading(true);
    try {
      const apiUrl = resolveApiBaseUrl();
      const response = await fetch(
        `${apiUrl}/api/v1/subscriptions/cancel?at_period_end=true`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success(
          "Your subscription will be cancelled at the end of the billing period.",
        );
        fetchSubscriptionStatus();
      } else {
        throw new Error(
          result.error?.message || "Failed to cancel subscription",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cancellation Failed",
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!session?.user?.accessToken) {
      toast.error("Please log in to manage billing");
      return;
    }

    setPortalLoading(true);
    try {
      const apiUrl = resolveApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/v1/subscriptions/portal`, {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      });

      const result = await response.json();

      if (result.success && result.data?.portal_url) {
        window.open(result.data.portal_url, "_blank");
      } else {
        throw new Error(
          result.error?.message || "Failed to open billing portal",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to open billing portal",
      );
    } finally {
      setPortalLoading(false);
    }
  };

  const formatLimit = (
    limit: number | null | undefined,
    unlimited: boolean,
  ): string => {
    if (unlimited || limit === null || limit === undefined || limit < 0)
      return "Unlimited";
    return limit.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      active: { variant: "default", label: "Active" },
      trial: { variant: "secondary", label: "Trial" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      expired: { variant: "destructive", label: "Expired" },
      suspended: { variant: "destructive", label: "Suspended" },
    };

    const config = statusMap[status] || {
      variant: "outline" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Loading billing information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { subscription, plan, usage } = data || {};

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view usage, and update payment methods
        </p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                {subscription
                  ? "Your active subscription details"
                  : "You are on the free plan"}
              </CardDescription>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription && plan ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-2xl font-bold">{plan.display_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">
                    $
                    {subscription.billing_period === "monthly"
                      ? plan.price_monthly
                      : plan.price_yearly}
                    <span className="text-sm font-normal text-muted-foreground">
                      /
                      {subscription.billing_period === "monthly"
                        ? "month"
                        : "year"}
                    </span>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {subscription.start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Started
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(subscription.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {subscription.current_period_end && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {subscription.cancel_at_period_end ? "Ends" : "Renews"}
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(
                        subscription.current_period_end,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {subscription.cancel_at_period_end && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Subscription Cancelled</AlertTitle>
                  <AlertDescription>
                    Your subscription will end on{" "}
                    {subscription.current_period_end
                      ? new Date(
                        subscription.current_period_end,
                      ).toLocaleDateString()
                      : "N/A"}
                    . You can reactivate it anytime before this date.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Free Plan</AlertTitle>
              <AlertDescription>
                You're currently on the free plan with limited features.
                <Button
                  variant="link"
                  className="px-1"
                  onClick={() => router.push("/pricing" as Route)}
                >
                  Upgrade to unlock more
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {subscription ? (
            <>
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={portalLoading}
              >
                {portalLoading ? "Loading..." : "Manage Billing"}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="default"
                onClick={() => setShowPlans(!showPlans)}
              >
                {showPlans ? "Hide Plans" : "Change Plan"}
              </Button>
              {!subscription.cancel_at_period_end && (
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => router.push("/pricing" as Route)}>
                View Plans
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPlans(!showPlans)}
              >
                {showPlans ? "Hide Plans" : "Compare Plans"}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Usage Metrics */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Metrics
            </CardTitle>
            <CardDescription>
              Your current usage across all workspaces and resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Workspaces */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Workspaces</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usage.workspaces?.used ?? 0} /{" "}
                  {formatLimit(
                    usage.workspaces?.limit,
                    usage.workspaces?.unlimited ?? false,
                  )}
                </span>
              </div>
              <Progress value={usage.workspaces?.percentage ?? 0} />
            </div>

            {/* Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Team Members</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usage.members?.used ?? 0} /{" "}
                  {formatLimit(usage.members?.limit, usage.members?.unlimited ?? false)}
                </span>
              </div>
              <Progress value={usage.members?.percentage ?? 0} />
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Topics</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usage.topics?.used ?? 0} /{" "}
                  {formatLimit(usage.topics?.limit, usage.topics?.unlimited ?? false)}
                </span>
              </div>
              <Progress value={usage.topics?.percentage ?? 0} />
            </div>

            {/* Knowledge Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Knowledge Items</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usage.knowledge_items?.used ?? 0} /{" "}
                  {formatLimit(
                    usage.knowledge_items?.limit,
                    usage.knowledge_items?.unlimited ?? false,
                  )}
                </span>
              </div>
              <Progress value={usage.knowledge_items?.percentage ?? 0} />
            </div>

            {/* API Calls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">API Calls</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {usage.api_calls?.used ?? 0} /{" "}
                    {formatLimit(
                      usage.api_calls?.limit,
                      usage.api_calls?.unlimited ?? false,
                    )}
                  </p>
                  {usage.api_calls?.reset_date && (
                    <p className="text-xs text-muted-foreground">
                      Resets{" "}
                      {new Date(
                        usage.api_calls.reset_date,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Progress value={usage.api_calls?.percentage ?? 0} />
            </div>

            {/* Upgrade Prompt */}
            {((usage.workspaces?.percentage ?? 0) > 80 ||
              (usage.api_calls?.percentage ?? 0) > 80 ||
              (usage.members?.percentage ?? 0) > 80) &&
              !subscription && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle>Approaching Limits</AlertTitle>
                  <AlertDescription>
                    You're approaching your usage limits. Consider upgrading
                    your plan for more resources.
                    <Button
                      variant="link"
                      className="px-1"
                      onClick={() => router.push("/pricing" as Route)}
                    >
                      View plans
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans Section */}
      {showPlans && (
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Compare plans and upgrade to unlock more features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Free Plan */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />1 Workspace
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />3 Team Members
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      10 Topics
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      100 Knowledge Items
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={!subscription}
                  >
                    Current Plan
                  </Button>
                </CardFooter>
              </Card>

              {/* Pro Plan */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pro</CardTitle>
                      <CardDescription>For growing teams</CardDescription>
                    </div>
                    <Badge>Popular</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />5 Workspaces
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      15 Team Members
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      100 Topics
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      1,000 Knowledge Items
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Priority Support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => router.push("/pricing" as Route)}
                  >
                    Upgrade to Pro
                  </Button>
                </CardFooter>
              </Card>

              {/* Enterprise Plan */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For large organizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">Custom</span>
                  </div>
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Unlimited Workspaces
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Unlimited Team Members
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Unlimited Topics
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Unlimited Knowledge
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Dedicated Support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push("/pricing" as Route)}
                  >
                    Contact Sales
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function BillingDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingDashboardContent />
    </Suspense>
  );
}
