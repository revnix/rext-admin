"use client";

import {
  AlertCircle,
  CreditCard,
  FileText,
  Loader2,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/layout/footer";
import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { CustomerPortalButton } from "@/components/subscription/customer-portal-button";
import { InvoiceList } from "@/components/subscription/invoice-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  SecurityIndicators,
} from "@/components/ui/security-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscriptionStore } from "@/stores/subscription-store";

// Permission required for billing access
const BILLING_READ = "billing.read";

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
  const { subscription, invoices, fetchInvoices } = useSubscriptionStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchInvoices();
      } catch (_error) {
        toast.error("Failed to load billing information");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchInvoices]);

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Billing & Invoices" },
  ];

  // NOTE: This page is protected by middleware (see middleware.ts)
  // No need for PermissionGuard wrapper as middleware already validates billing.read permission

  if (loading) {
    return (
      <PageLayout
        title="Billing & Invoices"
        description="Manage your billing information and view invoice history"
        breadcrumbs={breadcrumbs}
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

  return (
    <PageLayout
        title="Billing & Invoices"
        description="Manage your billing information and view invoice history"
        breadcrumbs={breadcrumbs}
        actions={<CustomerPortalButton>Billing Portal</CustomerPortalButton>}
      >
        <div className="space-y-8">
          {/* Current Billing Cycle Info */}
          {subscription && (
            <Card>
              <CardHeader>
                <CardTitle>Current Billing Cycle</CardTitle>
                <CardDescription>
                  Your current subscription details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Plan
                    </p>
                    <p className="text-lg font-semibold">
                      {subscription.plan_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Billing Period
                    </p>
                    <p className="text-lg font-semibold capitalize">
                      {subscription.billing_period}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <p className="text-lg font-semibold capitalize">
                      {subscription.status}
                    </p>
                  </div>
                </div>

                {subscription.current_period_end && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Next billing date:{" "}
                      <span className="font-medium text-foreground">
                        {new Date(
                          subscription.current_period_end,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>
                      All your past invoices and receipts
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <InvoiceList />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No invoices yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your invoice history will appear here once you have a
                        paid subscription.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/pricing")}
                      >
                        View Pricing Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Information */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> All invoices are automatically sent to
                  your email address. You can also download them from the
                  billing portal or directly from the invoice links above.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Payment Method Tab */}
            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    To update your payment method, billing address, or other
                    billing details, please use our secure billing portal.
                  </p>

                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium mb-1">
                          Customer Billing Portal
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Securely manage all your billing information
                          including:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                          <li>Update payment method</li>
                          <li>Change billing address</li>
                          <li>Download invoices</li>
                          <li>View payment history</li>
                        </ul>
                      </div>
                    </div>

                    <CustomerPortalButton className="w-full">
                      Open Billing Portal
                    </CustomerPortalButton>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security:</strong> The billing portal is hosted by
                      LemonSqueezy, our secure payment processor. Your payment
                      information is encrypted and never stored on our servers.
                    </AlertDescription>
                  </Alert>

                  {/* Security Indicators */}
                  <div className="pt-4 mt-4 border-t">
                    <SecurityIndicators />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Accepted Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Credit & Debit Cards</p>
                        <p className="text-sm text-muted-foreground">
                          Visa, Mastercard, Amex
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <svg
                        className="h-8 w-8"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label="PayPal"
                      >
                        <title>PayPal</title>
                        <path
                          d="M20.067 8.478c.492.88.611 2.022.291 2.926-.267.71-.802 1.244-1.513 1.51-.345.13-.694.187-1.1.19l-1.507.007-1.503.003c-.85.003-1.7.007-2.55.013a.72.72 0 0 0-.736.777c.014.204.086.386.214.536.173.203.413.314.674.317l1.168.01 1.72.017c.526.004 1.051.01 1.577.01.345.004.681.077.998.216 1.546.68 2.133 2.734 1.168 4.117-.402.575-.964.963-1.64 1.164-.442.13-.896.173-1.35.173l-8.682-.01a.69.69 0 0 1-.644-.436.69.69 0 0 1 .15-.757.703.703 0 0 1 .494-.216l8.594.006c.628-.006 1.26-.05 1.869-.247.405-.13.743-.374.984-.733.495-.738.402-1.76-.19-2.379-.35-.366-.807-.553-1.293-.56l-1.87-.02-1.744-.014c-.417-.003-.834-.01-1.248-.023a2.326 2.326 0 0 1-1.804-.867 2.32 2.32 0 0 1-.474-1.947c.086-.422.284-.81.574-1.126.345-.378.78-.631 1.258-.757.228-.06.463-.09.697-.097l1.946-.02 1.102-.007a.69.69 0 0 1 .698.686.69.69 0 0 1-.698.699l-2.963.017c-.417.003-.83.15-1.151.417-.207.173-.366.386-.464.628-.16.395-.106.84.143 1.18.17.235.417.392.69.456.13.03.261.043.391.047l2.028.016 2.264.02c.627.007 1.248-.123 1.817-.374.543-.234.984-.63 1.258-1.15.38-.723.312-1.65-.166-2.305-.291-.398-.694-.681-1.154-.814a3.174 3.174 0 0 0-.971-.106l-3.986-.017-.77-.003a.69.69 0 0 1-.686-.7.69.69 0 0 1 .699-.698l4.649.02c.526.003 1.055.073 1.557.237.732.24 1.354.7 1.793 1.317Z"
                          fill="#253B80"
                        />
                      </svg>
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-sm text-muted-foreground">
                          Secure payments
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badge */}
                  <div className="flex justify-center mt-6 pt-6 border-t">
                    <LemonSqueezyBadge size="sm" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer with Policy Links */}
        <Footer variant="minimal" className="mt-12" />
      </PageLayout>
  );
}
