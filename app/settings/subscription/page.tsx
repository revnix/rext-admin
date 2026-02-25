"use client";

import {
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { Route } from "next";

/**
 * Subscription Settings Page
 *
 * User-facing settings page for subscription management.
 * Provides quick access to all subscription-related features.
 *
 * Features:
 * - Current subscription overview
 * - Usage summary
 * - Customer portal access
 * - Quick links to billing and invoices
 * - Plan management
 */

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const { usage, fetchSubscription, fetchUsage, getPortalUrl } =
    useSubscriptionStore();
  const [portalLoading, setPortalLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Load subscription and usage data
    const loadData = async () => {
      try {
        setDataLoading(true);
        await Promise.all([fetchSubscription(), fetchUsage()]);
      } catch (_error) {
        toast.error("Failed to load subscription data");
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, [fetchSubscription, fetchUsage]);

  const handleOpenPortal = async () => {
    try {
      setPortalLoading(true);
      const response = await getPortalUrl();
      window.open(response.portal_url, "_blank");
    } catch (_error) {
      toast.error("Failed to open billing portal", {
        description: "Please try again or contact support.",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Subscription & Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, view usage, and access billing portal
        </p>
      </div>

      {/* Trial Banner */}
      <TrialStatusBanner showGlobally={false} />

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Subscription */}
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
            {/* Full Subscription Dashboard */}
            <Button
              onClick={() => router.push("/dashboard/subscription" as Route)}
              className="w-full justify-start"
              variant="outline"
            >
              <Settings className="mr-2 h-4 w-4" />
              Subscription Dashboard
            </Button>

            {/* Billing Portal */}
            <Button
              onClick={handleOpenPortal}
              className="w-full justify-start"
              variant="outline"
              disabled={portalLoading}
            >
              {portalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Portal...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Billing Portal
                </>
              )}
            </Button>

            {/* Invoices */}
            <Button
              onClick={() => router.push("/dashboard/billing" as Route)}
              className="w-full justify-start"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              View Invoices
            </Button>

            {/* Pricing */}
            <Button
              onClick={() => router.push("/pricing" as Route)}
              className="w-full justify-start"
              variant="outline"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View All Plans
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Overview */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>
              Current usage across all resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsageMetrics />
          </CardContent>
        </Card>
      )}

      {/* Billing Portal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Customer Billing Portal
          </CardTitle>
          <CardDescription>
            Manage all your billing information securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The billing portal is hosted by LemonSqueezy, our secure payment
            processor. You can manage the following:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-sm">Payment Methods</p>
              <p className="text-xs text-muted-foreground">
                Update credit cards and payment details
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-sm">Billing Address</p>
              <p className="text-xs text-muted-foreground">
                Change your billing information
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-sm">Invoices</p>
              <p className="text-xs text-muted-foreground">
                Download past invoices and receipts
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-medium text-sm">Payment History</p>
              <p className="text-xs text-muted-foreground">
                View all your past payments
              </p>
            </div>
          </div>

          <Separator />

          <Button
            onClick={handleOpenPortal}
            className="w-full sm:w-auto"
            disabled={portalLoading}
          >
            {portalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Billing Portal
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Your payment information is encrypted and never stored on our
            servers. All transactions are processed securely by LemonSqueezy.
          </p>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Get assistance with your subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Documentation</p>
              <p className="text-xs text-muted-foreground">
                Learn more about plans, billing, and features
              </p>
              <a
                href="/docs/pricing"
                className="text-xs text-primary hover:underline"
              >
                View documentation →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Billing Support</p>
              <p className="text-xs text-muted-foreground">
                Questions about billing or payments
              </p>
              <a
                href="mailto:billing@wrext.com"
                className="text-xs text-primary hover:underline"
              >
                Contact billing support →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
