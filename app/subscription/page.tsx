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
import { Footer } from "@/components/layout/footer";
import { PageLayout } from "@/components/page-layout";
import { CancelSubscriptionModal } from "@/components/subscription/cancel-subscription-modal";
import { CustomerPortalButton } from "@/components/subscription/customer-portal-button";
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
import {
  LemonSqueezyBadge,
  PaymentSecurityMessage,
} from "@/components/ui/security-badge";
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
 * **Permission Required:** `subscription.read` (Owner-only)
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
  const { subscription, usage, fetchSubscription, fetchUsage } =
    useSubscriptionStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [planChangeModalOpen, setPlanChangeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

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

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Subscription" },
  ];

  if (loading) {
    return (
      <PageLayout
        title="Subscription Management"
        description="Manage your subscription, view usage, and access billing"
        breadcrumbs={breadcrumbs}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading subscription...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!subscription) {
    return (
      <PageLayout
        title="Subscription Management"
        description="Manage your subscription, view usage, and access billing"
        breadcrumbs={breadcrumbs}
      >
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              You don't have an active subscription yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Choose a plan to get started with all the features of REXT.
            </p>
            <Button onClick={() => router.push("/pricing")}>
              View Pricing Plans
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const isTrial = subscription.status === SubscriptionStatus.TRIAL;
  const canChangePlan =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIAL;
  const canCancel =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIAL;

  // NOTE: This page is protected by middleware (see middleware.ts)
  // No need for PermissionGuard wrapper as middleware already validates subscription.read permission
  return (
    <PageLayout
      title="Subscription Management"
      description="Manage your subscription, view usage, and access billing"
      breadcrumbs={breadcrumbs}
    >
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

                <CustomerPortalButton
                  className="w-full justify-start"
                  variant="outline"
                >
                  Manage Billing
                </CustomerPortalButton>

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
              <CustomerPortalButton>Open Billing Portal</CustomerPortalButton>

              {/* Security Information */}
              <div className="pt-4 mt-4 border-t">
                <PaymentSecurityMessage variant="compact" />
              </div>
            </CardContent>
          </Card>

          <SubscriptionStatusCard />

          {/* Trust Badge */}
          <div className="flex justify-center pt-4">
            <LemonSqueezyBadge size="sm" />
          </div>
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

      {/* Footer with Policy Links */}
      <Footer variant="minimal" className="mt-12" />
    </PageLayout>
  );
}
