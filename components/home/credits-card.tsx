"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/use-auth-session";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { subscriptionQueries } from "@/lib/query-keys";
import { settingsRoutes } from "@/lib/routes";
import { SubscriptionStatus } from "@/types/subscription";
import {
  againstAllowance,
  bonusWords,
  creditsPlan,
  monthlyCreditsLeft,
} from "@/components/billing/billing-format";

/** Under a fifth of the month's credits left, the bar takes the warning colour, as in the shell. */
const LOW_SHARE = 0.2;

/**
 * The workspace's credits (plans/app/D-pages.md §2.1): its owner's plan, the balance on the meter,
 * when the credits renew or the trial ends, and what one article costs. Every number is the
 * backend's: the balance and the month's allowance from the credits endpoint (a trial's allowance
 * is the trial plan's), the article's cost from the public catalogue. An account with nothing that
 * grants access has no plan, which is not the unlimited plan's "no monthly limit".
 */
export function CreditsCard({ workspaceId }: { workspaceId: string }) {
  const { user } = useAuthSession();
  const credits = useQuery(subscriptionQueries.workspaceCredits(workspaceId));
  const catalog = useQuery(subscriptionQueries.catalog());
  const mine = useQuery(subscriptionQueries.current());

  if (!credits.data) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-5">
        <h2 className="text-section">Credits</h2>
        {credits.isError ? (
          <p className="text-sm text-muted-foreground">
            Your credits didn't load. Refresh the page to try again.
          </p>
        ) : (
          <Skeleton className="h-16 w-full" />
        )}
      </div>
    );
  }

  const left = monthlyCreditsLeft(credits.data);
  const {
    credits_per_month: total,
    credits_reset_date: resetDate,
    plan_name: planName,
    target_user_id: ownerId,
  } = credits.data;
  // Above the allowance (credits an admin added) the balance stands alone, with the bar full.
  const { of, meter } = againstAllowance(left, total);
  const share = meter ? meter.value / meter.max : null;
  // The trial is known from the person's own subscription, so only when the credits are theirs.
  const ownCredits = !ownerId || ownerId === user?.id;
  const onTrial =
    ownCredits && mine.data?.subscription?.status === SubscriptionStatus.TRIAL;
  const plan = creditsPlan(credits.data);
  const choosePlan = onTrial || (plan === "none" && ownCredits);
  const perArticle = catalog.data?.credits.per_article;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-section">Credits</h2>
        {planName && (
          <span className="truncate text-sm text-muted-foreground">
            {planName}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="num text-foreground">
          <span className="font-display text-page-title">
            {left.toLocaleString()}
          </span>
          {of !== null && (
            <span className="text-sm text-muted-foreground">
              {" "}
              of {of.toLocaleString()}
            </span>
          )}
        </p>
        {meter && (
          <Meter
            value={meter.value}
            max={meter.max}
            low={share !== null && share < LOW_SHARE}
            label="Credits left this period"
          />
        )}
        <p className="text-sm text-muted-foreground">
          {[
            plan === "none"
              ? ownCredits
                ? "No plan: choose one to keep writing"
                : "The workspace's owner has no plan, so it can't write"
              : resetDate
                ? onTrial
                  ? `Trial ends ${dateFormat.short(resetDate)}`
                  : `Credits renew ${dateFormat.short(resetDate)}`
                : plan === "unlimited"
                  ? "No monthly limit"
                  : null,
            bonusWords(credits.data)?.replace(/\.$/, ""),
            perArticle ? `One article is ${perArticle} credits` : null,
          ]
            .filter(Boolean)
            .map((sentence) => `${sentence}.`)
            .join(" ")}
        </p>
      </div>
      {(ownCredits || plan !== "none") && (
        <Button
          data-rec="show"
          asChild
          variant="outline"
          className="self-start"
        >
          <Link href={(choosePlan ? "/pricing" : settingsRoutes.plan) as Route}>
            {choosePlan ? "Choose a plan" : "Plan and billing"}
          </Link>
        </Button>
      )}
    </div>
  );
}
