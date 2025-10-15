"use client";

import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Workspace Billing Settings Page
 *
 * Manages:
 * - Current subscription plan
 * - Usage vs limits
 * - Plan upgrades/downgrades
 * - Payment methods
 * - Billing history
 *
 * NOTE: This is a placeholder. Full implementation will be completed in Phase 4.
 */
export default function WorkspaceBillingSettings() {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Billing management will be implemented in{" "}
          <strong>Phase 4: Subscription & Billing Management</strong>.
        </AlertDescription>
      </Alert>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your workspace subscription plan and billing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon: View and manage your subscription plan
          </p>
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>
            Monitor your resource usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon: Real-time usage tracking and limit monitoring
          </p>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage credit cards and payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon: Add, update, and remove payment methods
          </p>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View past invoices and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon: Download invoices and view payment history
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
