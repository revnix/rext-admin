"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import {
  paywallBalanceWords,
  paywallState,
  paywallTitle,
} from "@/components/billing/paywall-state";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useAuthSession } from "@/hooks/use-auth-session";
import { subscriptionQueries } from "@/lib/query-keys";
import { settingsRoutes } from "@/lib/routes";

/**
 * The home's first card when nothing new can be written (plans/app/F-billing.md §2 item 3): the
 * trial ended with nothing bought since, or the balance can't start an article. It says so and
 * leads to the plans; drafts and articles stay open below it. Nothing when an article can start.
 */
export function PaywallCard({ workspaceId }: { workspaceId: string }) {
  const { user } = useAuthSession();
  const credits = useQuery(subscriptionQueries.workspaceCredits(workspaceId));
  // The trial is the person's own: on a workspace they don't own, the credits are the owner's.
  const ownerId = credits.data?.target_user_id;
  const ownCredits =
    Boolean(credits.data) && (!ownerId || ownerId === user?.id);
  const trial = useQuery({
    ...subscriptionQueries.trialStatus(),
    enabled: ownCredits,
  });
  const catalog = useQuery(subscriptionQueries.catalog());
  const state = paywallState({
    trial: ownCredits ? trial.data : null,
    credits: credits.data,
    perArticle: catalog.data?.credits.per_article ?? null,
  });
  if (!state) return null;

  const balance =
    state.kind === "no-credits"
      ? paywallBalanceWords(state.balance, state.perArticle)
      : null;
  return (
    <Notice
      tone="warning"
      title={paywallTitle(state)}
      action={
        ownCredits ? (
          <Button asChild variant="outline" size="sm">
            <Link href={settingsRoutes.plan as Route}>Choose a plan</Link>
          </Button>
        ) : undefined
      }
    >
      {[
        balance,
        ownCredits
          ? "Choose a plan to start new articles. Everything you've written stays open to read, edit and export."
          : "The credits are this workspace owner's: ask them to choose a plan. Everything written here stays open.",
      ]
        .filter(Boolean)
        .join(" ")}
    </Notice>
  );
}
