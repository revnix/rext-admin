"use client";

/**
 * Checkout Cancel Page
 *
 * Displays a message when user cancels the checkout process.
 * Provides options to try again or contact support.
 *
 * @module app/checkout/cancel
 */

import { ArrowLeft, HelpCircle, Mail, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Route } from "next";

export default function CheckoutCancelPage() {
  const router = useRouter();

  const handleTryAgain = () => {
    router.push("/pricing" as Route);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleContactSupport = () => {
    // Update with your actual support email
    window.location.href =
      "mailto:support@wrext.com?subject=Subscription Checkout Issue";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-background to-red-50 dark:from-orange-950/20 dark:via-background dark:to-red-950/20">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse">
                <XCircle className="h-16 w-16 text-orange-500 mx-auto opacity-20" />
              </div>
              <XCircle className="h-16 w-16 text-orange-500 mx-auto relative" />
            </div>
          </div>

          <CardTitle className="text-3xl font-bold">
            Checkout Cancelled
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Your subscription checkout was not completed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              Don't worry - no charges have been made to your account. You can
              try again whenever you're ready.
            </AlertDescription>
          </Alert>

          {/* Reasons & Next Steps */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                Common Reasons for Cancellation
              </h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>You closed the checkout window</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>You decided to review the plan details again</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>There was a payment method issue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>You're not ready to subscribe yet</span>
                </li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">What Happens Next?</h4>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">→</span>
                  <span>
                    You can try subscribing again anytime from our pricing page
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">→</span>
                  <span>
                    Your account remains active with your current plan (if any)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">→</span>
                  <span>
                    No charges were made - you can restart the process anytime
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Support Section */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Need Help?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              If you experienced technical difficulties or have questions about
              our plans, we're here to help!
            </p>
            <Button
              onClick={handleContactSupport}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleGoBack} variant="outline" className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={handleTryAgain} className="flex-1">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
