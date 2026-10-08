"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { SettingsGroup } from "@/components/settings/settings-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { subscriptionQueries } from "@/lib/query-keys";
import {
  againstAllowance,
  bonusWords,
  monthlyCreditsLeft,
} from "./billing-format";
import { type CreditBalance, SubscriptionStatus } from "@/types/subscription";

/** "1 workspace", "3 workspaces". */
const workspaces = (count: number) =>
  `${count.toLocaleString()} ${count === 1 ? "workspace" : "workspaces"}`;

/**
 * "About 4 articles.", "About 1 article.", or none left for a whole one. The count is of all the
 * person can spend, so with a bonus in the balance it says "in all": beside "1,000 of 1,000
 * credits left", a bare "About 133 articles" reads as a mistake (task 784).
 */
const articlesWords = (count: number | null, inAll = false) =>
  count === null
    ? null
    : count < 1
      ? "Not enough for a whole article."
      : `About ${count.toLocaleString()} ${count === 1 ? "article" : "articles"}${inAll ? " in all" : ""}.`;

/** At 80 % of the period's credits used, the meter warns and a notice says what to do. */
const WARN_USED_SHARE = 0.8;

/**
 * Account settings, Usage (plans/app/F-billing.md F5): the credits of this period against the
 * plan's, with the bonus and the 80 % warning; the workspaces against the plan's cap. Every figure
 * is the backend's (`/subscriptions/credits`, `/subscriptions/usage`, the catalogue). There is no
 * history by month: the backend keeps no record of credits by period yet.
 */
export function UsageSection() {
  const credits = useQuery(subscriptionQueries.myCredits());
  const usage = useQuery(subscriptionQueries.usage());
  const catalog = useQuery(subscriptionQueries.catalog());
  const current = useQuery(subscriptionQueries.current());
  const onTrial =
    current.data?.subscription?.status === SubscriptionStatus.TRIAL;

  return (
    <div className="flex flex-col gap-10">
      <SettingsGroup
        title="Credits"
        description={
          catalog.data
            ? `One article is ${catalog.data.credits.per_article} credits, taken stage by stage as it's made.`
            : undefined
        }
      >
        {credits.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : credits.isError ? (
          <Notice tone="danger" title="Your credits didn't load">
            Refresh the page to try again.
          </Notice>
        ) : (
          <CreditsCard
            credits={credits.data}
            onTrial={onTrial}
            trialEnd={current.data?.subscription?.trial_end_date}
          />
        )}
      </SettingsGroup>

      <SettingsGroup
        title="Workspaces and members"
        description="What your plan allows; a workspace holds its own sites, personas and articles."
      >
        {usage.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : usage.isError ? (
          <Notice tone="danger" title="Your usage didn't load">
            Refresh the page to try again.
          </Notice>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex flex-col gap-2">
                <p className="num text-sm text-foreground">
                  {usage.data.workspaces.unlimited ||
                  usage.data.workspaces.limit === null
                    ? `${workspaces(usage.data.workspaces.used)}, no limit`
                    : `${usage.data.workspaces.used.toLocaleString()} of ${workspaces(usage.data.workspaces.limit)}`}
                </p>
                {!usage.data.workspaces.unlimited &&
                  usage.data.workspaces.limit !== null &&
                  usage.data.workspaces.limit > 0 && (
                    <Meter
                      value={usage.data.workspaces.used}
                      max={usage.data.workspaces.limit}
                      label="Workspaces"
                    />
                  )}
              </div>
              <p className="text-sm text-muted-foreground">
                {usage.data.members.unlimited ||
                usage.data.members.limit === null
                  ? "No limit on members in a workspace."
                  : `Up to ${usage.data.members.limit.toLocaleString()} members in each workspace.`}
              </p>
            </CardContent>
          </Card>
        )}
      </SettingsGroup>
    </div>
  );
}

function CreditsCard({
  credits,
  onTrial,
  trialEnd,
}: {
  credits: CreditBalance;
  onTrial: boolean;
  /** The trial's own end, as the pill and the banner read it: an extension moves it, not the reset date. */
  trialEnd?: string | null;
}) {
  const left = monthlyCreditsLeft(credits);
  const total = credits.credits_per_month;
  // Above the allowance (credits an admin added) the balance stands alone, with the bar full.
  const { of, meter } = againstAllowance(left, total);
  const usedShare = meter ? 1 - meter.value / meter.max : null;
  const warn = usedShare !== null && usedShare >= WARN_USED_SHARE;
  const trialEndsOn = trialEnd ?? credits.credits_reset_date;
  const bonus = bonusWords(credits);

  return (
    <div className="flex flex-col gap-4">
      {warn && (
        <Notice
          tone="warning"
          title={`${Math.round((usedShare ?? 0) * 100)}% of ${onTrial ? "the trial's" : "this month's"} credits are used`}
          action={
            <Button data-rec="show" asChild variant="outline" size="sm">
              <Link href={"/pricing" as Route}>See the plans</Link>
            </Button>
          }
        >
          A run stops before its first billed stage when fewer credits are left
          than one article takes.
        </Notice>
      )}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <p className="num text-foreground">
            <span className="font-display text-page-title">
              {left.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              {of !== null
                ? ` of ${of.toLocaleString()} credits left`
                : " credits left"}
            </span>
          </p>
          {meter && (
            <Meter
              value={meter.value}
              max={meter.max}
              low={warn}
              label="Credits left this period"
            />
          )}
          <p className="text-sm text-muted-foreground">
            {[
              // The bonus first, then what the plan's credits and the bonus buy together.
              ...(bonus
                ? [bonus, articlesWords(credits.articles_remaining, true)]
                : [articlesWords(credits.articles_remaining)]),
              onTrial
                ? trialEndsOn &&
                  `The trial ends ${dateFormat.short(trialEndsOn)}; its credits don't renew.`
                : credits.credits_reset_date &&
                  `Credits reset to the plan's amount ${dateFormat.short(credits.credits_reset_date)}; unused ones don't carry over.`,
            ]
              .filter(Boolean)
              .join(" ")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
