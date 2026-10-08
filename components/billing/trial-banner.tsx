"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageBand } from "@/components/layouts/page-frame";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useSession } from "next-auth/react";
import { useNow } from "@/hooks/use-now";
import { subscriptionQueries } from "@/lib/query-keys";
import { local, session } from "@/lib/storage";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { SubscriptionStatus } from "@/types/subscription";
import { monthlyCreditsLeft } from "./billing-format";
import { trialEndingTitle, trialState } from "./trial-state";

/** Shown once: the trial's terms at the first visit after signing up. */
const introKey = (userId: string) => `rext-trial-intro-seen-${userId}`;
/** Put away for this browser session: it comes back in the next one while the trial is ending. */
const endingKey = (userId: string) => `rext-trial-ending-dismissed-${userId}`;

/**
 * The trial's banner in the shell (plans/app/F-billing.md §2 item 5a): once at the first visit,
 * with the trial's terms, and then only when fewer than three days or the low-balance credits are
 * left. It reads the person's own subscription and credits, so it never speaks for a workspace
 * owner's trial. A trial that has ended is the paywall's (F4), not this banner's.
 */
export function TrialBanner() {
  // The plain session: useAuthSession tracks activity, which would re-render the shell on every move.
  const { data: authSession } = useSession();
  const userId = authSession?.user?.id;
  const now = useNow();
  const current = useQuery({
    ...subscriptionQueries.current(),
    enabled: Boolean(userId),
  });
  const onTrial =
    current.data?.subscription?.status === SubscriptionStatus.TRIAL;
  const credits = useQuery({
    ...subscriptionQueries.myCredits(),
    enabled: onTrial,
  });
  const catalog = useQuery({
    ...subscriptionQueries.catalog(),
    enabled: onTrial,
  });
  const [hidden, setHidden] = useState<"intro" | "ending" | null>(null);
  const [introSeen, setIntroSeen] = useState(true);
  const [endingDismissed, setEndingDismissed] = useState(true);

  // Browser storage is read after mounting, so the server's render and the first client render agree.
  useEffect(() => {
    if (!userId) return;
    setIntroSeen(local.getBoolean(introKey(userId)));
    setEndingDismissed(session.getBoolean(endingKey(userId)));
  }, [userId]);

  // The stream's credit updates reach the store, not this query: the store's figures win when
  // they're the person's own (no target named means their own, as in the shell's meter).
  const storeCredits = useSubscriptionStore((store) => store.credits);
  const liveCredits =
    storeCredits &&
    (!storeCredits.target_user_id || storeCredits.target_user_id === userId)
      ? storeCredits
      : credits.data;
  const trialEnd = current.data?.subscription?.trial_end_date;
  const lowCredits = catalog.data?.credits.low_balance_threshold;
  const state = useMemo(
    () =>
      onTrial && trialEnd && liveCredits && lowCredits !== undefined
        ? trialState(
            {
              trialEnd,
              creditsLeft: monthlyCreditsLeft(liveCredits),
              lowCredits,
            },
            now,
          )
        : null,
    [onTrial, trialEnd, liveCredits, lowCredits, now],
  );

  const showIntro = Boolean(state && !state.ended && !introSeen);
  const showEnding = Boolean(
    state && !state.ended && state.ending && !endingDismissed,
  );

  // The intro is shown once: seen as soon as it's on screen.
  useEffect(() => {
    if (showIntro && userId) local.setBoolean(introKey(userId), true);
  }, [showIntro, userId]);

  if (!state || !userId || lowCredits === undefined) return null;

  const plans = (
    <Button data-rec="show" asChild size="sm">
      <Link href={"/pricing" as Route}>See the plans</Link>
    </Button>
  );

  if (showEnding && hidden !== "ending") {
    return (
      <PageBand>
        <Notice
          tone="warning"
          title={trialEndingTitle(state, lowCredits)}
          action={plans}
          onDismiss={() => {
            session.setBoolean(endingKey(userId), true);
            setHidden("ending");
          }}
        >
          Choose a plan to keep writing. What you've written stays yours.
        </Notice>
      </PageBand>
    );
  }

  if (showIntro && hidden !== "intro" && catalog.data) {
    const perArticle = catalog.data.credits.per_article;
    return (
      <PageBand>
        <Notice
          title={`Your trial: ${state.daysLeft} days and ${state.creditsLeft.toLocaleString()} credits`}
          action={plans}
          onDismiss={() => setHidden("intro")}
        >
          One article is {perArticle} credits.
          {catalog.data.trial?.credits_renew === false &&
            " The trial's credits don't renew; a plan's come back each month."}
        </Notice>
      </PageBand>
    );
  }

  return null;
}
