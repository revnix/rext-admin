"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { BillingPeriod, type SubscriptionPlan } from "@/types/subscription";

/**
 * Plan Change Modal Component
 *
 * Allows users to upgrade or downgrade their subscription plan.
 *
 * Features:
 * - Shows current plan
 * - Lists available plans with pricing
 * - Highlights upgrade vs downgrade
 * - Shows prorated amounts
 * - Confirms before making changes
 * - Handles loading and error states
 */

interface PlanChangeModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal is closed
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Available subscription plans
   */
  plans: SubscriptionPlan[];

  /**
   * Current plan ID
   */
  currentPlanId: string;

  /**
   * Current billing period
   */
  currentBillingPeriod: BillingPeriod;
}

export function PlanChangeModal({
  open,
  onOpenChange,
  plans,
  currentPlanId,
  currentBillingPeriod,
}: PlanChangeModalProps) {
  const { upgradeSubscription, downgradeSubscription, fetchSubscription } =
    useSubscriptionStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlanId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current and selected plans
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Determine if this is an upgrade or downgrade
  const isUpgrade =
    selectedPlan &&
    currentPlan &&
    (currentBillingPeriod === BillingPeriod.MONTHLY
      ? selectedPlan.price_monthly > currentPlan.price_monthly
      : selectedPlan.price_yearly > currentPlan.price_yearly);

  const isDowngrade =
    selectedPlan &&
    currentPlan &&
    (currentBillingPeriod === BillingPeriod.MONTHLY
      ? selectedPlan.price_monthly < currentPlan.price_monthly
      : selectedPlan.price_yearly < currentPlan.price_yearly);

  const handlePlanChange = async () => {
    if (!selectedPlan || selectedPlanId === currentPlanId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isUpgrade) {
        await upgradeSubscription(selectedPlanId);
        toast.success("Plan upgraded successfully!", {
          description: `You are now on the ${selectedPlan.name} plan.`,
        });
      } else if (isDowngrade) {
        await downgradeSubscription(selectedPlanId);
        toast.success("Plan downgrade scheduled", {
          description: `You will be moved to the ${selectedPlan.name} plan at the end of your current billing period.`,
        });
      }

      // Refresh subscription data
      await fetchSubscription();

      // Close modal
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to change plan";
      setError(errorMessage);
      toast.error("Failed to change plan", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => {
            void handlePlanChange();
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (plan: SubscriptionPlan | undefined) => {
    if (!plan) return "";
    if (currentBillingPeriod === BillingPeriod.MONTHLY) {
      return `$${plan.price_monthly.toFixed(2)}/month`;
    }
    return `$${plan.price_yearly.toFixed(2)}/year`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogDescription>
            Select a new plan to upgrade or downgrade your subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Plan Info */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold">{currentPlan?.name}</p>
              </div>
              <Badge variant="outline">{formatPrice(currentPlan)}</Badge>
            </div>
          </div>

          {/* Plan Selection */}
          <RadioGroupPrimitive.Root
            value={selectedPlanId}
            onValueChange={setSelectedPlanId}
            className="space-y-3"
          >
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = plan.id === selectedPlanId;
              const planIsUpgrade =
                currentBillingPeriod === BillingPeriod.MONTHLY
                  ? plan.price_monthly > (currentPlan?.price_monthly || 0)
                  : plan.price_yearly > (currentPlan?.price_yearly || 0);
              const planIsDowngrade =
                currentBillingPeriod === BillingPeriod.MONTHLY
                  ? plan.price_monthly < (currentPlan?.price_monthly || 0)
                  : plan.price_yearly < (currentPlan?.price_yearly || 0);

              return (
                <div
                  key={plan.id}
                  className={`relative flex items-start space-x-3 rounded-lg border p-4 transition-colors w-full ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${isCurrent ? "opacity-50" : ""}`}
                >
                  <RadioGroupPrimitive.Item
                    value={plan.id}
                    id={plan.id}
                    disabled={isCurrent}
                    className="mt-1 h-4 w-4 rounded-full border border-primary text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-current" />
                    </RadioGroupPrimitive.Indicator>
                  </RadioGroupPrimitive.Item>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={plan.id}
                        className={`font-semibold ${isCurrent ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {plan.name}
                        {isCurrent && (
                          <Badge variant="secondary" className="ml-2">
                            Current
                          </Badge>
                        )}
                        {planIsUpgrade && !isCurrent && (
                          <ArrowUpCircle className="inline ml-2 h-4 w-4 text-green-600" />
                        )}
                        {planIsDowngrade && !isCurrent && (
                          <ArrowDownCircle className="inline ml-2 h-4 w-4 text-orange-600" />
                        )}
                      </Label>
                      <span className="font-semibold">{formatPrice(plan)}</span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </p>
                    )}

                    {/* Key features */}
                    <ul className="mt-2 space-y-1">
                      <li className="text-sm flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        {plan.max_workspaces === -1
                          ? "Unlimited workspaces"
                          : `${plan.max_workspaces} workspaces`}
                      </li>
                      <li className="text-sm flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        {plan.max_topics === -1
                          ? "Unlimited topics"
                          : `${plan.max_topics} topics`}
                      </li>
                      <li className="text-sm flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        {plan.max_api_calls_per_month === -1
                          ? "Unlimited API requests"
                          : `${plan.max_api_calls_per_month} API requests/month`}
                      </li>
                    </ul>
                  </div>
                </div>
              );
            })}
          </RadioGroupPrimitive.Root>

          {/* Change Type Info */}
          {isUpgrade && (
            <Alert>
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Your account will be upgraded immediately and you'll be charged
                a prorated amount for the remainder of your billing period.
              </AlertDescription>
            </Alert>
          )}

          {isDowngrade && (
            <Alert>
              <ArrowDownCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                Your plan will be downgraded at the end of your current billing
                period. You'll continue to have access to your current features
                until then.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePlanChange}
            disabled={
              isLoading || selectedPlanId === currentPlanId || !selectedPlan
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isUpgrade ? (
              "Upgrade Now"
            ) : isDowngrade ? (
              "Schedule Downgrade"
            ) : (
              "Change Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
