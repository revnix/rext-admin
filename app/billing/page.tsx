"use client";

import {
  AlertCircle,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/layout/footer";
import { PageLayout } from "@/components/page-layout";
import { CustomerPortalButton } from "@/components/subscription/customer-portal-button";
import { InvoiceList } from "@/components/subscription/invoice-list";
import { PurchaseHistory } from "@/components/subscription/purchase-history";
import { PlanChangeModal } from "@/components/subscription/plan-change-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { SecurityIndicators } from "@/components/ui/security-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBillingActions } from "@/hooks/use-billing-actions";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { BillingPeriod, SubscriptionStatus } from "@/types/subscription";
import type { Route } from "next";

/**
 * Billing History Page
 *
 * Displays invoice history and billing information.
 *
 * **Permission Required:** `billing.read` (Owner-only)
 *
 * Features:
 * - Complete invoice history
 * - Download invoices
 * - Current billing cycle info
 * - Payment method management
 * - Billing address management
 */

export default function BillingHistoryPage() {
  const router = useRouter();
  const { subscription, invoices, fetchInvoices, plans, fetchPlans } =
    useSubscriptionStore();
  const {
    openTaxDetails,
    isLoading: billingActionsLoading,
    hasBillingAccount,
    cardBrandLabel,
    cardLastFour,
  } = useBillingActions();
  const [loading, setLoading] = useState(true);
  const [isPlanChangeOpen, setIsPlanChangeOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.allSettled([fetchInvoices(), fetchPlans()]);
      } catch (_error) {
        toast.error("Failed to load billing information");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchInvoices, fetchPlans]);

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

  // NOTE: This page is protected by middleware (see middleware.ts)
  // No need for PermissionGuard wrapper as middleware already validates billing.read permission

  if (loading) {
    return (
      <PageLayout
        title="Billing & Invoices"
        description="Manage your billing information and view invoice history"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              Loading billing information...
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const subDetail = subscription?.subscription;

  return (
    <PageLayout
      title="Billing & Invoices"
      description="Manage your billing information and view invoice history"
      actions={
        <CustomerPortalButton className="w-full sm:w-auto">
          Billing Portal
        </CustomerPortalButton>
      }
    >
      <div className="space-y-8">
        {/* Current Plan Card (Top Summary) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {subDetail
                    ? subDetail.status === SubscriptionStatus.CANCELLED
                      ? "Cancelled Subscription"
                      : subDetail.status === SubscriptionStatus.EXPIRED
                      ? "Expired Subscription"
                      : "Current Plan"
                    : "No Active Subscription"}
                </CardTitle>
                <CardDescription>
                  {subDetail
                    ? subDetail.status === SubscriptionStatus.CANCELLED
                      ? "Your subscription has been cancelled"
                      : subDetail.status === SubscriptionStatus.EXPIRED
                      ? "Your subscription has expired"
                      : "Your active subscription plan details"
                    : "You don't have an active subscription yet"}
                </CardDescription>
              </div>
              {subDetail?.status && getStatusBadge(subDetail.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subDetail ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Plan
                  </p>
                  <p className="text-2xl font-bold capitalize">
                    {subDetail.plan_display_name ||
                      subDetail.plan_name ||
                      "Free Plan"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Billing Period
                  </p>
                  <p className="text-2xl font-bold capitalize">
                    {subDetail.billing_period || "Monthly"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {subDetail.cancelled_at ||
                    subDetail.status === SubscriptionStatus.CANCELLED
                      ? "Access Ends On"
                      : "Renews"}
                  </p>
                  <p className="text-base font-semibold">
                    {subDetail.current_period_end || subDetail.end_date
                      ? new Date(
                          (subDetail.current_period_end ||
                            subDetail.end_date)!,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Subscribe to a plan to unlock all features of REXT AI.
              </p>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button
              variant="default"
              onClick={() => {
                if (
                  !subDetail ||
                  subDetail.status === SubscriptionStatus.CANCELLED ||
                  subDetail.status === SubscriptionStatus.EXPIRED
                ) {
                  router.push("/pricing" as Route);
                } else {
                  if (plans.length === 0) {
                    fetchPlans();
                  }
                  setIsPlanChangeOpen(true);
                }
              }}
            >
              {!subDetail ||
              subDetail.status === SubscriptionStatus.CANCELLED ||
              subDetail.status === SubscriptionStatus.EXPIRED
                ? "Subscribe to Plan"
                : "Change Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Method
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            {/* Purchases come from our own orders table, so each row knows
                whether it can still be refunded. */}
            <Card>
              <CardHeader>
                <CardTitle>Your Purchases</CardTitle>
                <CardDescription>
                  Download a receipt for your past purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PurchaseHistory />
              </CardContent>
            </Card>

            {invoices.length > 0 ? (
              <InvoiceList />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>
                    All your past invoices and receipts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No invoices yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your invoice history will appear here once you have a paid
                      subscription.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => router.push("/pricing" as Route)}
                    >
                      View Pricing Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoice Information */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> All invoices are automatically sent to
                your email address. You can also download them from the billing
                portal or directly from the invoice links above.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Payment Method Tab */}
          <TabsContent value="payment" className="space-y-8">
            {/* 1. Payment Method Card */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Your payment method on file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-full">
                      <CreditCard className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-base flex items-center gap-2">
                        {hasBillingAccount
                          ? cardLastFour
                            ? `${cardBrandLabel ?? "Card"} •••• ${cardLastFour}`
                            : "Card on file"
                          : "No Saved Payment Method"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hasBillingAccount
                          ? "Card saved for future payments"
                          : "No active billing account"}
                      </p>
                    </div>
                  </div>

                  <CustomerPortalButton variant="outline">
                    Update Payment Method
                  </CustomerPortalButton>
                </div>
              </CardContent>
            </Card>

            {/* 4. Manage Billing Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border rounded-lg bg-muted/40">
              <div className="space-y-1">
                <h4 className="font-semibold">Customer Billing Portal</h4>
                <p className="text-sm text-muted-foreground">
                  Update billing addresses, tax numbers, and view complete
                  billing statements.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={openTaxDetails}
                disabled={billingActionsLoading || !hasBillingAccount}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            </div>

            {/* Security Indicators */}
            <div className="pt-4 border-t">
              <SecurityIndicators />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Plan Change Modal */}
      {plans.length > 0 && (
        <PlanChangeModal
          open={isPlanChangeOpen}
          onOpenChange={setIsPlanChangeOpen}
          plans={plans}
          currentPlanId={subDetail?.plan_id || plans[0]?.id || ""}
          currentBillingPeriod={
            subDetail?.billing_period || BillingPeriod.MONTHLY
          }
        />
      )}

      {/* Footer with Policy Links */}
      <Footer variant="minimal" className="mt-12" />
    </PageLayout>
  );
}
