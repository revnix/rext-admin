"use client";

import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckoutWithDiscount } from "@/components/subscription/checkout-with-discount";
import { subscriptionQueries } from "@/lib/query-keys";
import { settingsRoutes } from "@/lib/routes";
import type {
  CatalogOffer,
  CatalogPlan,
  PlanCatalog,
} from "@/types/plan-catalog";
import { BillingPeriod, type SubscriptionPlan } from "@/types/subscription";

/** "$39", "$32.50": whole amounts without cents. */
export function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const count = (n: number) => n.toLocaleString("en-US");

function limit(n: number | null, one: string, many: string) {
  if (n === null) return `Unlimited ${many}`;
  return `${count(n)} ${n === 1 ? one : many}`;
}

/** The offer, when it is running now. */
export function activeOffer(catalog: PlanCatalog, now = new Date()) {
  const offer = catalog.offer;
  if (!offer) return null;
  const starts = Date.parse(offer.starts_at);
  const ends = Date.parse(offer.ends_at);
  return now.getTime() >= starts && now.getTime() < ends ? offer : null;
}

/** What the offer gives, in the catalogue's terms: "Double credits in your first month". */
export function offerWords(offer: CatalogOffer) {
  if (offer.credit_multiplier && offer.credit_multiplier > 1) {
    const times =
      offer.credit_multiplier === 2 ? "Double" : `${offer.credit_multiplier}×`;
    return `${times} credits in your first month`;
  }
  if (offer.bonus_credits) {
    return `${count(offer.bonus_credits)} extra credits in your first month`;
  }
  return offer.label;
}

/**
 * The subscription states in which the backend refuses another checkout (subscription_service:
 * a paid plan that's running, or a renewal still unpaid): the person changes plan in Billing.
 * Expired and cancelled ones may check out again.
 */
const HOLDS_A_PLAN = new Set(["active", "past_due", "suspended", "unpaid"]);

/** The current time, moved on at the offer's next start or end, so the page follows its window. */
function useOfferClock(offer: CatalogOffer | null | undefined) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!offer) return;
    const next = [Date.parse(offer.starts_at), Date.parse(offer.ends_at)]
      .filter((t) => t > now.getTime())
      .sort((a, b) => a - b)[0];
    if (next === undefined) return;
    // setTimeout holds at most about 24 days; a later boundary is reached in steps.
    const wait = Math.min(next - now.getTime() + 1000, 2_000_000_000);
    const timer = setTimeout(() => setNow(new Date()), wait);
    return () => clearTimeout(timer);
  }, [offer, now]);
  return now;
}

/** The offer's end, as the site shows it: in Pacific time, the launch's clock. */
export function offerEnd(offer: CatalogOffer) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  }).format(new Date(offer.ends_at));
}

