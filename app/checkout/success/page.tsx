"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DetailPage } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPurchaseState,
  isPurchaseSettled,
  type PurchaseState,
  useSubscriptionSync,
} from "@/hooks/use-subscription-sync";
import { analytics } from "@/lib/analytics";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { subscriptionQueries } from "@/lib/query-keys";
import { settingsRoutes } from "@/lib/routes";
import {
  againstAllowance,
  bonusWords,
  monthlyCreditsLeft,
} from "@/components/billing/billing-format";
import { session } from "@/lib/storage";
import { CHECKOUT_BASELINE_KEY } from "@/lib/storage-keys";
import { useSubscriptionStore } from "@/stores/subscription-store";

type Phase = "confirming" | "confirmed" | "slow";

/** After the first wait, Lemon Squeezy's webhook is looked for this often, for this long. */
const SLOW_POLL_MS = 15_000;
const SLOW_WATCH_MS = 10 * 60_000;

/** The subscription's status in words. */
const STATUS_WORDS: Record<string, string> = {
  active: "Active",
  trial: "Trial",
  on_trial: "Trial",
  cancelled: "Cancelled",
  past_due: "Payment due",
};

/**
 * The subscription as it was when the checkout opened: this tab's store, else what the tab kept
 * through Lemon Squeezy's full-page return, else none (a first purchase, from a trial, has no
 * Lemon Squeezy subscription to tell apart).
 */
function checkoutBaseline(): PurchaseState {
  return (
    useSubscriptionStore.getState().checkoutBaseline ??
    session.getJSON<PurchaseState | null>(CHECKOUT_BASELINE_KEY, null) ??
    getPurchaseState(null)
  );
}

/**
 * Where Lemon Squeezy's checkout returns after a payment (plans/app/F-billing.md F7), inside the
 * shell. The payment succeeds before Lemon Squeezy's webhook reaches the backend, so the page waits
 * until the subscription shows this purchase (a new Lemon Squeezy subscription or a new plan, not
 * the one the person already had), then gives the plan and the new balance, read from the backend.
 * A webhook later than the first wait is still looked for, lightly, for ten minutes. The in-app
 * checkout confirms in place (lemonsqueezy-provider.tsx); this is the page a direct return lands on.
 */
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("session_id") || searchParams.get("checkout_id");
  const subscription = useSubscriptionStore(
    (state) => state.subscription?.subscription,
  );
  const fetchSubscription = useSubscriptionStore(
    (state) => state.fetchSubscription,
  );
  const setCredits = useSubscriptionStore((state) => state.setCredits);
  const { waitForPurchaseSettled } = useSubscriptionSync();
  const [phase, setPhase] = useState<Phase>("confirming");

  useEffect(() => {
    const controller = new AbortController();
    const baseline = checkoutBaseline();
    const settled = () =>
      isPurchaseSettled(
        baseline,
        getPurchaseState(useSubscriptionStore.getState().subscription),
      );
    const confirm = () => {
      session.remove(CHECKOUT_BASELINE_KEY);
      setPhase("confirmed");
    };

    (async () => {
      // A failed request is a reason to keep looking, never to stop: the payment went through.
      const first = await waitForPurchaseSettled(
        baseline,
        controller.signal,
      ).catch(() => false);
      if (first) {
        confirm();
        return;
      }
      if (controller.signal.aborted) return;
      setPhase("slow");
      const until = Date.now() + SLOW_WATCH_MS;
      while (!controller.signal.aborted && Date.now() < until) {
        await new Promise((resolve) => setTimeout(resolve, SLOW_POLL_MS));
        if (controller.signal.aborted) return;
        try {
          await fetchSubscription({ force: true });
        } catch {
          continue;
        }
        if (settled()) {
          confirm();
          return;
        }
      }
    })();
    return () => controller.abort();
  }, [waitForPurchaseSettled, fetchSubscription]);

  // The balance only once this purchase shows, so the old plan's never passes for the new one.
  const credits = useQuery({
    ...subscriptionQueries.myCredits(),
    enabled: phase === "confirmed",
  });
  useEffect(() => {
    if (credits.data) setCredits(credits.data);
  }, [credits.data, setCredits]);

  // The purchase is counted once, when it's confirmed.
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current || phase !== "confirmed" || !subscription) return;
    tracked.current = true;
    analytics.track("subscription_purchased", {
      plan: subscription.plan_name ?? undefined,
      billing_period: subscription.billing_period ?? undefined,
      status: subscription.status ?? undefined,
      checkout_id: searchParams.get("checkout_id") ?? undefined,
      session_id: searchParams.get("session_id") ?? undefined,
    });
  }, [phase, subscription, searchParams]);

  const planName =
    credits.data?.plan_name ?? subscription?.plan_display_name ?? null;
  const renews = subscription?.renews_at ?? subscription?.current_period_end;
  const left = credits.data ? monthlyCreditsLeft(credits.data) : undefined;
  const bonus = credits.data ? bonusWords(credits.data) : null;
  const total = credits.data?.credits_per_month ?? null;
  // Above the allowance the balance stands alone, with the bar full.
  const against = left !== undefined ? againstAllowance(left, total) : null;

  return (
    <DetailPage
      title={
        phase === "confirming"
          ? "Confirming your payment"
          : phase === "confirmed" && planName
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
          <Button data-rec="show" asChild variant="outline">
            <Link href={settingsRoutes.plan as Route}>Plan</Link>
          </Button>
          <Button data-rec="show" asChild>
            <Link href={"/" as Route}>Go to home</Link>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {phase === "slow" && (
          <Notice tone="warning" title="Your plan isn't showing yet">
            The payment went through, and Lemon Squeezy tells us within a few
            minutes. This page keeps looking, and Plan in your account settings
            shows it once it arrives; nothing needs to be paid again.
          </Notice>
        )}
        {phase !== "slow" && (
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {phase === "confirming" ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-section">{planName ?? "Your plan"}</h2>
                    {subscription?.status && (
                      <Badge variant="success">
                        {STATUS_WORDS[subscription.status] ??
                          subscription.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {left === undefined ? (
                      credits.isError ? (
                        <p className="text-sm text-muted-foreground">
                          Your balance didn't load; the header shows it in a
                          moment.
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
                          {against && against.of !== null
                            ? ` of ${against.of.toLocaleString()} credits`
                            : " credits"}
                        </span>
                      </p>
                    )}
                    {against?.meter && (
                      <Meter
                        value={against.meter.value}
                        max={against.meter.max}
                        label="Credits"
                      />
                    )}
                    {(renews || bonus) && (
                      <p className="text-sm text-muted-foreground">
                        {[
                          renews ? `Renews ${dateFormat.short(renews)}.` : null,
                          bonus,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
        {reference && (
          <p className="text-sm text-muted-foreground">
            Reference <span className="num font-mono">{reference}</span>
          </p>
        )}
      </div>
    </DetailPage>
  );
}
