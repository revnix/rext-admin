"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PlanGrid } from "@/components/billing/plan-grid";
import { SettingsGroup } from "@/components/settings/settings-group";
import { CancelSubscriptionModal } from "@/components/subscription/cancel-subscription-modal";
import { CustomerPortalButton } from "@/components/subscription/customer-portal-button";
import { PlanChangeModal } from "@/components/subscription/plan-change-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingActions } from "@/hooks/use-billing-actions";
import { HOLDS_A_PAID_PLAN, nextDate } from "./billing-format";
import { subscriptionQueries } from "@/lib/query-keys";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { BillingPeriod, SubscriptionStatus } from "@/types/subscription";

/** The subscription's status in words, and whether it's worth a tint. */
const STATUS: Record<
  string,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  active: { label: "Active", tone: "success" },
  trial: { label: "Trial", tone: "neutral" },
  past_due: { label: "Payment due", tone: "warning" },
  suspended: { label: "Suspended", tone: "danger" },
  paused: { label: "Paused", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
};

/**
 * Account settings, Plan (plans/app/F-billing.md F5): the plan the person is on and what happens
 * next; changing it, cancelling it, the card it's charged to and the tax details; and, without a
 * paid plan, the plans to choose from. Every figure is the backend's.
 */
export function PlanSection() {
  const queryClient = useQueryClient();
  const current = useQuery(subscriptionQueries.current());
  const credits = useQuery(subscriptionQueries.myCredits());
  const billing = useBillingActions();
  const fetchSubscription = useSubscriptionStore(
    (state) => state.fetchSubscription,
  );
  // The change dialog, the checkout baseline and the payment actions still read the subscription
  // store (#460 moves them to the queries): load it here too, so a fresh visit has them.
  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);
  const [changing, setChanging] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const heldStatus = current.data?.subscription?.status;
  // Loaded once a paid plan is known, so the change dialog opens on the list.
  const plans = useQuery({
    ...subscriptionQueries.plans(),
    enabled: Boolean(heldStatus && HOLDS_A_PAID_PLAN.has(heldStatus)),
  });

  // A change or a cancellation goes through the subscription store; the section reads the queries.
  const refreshAfter =
    (setOpen: (open: boolean) => void) => (open: boolean) => {
      setOpen(open);
      if (!open)
        void queryClient.invalidateQueries({
          queryKey: subscriptionQueries.all(),
        });
    };

  if (current.isPending) return <Skeleton className="h-40 w-full" />;
  if (current.isError) {
    return (
      <Notice
        tone="danger"
        title="Your plan didn't load"
        action={
          <Button variant="outline" size="sm" onClick={() => current.refetch()}>
            Try again
          </Button>
        }
      >
        Refresh the page, or try again in a moment.
      </Notice>
    );
  }

  const subscription = current.data?.subscription;
  const status = subscription?.status;
  const paid = Boolean(status && HOLDS_A_PAID_PLAN.has(status));
  const chooseFromGrid = !paid && status !== SubscriptionStatus.CANCELLED;
  const statusWords = status ? STATUS[status] : undefined;
  const allowance = credits.data?.credits_per_month;

  return (
    <div className="flex flex-col gap-10">
      <SettingsGroup title="Your plan">
        {status === SubscriptionStatus.PAST_DUE && (
          <Notice tone="warning" title="Your last payment didn't go through">
            Lemon Squeezy tries again over the next days. Update your payment
            method below to keep your plan.
          </Notice>
        )}
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            {subscription ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-section">
                    {subscription.plan_display_name ??
                      credits.data?.plan_name ??
                      "Your plan"}
                  </h3>
                  {statusWords && (
                    <Badge variant={statusWords.tone}>
                      {statusWords.label}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[
                    paid
                      ? subscription.billing_period === BillingPeriod.YEARLY
                        ? "Billed yearly."
                        : "Billed monthly."
                      : null,
                    allowance
                      ? `${allowance.toLocaleString()} credits ${
                          status === SubscriptionStatus.TRIAL
                            ? "for the trial"
                            : "a month"
                        }.`
                      : null,
                    nextDate(subscription),
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                {paid ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setChanging(true)}>
                      Change plan
                    </Button>
                    {status === SubscriptionStatus.ACTIVE && (
                      <Button
                        variant="outline"
                        onClick={() => setCancelling(true)}
                      >
                        Cancel plan
                      </Button>
                    )}
                  </div>
                ) : status === SubscriptionStatus.CANCELLED ? (
                  <Button asChild className="self-start">
                    <Link href={"/pricing" as Route}>See the plans</Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You're not on a plan. Choose one below to start writing.
              </p>
            )}
          </CardContent>
        </Card>
      </SettingsGroup>

      {billing.hasBillingAccount && (
        <SettingsGroup
          title="Payment"
          description="Lemon Squeezy charges your card and sends your receipts."
        >
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {billing.cardLastFour && (
                <p className="num text-sm text-foreground">
                  {billing.cardBrandLabel ?? "Card"} ending{" "}
                  {billing.cardLastFour}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <CustomerPortalButton variant="outline">
                  Update payment method
                </CustomerPortalButton>
                <Button
                  variant="ghost"
                  onClick={() => void billing.openTaxDetails()}
                  disabled={billing.isLoading}
                >
                  Tax ID and billing address
                </Button>
              </div>
            </CardContent>
          </Card>
        </SettingsGroup>
      )}

      {chooseFromGrid && (
        <SettingsGroup
          title="Choose a plan"
          description="Pay monthly or yearly; cancel any time, and the plan lasts to the end of the paid period."
        >
          <PlanGrid />
        </SettingsGroup>
      )}

      {subscription && paid && (
        <PlanChangeModal
          open={changing}
          onOpenChange={refreshAfter(setChanging)}
          plans={(plans.data?.plans ?? []).filter((plan) => plan.is_active)}
          currentPlanId={subscription.plan_id}
          currentBillingPeriod={subscription.billing_period}
        />
      )}
      {subscription && status === SubscriptionStatus.ACTIVE && (
        <CancelSubscriptionModal
          open={cancelling}
          onOpenChange={refreshAfter(setCancelling)}
          currentPeriodEnd={
            subscription.renews_at ?? subscription.current_period_end ?? null
          }
        />
      )}
    </div>
  );
}
