"use client";

/**
 * Checkout Success Page
 *
 * Displays a success message after completing a subscription checkout.
 * Fetches updated subscription status and shows plan details.
 *
 * @module app/checkout/success
 */

import confetti from "canvas-confetti";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import { useSubscriptionStore } from "@/stores/subscription-store";
import {
  READY_STATUSES,
  useSubscriptionSync,
} from "@/hooks/use-subscription-sync";
import { analytics } from "@/lib/analytics";
import type { Route } from "next";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [syncTimedOut, setSyncTimedOut] = useState(false);
  const { subscription } = useSubscriptionStore();

  const { waitForSubscriptionSync } = useSubscriptionSync();

  // Get query parameters from LemonSqueezy redirect
  const checkoutId = searchParams.get("checkout_id");
  const sessionId = searchParams.get("session_id");

  // Track subscription purchased once the subscription status is confirmed
  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current) return;
    if (!subscription?.subscription) return;
    const status = subscription.subscription.status ?? "";
    if (!READY_STATUSES.has(status)) return;

    trackedRef.current = true;
    analytics.track("subscription_purchased", {
      plan_name: subscription.subscription.plan_display_name ?? undefined,
      billing_period: subscription.subscription.billing_period ?? undefined,
      status,
      checkout_id: checkoutId ?? undefined,
      session_id: sessionId ?? undefined,
    });
  }, [subscription, checkoutId, sessionId]);

  // Trigger confetti
  useEffect(() => {
    const triggerConfetti = () => {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    };

    // Delay confetti slightly for better UX
    const timeout = setTimeout(triggerConfetti, 500);
    return () => clearTimeout(timeout);
  }, []);

  // Fetch updated subscription after checkout using bounded polling
  useEffect(() => {
    const controller = new AbortController();

    const refreshSubscription = async () => {
      try {
        setIsRefreshing(true);
        setSyncTimedOut(false);
        const synced = await waitForSubscriptionSync(controller.signal);
        if (!synced && !controller.signal.aborted) {
          setSyncTimedOut(true);
        }
      } catch {
        // Keep page usable even if polling fails
      } finally {
        if (!controller.signal.aborted) {
          setIsRefreshing(false);
        }
      }
    };

    refreshSubscription();
    return () => controller.abort();
  }, [waitForSubscriptionSync]);
  const handleGoToDashboard = () => {
    router.push("/" as Route);
  };

  const handleViewBilling = () => {
    router.push("/settings/subscription" as Route);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 relative">
            <div className="absolute inset-0 animate-ping">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto opacity-20" />
            </div>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto relative" />
          </div>

          <CardTitle className="text-3xl font-bold">
            Welcome to Your Subscription!
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Your payment was successful and your subscription is now active.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subscription Details */}
          {isRefreshing ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Activating your subscription...</span>
            </div>
          ) : subscription?.subscription ? (
            <div className="bg-muted/50 rounded-md p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {subscription?.subscription.plan_display_name}
                    {subscription?.subscription.status === "trial" && (
                      <Badge variant="secondary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Trial
                      </Badge>
                    )}
                    {subscription?.subscription.status === "active" && (
                      <Badge variant="default" className="bg-green-500">
                        Active
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Billing period:{" "}
                    <span className="font-medium capitalize">
                      {subscription?.subscription.billing_period}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {subscription?.subscription.start_date
                      ? new Date(
                          subscription?.subscription.start_date,
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                {subscription?.subscription.trial_end_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trial Ends</p>
                    <p className="font-medium">
                      {new Date(
                        subscription?.subscription.trial_end_date,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>Your subscription is being activated...</p>
              {syncTimedOut ? (
                <p className="text-sm mt-2">
                  Activation is taking longer than expected. You can continue
                  and check your billing page in a moment.
                </p>
              ) : (
                <p className="text-sm mt-2">
                  This may take a few moments. Please check your billing
                  settings.
                </p>
              )}
            </div>
          )}

          {/* Transaction Info */}
          {(checkoutId || sessionId) && (
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Reference:{" "}
                <code className="bg-muted px-2 py-1 rounded-md text-xs">
                  {sessionId || checkoutId}
                </code>
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-4 space-y-2">
            <h4 className="font-semibold text-sm">What's Next?</h4>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>
                  You'll receive a confirmation email with your subscription
                  details
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>
                  Your subscription features are now active and ready to use
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>
                  Manage your subscription anytime from your billing settings
                </span>
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={handleGoToDashboard} className="flex-1">
            Go to Dashboard
          </Button>
          <Button
            onClick={handleViewBilling}
            variant="outline"
            className="flex-1"
          >
            View Billing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
