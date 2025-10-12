"use client";

import { CheckCircle, CreditCard, Loader2, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Mock Checkout Page
 *
 * This simulates a payment provider checkout page for development/testing.
 * In production, users would be redirected to the actual payment provider (Stripe/LemonSqueezy).
 */
export default function MockCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [processing, setProcessing] = useState(false);

  const handleSuccess = async () => {
    setProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Call webhook to activate subscription
      const apiUrl =
        process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:2024";
      const response = await fetch(
        `${apiUrl}/api/v1/subscriptions/webhooks/mock/checkout-complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            success: true,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Payment successful! Your subscription is now active.");
        // Redirect to billing page with success message
        router.push(
          `/settings/billing?checkout=success&session_id=${sessionId}`,
        );
      } else {
        const errorMessage =
          result.error?.message || "Failed to activate subscription";

        // Check if it's a session not found error
        if (errorMessage.includes("session not found")) {
          toast.error(
            "Session expired. Please go back to pricing and try again.",
          );
          setTimeout(() => router.push("/pricing"), 2000);
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete checkout",
      );
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    toast.info("Checkout cancelled");
    router.push("/pricing?checkout=cancelled");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Mock Checkout</CardTitle>
          <CardDescription>
            This is a simulated checkout for development/testing purposes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session ID:</span>
              <span className="font-mono text-xs">{sessionId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Environment:</span>
              <span className="font-semibold text-amber-600">
                Mock / Development
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                In production, you would be on the payment provider's secure
                checkout page.
              </p>
              <p className="text-xs text-muted-foreground">
                No actual payment will be processed in this mock environment.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
              Testing Instructions
            </h4>
            <ul className="text-xs space-y-1 text-blue-800 dark:text-blue-200">
              <li>• Click "Complete Payment" to simulate successful payment</li>
              <li>• Click "Cancel" to simulate cancelled checkout</li>
              <li>
                • Your subscription will be activated immediately on success
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={processing}
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSuccess}
            disabled={processing}
            className="flex-1"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Payment
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
