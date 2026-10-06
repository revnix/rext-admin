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
import { type CreditBalance, SubscriptionStatus } from "@/types/subscription";

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
          <CreditsCard credits={credits.data} onTrial={onTrial} />
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
                    ? `${usage.data.workspaces.used.toLocaleString()} workspaces, no limit`
                    : `${usage.data.workspaces.used.toLocaleString()} of ${usage.data.workspaces.limit.toLocaleString()} workspaces`}
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
}: {
  credits: CreditBalance;
  onTrial: boolean;
}) {
  const left = credits.current_credits;
  const total = credits.credits_per_month;
  const usedShare =
    total && total > 0 ? Math.min(1, Math.max(0, 1 - left / total)) : null;
  const warn = usedShare !== null && usedShare >= WARN_USED_SHARE;
  const bonus = credits.bonus;

  return (
    <div className="flex flex-col gap-4">
      {warn && (
        <Notice
          tone="warning"
          title={`${Math.round((usedShare ?? 0) * 100)}% of ${onTrial ? "the trial's" : "this month's"} credits are used`}
          action={
            <Button asChild variant="outline" size="sm">
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
              {total !== null
                ? ` of ${total.toLocaleString()} credits left`
                : " credits left"}
            </span>
          </p>
          {total !== null && total > 0 && (
            <Meter
              value={left}
              max={total}
              low={warn}
              label="Credits left this period"
            />
          )}
          <p className="text-sm text-muted-foreground">
            {[
              credits.articles_remaining !== null
                ? `About ${credits.articles_remaining.toLocaleString()} articles.`
                : null,
              bonus
                ? `Includes ${bonus.credits.toLocaleString()} of ${bonus.granted.toLocaleString()} ${bonus.label.toLowerCase()} credits${bonus.expires_at ? `, until ${dateFormat.short(bonus.expires_at)}` : ""}.`
                : null,
              credits.credits_reset_date
                ? onTrial
                  ? `The trial ends ${dateFormat.short(credits.credits_reset_date)}; its credits don't renew.`
                  : `Credits reset to the plan's amount ${dateFormat.short(credits.credits_reset_date)}; unused ones don't carry over.`
                : null,
            ]
              .filter(Boolean)
              .join(" ")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
