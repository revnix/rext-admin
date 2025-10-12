"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, unknown>;
  max_workspaces: number | null;
  max_members_per_workspace: number | null;
  max_topics: number | null;
  max_knowledge_items: number | null;
  max_api_calls_per_month: number | null;
  is_active: boolean;
  is_public: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const fetchPlans = useCallback(async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:2024";
      const response = await fetch(
        `${apiUrl}/api/v1/subscriptions/plans/public`,
      );
      const data = await response.json();

      if (data.success && data.data && data.data.plans) {
        // Sort plans by price
        const sortedPlans = data.data.plans.sort(
          (a: SubscriptionPlan, b: SubscriptionPlan) => {
            const priceA =
              billingPeriod === "monthly" ? a.price_monthly : a.price_yearly;
            const priceB =
              billingPeriod === "monthly" ? b.price_monthly : b.price_yearly;
            return priceA - priceB;
          },
        );
        setPlans(sortedPlans);
      }
    } catch (_error) {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  }, [billingPeriod]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSubscribe = async (planId: string, _planName: string) => {
    setCheckoutLoading(planId);

    // Check if user is authenticated
    if (!session?.user?.accessToken) {
      toast.error("Please log in to subscribe");
      router.push("/login");
      setCheckoutLoading(null);
      return;
    }

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:2024";
      const response = await fetch(`${apiUrl}/api/v1/subscriptions/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_period: billingPeriod,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Redirect to checkout URL
        window.location.href = data.data.checkout_url;
      } else {
        throw new Error(
          data.error?.message || "Failed to create checkout session",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to start checkout process",
      );
    } finally {
      setCheckoutLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price.toFixed(2)}`;
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit < 0) return "Unlimited";
    return limit.toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Start free, scale as you grow. All plans include core features.
        </p>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-4">
          <Label
            htmlFor="billing-toggle"
            className={billingPeriod === "monthly" ? "font-semibold" : ""}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingPeriod === "yearly"}
            onCheckedChange={(checked) =>
              setBillingPeriod(checked ? "yearly" : "monthly")
            }
          />
          <Label
            htmlFor="billing-toggle"
            className={billingPeriod === "yearly" ? "font-semibold" : ""}
          >
            Yearly
          </Label>
          {billingPeriod === "yearly" && (
            <Badge variant="secondary" className="ml-2">
              Save 20%
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const price =
            billingPeriod === "monthly"
              ? plan.price_monthly
              : plan.price_yearly;
          const isRecommended =
            plan.name === "pro" || plan.name === "professional";
          const isFree = price === 0;

          return (
            <Card
              key={plan.id}
              className={`relative ${isRecommended ? "border-primary shadow-lg scale-105" : ""}`}
            >
              {isRecommended && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground">
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
                <CardDescription className="min-h-[40px]">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {formatPrice(price)}
                  </span>
                  {!isFree && (
                    <span className="text-muted-foreground">
                      /{billingPeriod === "monthly" ? "month" : "year"}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {formatLimit(plan.max_workspaces)} Workspaces
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {formatLimit(plan.max_members_per_workspace)} Members per
                      Workspace
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {formatLimit(plan.max_topics)} Topics
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {formatLimit(plan.max_knowledge_items)} Knowledge Items
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {formatLimit(plan.max_api_calls_per_month)} API
                      Calls/month
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isRecommended ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id, plan.name)}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === plan.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : isFree ? (
                    "Get Started Free"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          Have questions?{" "}
          <a href="/settings/billing" className="text-primary hover:underline">
            View billing dashboard
          </a>{" "}
          or contact support.
        </p>
      </div>
    </div>
  );
}
