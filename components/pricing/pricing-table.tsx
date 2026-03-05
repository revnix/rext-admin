"use client";

/**
 * Pricing Table Component
 *
 * Displays subscription plans in a professional pricing table with features,
 * pricing for different billing periods, and checkout buttons.
 *
 * @module components/pricing/pricing-table
 */

import { Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { CheckoutWithDiscount } from "@/components/subscription/checkout-with-discount";
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
import { cn } from "@/lib/utils";
import { useSubscriptionData } from "@/hooks/use-subscription-data";
import { BillingPeriod, type SubscriptionPlan } from "@/types/subscription";

export interface PricingTableProps {
  /** Additional CSS classes */
  className?: string;
  /** Show popular badge on a specific plan */
  popularPlanId?: string;
  /** Default billing period */
  defaultBillingPeriod?: BillingPeriod;
  /** Hide billing period toggle */
  hideBillingToggle?: boolean;
}

/**
 * Professional pricing table with plan features and checkout
 */
export function PricingTable({
  className,
  popularPlanId,
  defaultBillingPeriod = BillingPeriod.MONTHLY,
  hideBillingToggle = false,
}: PricingTableProps) {
  const [billingPeriod, setBillingPeriod] =
    useState<BillingPeriod>(defaultBillingPeriod);
  const { plans, subscription, refetchAll: fetchPlans, isLoading } = useSubscriptionData();

  const visiblePlans = plans.filter((plan) => plan.is_public && plan.is_active);

  // Fetch plans on mount
  useEffect(() => {
    if (plans.length === 0) {
      fetchPlans();
    }
  }, [fetchPlans, plans.length]);

  // Calculate yearly savings
  const getYearlySavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyTotal = plan.price_yearly;

    if (monthlyTotal <= 0 || yearlyTotal <= 0 || yearlyTotal >= monthlyTotal) {
      return { savings: 0, savingsPercent: 0 };
    }

    const savings = monthlyTotal - yearlyTotal;
    const savingsPercent = Math.round((savings / monthlyTotal) * 100);

    return { savings, savingsPercent };
  };

  const maxYearlySavingsPercent = visiblePlans.reduce((max, plan) => {
    const { savingsPercent } = getYearlySavings(plan);
    return savingsPercent > max ? savingsPercent : max;
  }, 0);

  // Get price based on billing period
  const getPrice = (plan: SubscriptionPlan) => {
    return billingPeriod === BillingPeriod.MONTHLY
      ? plan.price_monthly
      : plan.price_yearly;
  };

  // Check if plan is current
  const isCurrentPlan = (planId: string) => {
    return subscription?.plan_id === planId;
  };

  // Parse features from JSON
  const parseFeatures = (plan: SubscriptionPlan): string[] => {
    if (typeof plan.features === "object" && plan.features !== null) {
      // Check if features is an array
      if (Array.isArray(plan.features)) {
        return plan.features as string[];
      }
      // Check if features has a 'list' or 'items' property
      if ("list" in plan.features && Array.isArray(plan.features.list)) {
        return plan.features.list as string[];
      }
      if ("items" in plan.features && Array.isArray(plan.features.items)) {
        return plan.features.items as string[];
      }
      // Convert object values to array
      return Object.values(plan.features).filter(
        (v): v is string => typeof v === "string",
      );
    }
    return [];
  };

  if (isLoading && plans.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Billing Period Toggle */}
      {!hideBillingToggle && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
            <Button
              variant={
                billingPeriod === BillingPeriod.MONTHLY ? "default" : "ghost"
              }
              size="sm"
              onClick={() => setBillingPeriod(BillingPeriod.MONTHLY)}
              className="relative"
            >
              Monthly
            </Button>
            <Button
              variant={
                billingPeriod === BillingPeriod.YEARLY ? "default" : "ghost"
              }
              size="sm"
              onClick={() => setBillingPeriod(BillingPeriod.YEARLY)}
              className="relative"
            >
              Yearly
              {maxYearlySavingsPercent > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Save up to {maxYearlySavingsPercent}%
                </Badge>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {visiblePlans.map((plan) => {
          const features = parseFeatures(plan);
          const price = getPrice(plan);
          const { savingsPercent } = getYearlySavings(plan);
          const isPopular = plan.id === popularPlanId;
          const isCurrent = isCurrentPlan(plan.id);

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                isPopular && "border-primary shadow-lg scale-105",
                isCurrent && "border-green-500 dark:border-green-600",
              )}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700 dark:text-green-400"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
                {plan.description && (
                  <CardDescription>{plan.description}</CardDescription>
                )}

                {/* Pricing */}
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingPeriod === BillingPeriod.MONTHLY ? "mo" : "yr"}
                    </span>
                  </div>
                  {billingPeriod === BillingPeriod.YEARLY &&
                    savingsPercent > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                        Save {savingsPercent}% with yearly billing
                      </p>
                    )}
                </div>
              </CardHeader>

              <CardContent className="grow">
                {/* Features List */}
                <ul className="space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}

                  {/* Limits */}
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.max_workspaces === -1
                        ? "Unlimited"
                        : plan.max_workspaces}{" "}
                      workspace{plan.max_workspaces !== 1 ? "s" : ""}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.max_topics === -1
                        ? "Unlimited"
                        : plan.max_topics.toLocaleString()}{" "}
                      topic{plan.max_topics !== 1 ? "s" : ""}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.max_api_calls_per_month === -1
                        ? "Unlimited"
                        : plan.max_api_calls_per_month.toLocaleString()}{" "}
                      API calls/month
                    </span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : (
                  <CheckoutWithDiscount
                    plan={plan}
                    billingPeriod={billingPeriod}
                    variant={isPopular ? "default" : "outline"}
                    buttonText={`Subscribe to ${plan.display_name}`}
                    showDiscountByDefault={false}
                  />
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* No Plans Message */}
      {plans.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No subscription plans available at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
