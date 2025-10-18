"use client";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
      ? selectedPlan.monthly_price > currentPlan.monthly_price
      : selectedPlan.yearly_price > currentPlan.yearly_price);

  const isDowngrade =
    selectedPlan &&
    currentPlan &&
    (currentBillingPeriod === BillingPeriod.MONTHLY
      ? selectedPlan.monthly_price < currentPlan.monthly_price
      : selectedPlan.yearly_price < currentPlan.yearly_price);

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
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (plan: SubscriptionPlan | undefined) => {
    if (!plan) return "";
    if (currentBillingPeriod === BillingPeriod.MONTHLY) {
      return `$${plan.monthly_price.toFixed(2)}/month`;
    }
    return `$${plan.yearly_price.toFixed(2)}/year`;
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
          <RadioGroup
            value={selectedPlanId}
            onValueChange={setSelectedPlanId}
            className="space-y-3"
          >
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = plan.id === selectedPlanId;
              const planIsUpgrade =
                currentBillingPeriod === BillingPeriod.MONTHLY
                  ? plan.monthly_price > (currentPlan?.monthly_price || 0)
                  : plan.yearly_price > (currentPlan?.yearly_price || 0);
              const planIsDowngrade =
                currentBillingPeriod === BillingPeriod.MONTHLY
                  ? plan.monthly_price < (currentPlan?.monthly_price || 0)
                  : plan.yearly_price < (currentPlan?.yearly_price || 0);

              return (
                <button
                  type="button"
                  key={plan.id}
                  className={`relative flex items-start space-x-3 rounded-lg border p-4 transition-colors w-full text-left ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${isCurrent ? "opacity-50" : "cursor-pointer"}`}
                  onClick={() => !isCurrent && setSelectedPlanId(plan.id)}
                  disabled={isCurrent}
                >
                  <RadioGroupItem
                    value={plan.id}
                    id={plan.id}
                    disabled={isCurrent}
                    className="mt-1"
                  />
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
                        {plan.limits.max_workspaces === -1
                          ? "Unlimited workspaces"
                          : `${plan.limits.max_workspaces} workspaces`}
                      </li>
                      <li className="text-sm flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        {plan.limits.max_topics_per_workspace === -1
                          ? "Unlimited topics per workspace"
                          : `${plan.limits.max_topics_per_workspace} topics per workspace`}
                      </li>
                      <li className="text-sm flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        {plan.limits.ai_requests_per_month === -1
                          ? "Unlimited AI requests"
                          : `${plan.limits.ai_requests_per_month} AI requests/month`}
                      </li>
                    </ul>
                  </div>
                </button>
              );
            })}
          </RadioGroup>

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
