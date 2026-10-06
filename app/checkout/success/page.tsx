"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DetailPage } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import {
  READY_STATUSES,
  useSubscriptionSync,
} from "@/hooks/use-subscription-sync";
import { analytics } from "@/lib/analytics";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { subscriptionQueries } from "@/lib/query-keys";
import { settingsRoutes } from "@/lib/routes";
import { useSubscriptionStore } from "@/stores/subscription-store";

type Phase = "confirming" | "confirmed" | "slow";

/** The subscription's status in words. */
const STATUS_WORDS: Record<string, string> = {
  active: "Active",
  trial: "Trial",
  on_trial: "Trial",
  cancelled: "Cancelled",
  past_due: "Payment due",
};

/**
 * Where Lemon Squeezy's checkout returns after a payment (plans/app/F-billing.md F7), inside the
 * shell. The payment succeeds before Lemon Squeezy's webhook reaches the backend, so the page waits
 * (bounded) for the subscription to show it, then gives the plan and the new balance, read from
 * the backend. The in-app checkout confirms in place (lemonsqueezy-provider.tsx); this is the page
 * the overlay's Continue and a direct return land on.
 */
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("session_id") || searchParams.get("checkout_id");
  const subscription = useSubscriptionStore(
    (state) => state.subscription?.subscription,
  );
  const setCredits = useSubscriptionStore((state) => state.setCredits);
  const { waitForSubscriptionSync } = useSubscriptionSync();
  const [phase, setPhase] = useState<Phase>("confirming");

  useEffect(() => {
    const controller = new AbortController();
    waitForSubscriptionSync(controller.signal)
      .then((synced) => {
        if (!controller.signal.aborted) setPhase(synced ? "confirmed" : "slow");
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhase("slow");
      });
    return () => controller.abort();
  }, [waitForSubscriptionSync]);

  // The balance once the payment shows: the new plan's credits, the same the meters then show.
  const credits = useQuery({
    ...subscriptionQueries.myCredits(),
    enabled: phase !== "confirming",
  });
  useEffect(() => {
    if (credits.data) setCredits(credits.data);
  }, [credits.data, setCredits]);

  // The purchase is counted once its subscription is confirmed.
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current || !subscription) return;
    const status = subscription.status ?? "";
    if (!READY_STATUSES.has(status)) return;
    tracked.current = true;
    analytics.track("subscription_purchased", {
      plan_name: subscription.plan_display_name ?? undefined,
      billing_period: subscription.billing_period ?? undefined,
      status,
      checkout_id: searchParams.get("checkout_id") ?? undefined,
      session_id: searchParams.get("session_id") ?? undefined,
    });
  }, [subscription, searchParams]);

  const planName =
    credits.data?.plan_name ?? subscription?.plan_display_name ?? null;
  const renews = subscription?.renews_at ?? subscription?.current_period_end;
  const left = credits.data?.current_credits;
  const total = credits.data?.credits_per_month ?? null;

  return (
    <DetailPage
      title={
        phase === "confirming"
          ? "Confirming your payment"
          : planName
            ? `You're on ${planName}`
            : "Payment received"
      }
      description={
        phase === "confirming"
          ? "Lemon Squeezy has taken the payment; this waits for it to reach your account."
          : "Thank you. A receipt is on its way to your email."
      }
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={settingsRoutes.subscription as Route}>Billing</Link>
          </Button>
          <Button asChild>
            <Link href={"/" as Route}>Go to home</Link>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {phase === "slow" && (
          <Notice tone="warning" title="Your plan isn't showing yet">
            The payment went through, and Lemon Squeezy tells us within a few
            minutes. Billing shows the plan once it arrives; nothing needs to be
            paid again.
          </Notice>
        )}
        <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
          {phase === "confirming" ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-section">{planName ?? "Your plan"}</h2>
                {subscription?.status && (
                  <Badge
                    variant={
                      READY_STATUSES.has(subscription.status)
                        ? "success"
                        : "neutral"
                    }
                  >
                    {STATUS_WORDS[subscription.status] ?? subscription.status}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {left === undefined ? (
                  credits.isError ? (
                    <p className="text-sm text-muted-foreground">
                      Your balance didn't load; the header shows it in a moment.
                    </p>
                  ) : (
                    <Skeleton className="h-8 w-40" />
                  )
                ) : (
                  <p className="num text-foreground">
                    <span className="font-display text-page-title">
                      {left.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {total !== null
                        ? ` of ${total.toLocaleString()} credits`
                        : " credits"}
                    </span>
                  </p>
                )}
                {left !== undefined && total !== null && total > 0 && (
                  <Meter value={left} max={total} label="Credits" />
                )}
                {renews && (
                  <p className="text-sm text-muted-foreground">
                    Renews {dateFormat.short(renews)}.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        {reference && (
          <p className="text-sm text-muted-foreground">
            Reference <span className="num font-mono">{reference}</span>
          </p>
        )}
      </div>
    </DetailPage>
  );
}
