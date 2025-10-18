"use client";

import {
  CreditCard,
  FileText,
  Loader2,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CancelSubscriptionModal } from "@/components/subscription/cancel-subscription-modal";
import { PlanChangeModal } from "@/components/subscription/plan-change-modal";
import { SubscriptionStatusCard } from "@/components/subscription/subscription-status-card";
import { TrialStatusBanner } from "@/components/subscription/trial-status-banner";
import { UsageMetrics } from "@/components/subscription/usage-metrics";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription-store";
import {
  type SubscriptionPlan,
  SubscriptionStatus,
} from "@/types/subscription";

/**
 * Subscription Management Dashboard Page
 *
 * Central hub for managing subscription, viewing usage, and accessing billing.
 *
 * Features:
 * - Current subscription status and details
 * - Usage metrics and progress bars
 * - Plan change functionality
 * - Cancellation flow
 * - Quick links to billing and invoices
 * - Trial status alerts
 */

export default function SubscriptionDashboardPage() {
  const router = useRouter();
  const { subscription, usage, fetchSubscription, fetchUsage, getPortalUrl } =
    useSubscriptionStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [planChangeModalOpen, setPlanChangeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const response = await apiClient.subscriptions.getPlans();
      if (response.plans) {
        const activePlans = response.plans.filter((plan) => plan.is_active);
        setPlans(activePlans);
      }
    } catch (_error) {}
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load subscription, usage, and available plans in parallel
        await Promise.all([fetchSubscription(), fetchUsage(), loadPlans()]);
      } catch (_error) {
        toast.error("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchSubscription, fetchUsage, loadPlans]);

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      const response = await getPortalUrl();
      window.open(response.portal_url, "_blank");
    } catch (_error) {
      toast.error("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              You don't have an active subscription yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Choose a plan to get started with all the features of WREXT.
            </p>
            <Button onClick={() => router.push("/pricing")}>
              View Pricing Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTrial = subscription.status === SubscriptionStatus.TRIAL;
  const canChangePlan =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIAL;
  const canCancel =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIAL;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view usage, and access billing.
        </p>
      </div>

      {/* Trial Banner */}
      {isTrial && <TrialStatusBanner showGlobally={false} />}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Usage</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Subscription Status */}
            <SubscriptionStatusCard />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canChangePlan && (
                  <Button
                    onClick={() => setPlanChangeModalOpen(true)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Change Plan
                  </Button>
                )}

                <Button
                  onClick={handleManageBilling}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Billing
                </Button>

                <Button
                  onClick={() => router.push("/dashboard/billing")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Invoices
                </Button>

                {canCancel && (
                  <Button
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Current Usage Summary */}
          {usage && (
            <Card>
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
                <CardDescription>
                  Current usage across your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsageMetrics />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Usage Metrics</CardTitle>
              <CardDescription>
                Monitor your resource usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageMetrics detailed={true} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need More Resources?</CardTitle>
              <CardDescription>
                Upgrade your plan to get higher limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you're reaching your plan limits, consider upgrading to a
                higher tier for more resources and advanced features.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.push("/pricing")}>
                  View All Plans
                </Button>
                {canChangePlan && (
                  <Button
                    onClick={() => setPlanChangeModalOpen(true)}
                    variant="outline"
                  >
                    Upgrade Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Management</CardTitle>
              <CardDescription>
                Manage your payment methods and billing details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Access the customer portal to update your payment method,
                billing address, and download invoices.
              </p>
              <Button onClick={handleManageBilling} disabled={portalLoading}>
                {portalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Open Billing Portal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <SubscriptionStatusCard />
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Your invoice history is available in the dedicated billing page.
              </p>
              <Button onClick={() => router.push("/dashboard/billing")}>
                <FileText className="mr-2 h-4 w-4" />
                View All Invoices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Change Modal */}
      {subscription && (
        <PlanChangeModal
          open={planChangeModalOpen}
          onOpenChange={setPlanChangeModalOpen}
          plans={plans}
          currentPlanId={subscription.plan_id}
          currentBillingPeriod={subscription.billing_period}
        />
      )}

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        currentPeriodEnd={subscription.current_period_end ?? null}
      />
    </div>
  );
}