function PlanCard({
  plan,
  period,
  currency,
  checkoutPlan,
  isCurrent,
  hasPaidPlan,
}: {
  plan: CatalogPlan;
  period: BillingPeriod;
  currency: string;
  checkoutPlan?: SubscriptionPlan;
  isCurrent: boolean;
  /** On a paid plan already: another plan is a change in Billing, not a second checkout. */
  hasPaidPlan: boolean;
}) {
  const yearly = period === BillingPeriod.YEARLY;
  const perMonth = yearly
    ? plan.price_monthly_billed_yearly
    : plan.price_monthly;
  const perArticle = yearly
    ? plan.price_per_article_yearly
    : plan.price_per_article_monthly;
  const facts = [
    `${count(plan.credits_per_month)} credits a month, about ${count(plan.articles_per_month)} articles`,
    limit(plan.max_workspaces, "workspace", "workspaces"),
    plan.max_members_per_workspace === null
      ? "Unlimited members"
      : `${count(plan.max_members_per_workspace)} members per workspace`,
    `${formatPrice(perArticle, currency)} per article`,
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-section">{plan.display_name}</h2>
          {isCurrent && <Badge variant="neutral">Your plan</Badge>}
        </div>
        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}
        <p className="mt-3 flex items-baseline gap-1">
          <span className="num text-display">
            {formatPrice(perMonth, currency)}
          </span>
          <span className="text-sm text-muted-foreground">a month</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {yearly
            ? `Billed ${formatPrice(plan.price_yearly, currency)} a year, ${plan.yearly_saving_percent}% less`
            : "Billed monthly"}
        </p>
      </CardHeader>
      <CardContent className="grow">
        <ul className="flex flex-col gap-2">
          {facts.map((fact) => (
            <li key={fact} className="flex items-start gap-2 text-sm">
              <Check
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              {fact}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrent ? (
          <Button variant="outline" className="w-full" disabled>
            Your plan
          </Button>
        ) : hasPaidPlan ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={settingsRoutes.plan as Route}>
              Switch to {plan.display_name}
            </Link>
          </Button>
        ) : checkoutPlan ? (
          <CheckoutWithDiscount
            className="w-full"
            plan={checkoutPlan}
            billingPeriod={period}
            variant="outline"
            buttonText={`Choose ${plan.display_name}`}
          />
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Not available yet
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * The plan grid (plans/app/F-billing.md §2 items 2, 7, 8): every number from the public catalogue
 * (`GET /api/v1/plans`), none typed here; monthly or yearly; the offer while it runs; the person's
 * own plan marked. Checkout takes the matching plan from `/subscriptions/plans` by its name. The
 * pricing page shows it, and the paywall will (F4).
 */
export function PlanGrid() {
  const [period, setPeriod] = useState<BillingPeriod>(BillingPeriod.MONTHLY);
  const catalog = useQuery(subscriptionQueries.catalog());
  const checkoutPlans = useQuery(subscriptionQueries.plans());
  const current = useQuery(subscriptionQueries.current());
  const now = useOfferClock(catalog.data?.offer);

  if (catalog.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (catalog.error || !catalog.data) {
    return (
      <Notice
        tone="danger"
        title="The plans didn't load"
        action={
          <Button variant="outline" size="sm" onClick={() => catalog.refetch()}>
            Try again
          </Button>
        }
      >
        Refresh the page, or try again in a moment.
      </Notice>
    );
  }

  const { plans, currency } = catalog.data;
  const offer = activeOffer(catalog.data, now);
  const byName = new Map(
    (checkoutPlans.data?.plans ?? [])
      .filter((p) => p.is_active && p.is_public)
      .map((p) => [p.name, p]),
  );
  // A plan of the grid that the person holds now; a trial isn't one of these plans, and an expired
  // or cancelled subscription no longer holds one.
  const subscription = current.data?.subscription;
  const currentPlanId =
    subscription && HOLDS_A_PLAN.has(subscription.status)
      ? subscription.plan_id
      : undefined;
  const hasPaidPlan = Boolean(
    currentPlanId && [...byName.values()].some((p) => p.id === currentPlanId),
  );
  const saving = Math.max(0, ...plans.map((p) => p.yearly_saving_percent));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as BillingPeriod)}
        >
          <TabsList aria-label="Billing period">
            <TabsTrigger value={BillingPeriod.MONTHLY}>Monthly</TabsTrigger>
            <TabsTrigger value={BillingPeriod.YEARLY}>
              Yearly{saving > 0 ? `, ${saving}% less` : ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {offer && (
        <Notice tone="success" title={`${offer.label}: ${offerWords(offer)}`}>
          On any plan started before {offerEnd(offer)}.
        </Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const checkoutPlan = byName.get(plan.name);
          return (
            <PlanCard
              key={plan.name}
              plan={plan}
              period={period}
              currency={currency}
              checkoutPlan={checkoutPlan}
              isCurrent={Boolean(
                currentPlanId && checkoutPlan?.id === currentPlanId,
              )}
              hasPaidPlan={hasPaidPlan}
            />
          );
        })}
      </div>
    </div>
  );
}
