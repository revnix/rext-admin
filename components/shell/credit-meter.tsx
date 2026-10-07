"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { monthlyCreditsLeft } from "@/components/billing/billing-format";
import {
  type TrialState,
  trialPillWords,
  trialState,
} from "@/components/billing/trial-state";
import { Meter } from "@/components/ui/meter";
import { useNow } from "@/hooks/use-now";
import { subscriptionQueries } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { type CreditBalance, SubscriptionStatus } from "@/types/subscription";
import { settingsRoutes } from "@/lib/routes";

/** Under a fifth of the month's credits left, the bar takes the warning colour. */
const LOW_SHARE = 0.2;

/**
 * The credits of the page's scope: the workspace owner's on a workspace page, the signed-in
 * person's own elsewhere. The store single-flights and throttles the fetch per scope, so the
 * header's meter and the sidebar's share one request.
 */
function useShellCredits(): CreditBalance | null {
  const { workspaceSlug } = useParams<{ workspaceSlug?: string }>();
  const onWorkspacePage = Boolean(workspaceSlug);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspace?.id,
  );
  const credits = useSubscriptionStore((state) => state.credits);
  const fetchCredits = useSubscriptionStore((state) => state.fetchCredits);
  const workspaceId = onWorkspacePage ? currentWorkspaceId : undefined;

  useEffect(() => {
    // The workspace provider sets id "" while the workspace loads: wait for the real one.
    if (onWorkspacePage && !workspaceId) return;
    fetchCredits(workspaceId).catch(() => {});
  }, [onWorkspacePage, workspaceId, fetchCredits]);

  return credits;
}

/**
 * The person's own trial, when the credits shown are theirs (on a workspace they don't own, the
 * credits are the owner's, and the trial isn't theirs to state).
 */
function useShellTrial(credits: CreditBalance | null): TrialState | null {
  // The plain session: useAuthSession tracks activity, which would re-render the shell on every move.
  const { data: authSession } = useSession();
  const userId = authSession?.user?.id;
  const now = useNow();
  const current = useQuery({
    ...subscriptionQueries.current(),
    enabled: Boolean(userId),
  });
  const catalog = useQuery(subscriptionQueries.catalog());
  const subscription = current.data?.subscription;
  const own =
    credits !== null &&
    (!credits.target_user_id || credits.target_user_id === userId);
  if (
    !credits ||
    !own ||
    subscription?.status !== SubscriptionStatus.TRIAL ||
    !subscription.trial_end_date ||
    !catalog.data
  )
    return null;
  return trialState(
    {
      trialEnd: subscription.trial_end_date,
      creditsLeft: monthlyCreditsLeft(credits),
      lowCredits: catalog.data.credits.low_balance_threshold,
    },
    now,
  );
}

function describe(credits: CreditBalance) {
  // The plan's own credits against its allowance; a bonus is Usage's to show.
  const left = monthlyCreditsLeft(credits);
  const total = credits.credits_per_month;
  const share =
    total && total > 0 ? Math.min(1, Math.max(0, left / total)) : null;
  const articles =
    credits.articles_remaining !== null
      ? `about ${credits.articles_remaining.toLocaleString()} articles`
      : null;
  const label =
    total !== null
      ? `${left.toLocaleString()} of ${total.toLocaleString()} credits left`
      : `${left.toLocaleString()} credits left`;
  return {
    left,
    total,
    share,
    low: share !== null && share < LOW_SHARE,
    label: [label, articles].filter(Boolean).join(", "),
  };
}

/**
 * The credits meter (design/app-language.md §5), in the sidebar's footer: the bar and "412 of
 * 1,000 credits", opening the usage page. The header no longer repeats it (FB2.4).
 */
export function CreditMeter({ className }: { className?: string }) {
  const credits = useShellCredits();
  const trial = useShellTrial(credits);
  if (!credits) return null;
  const described = describe(credits);
  const { left, total, share } = described;
  const low = trial ? trial.ending : described.low;
  const label = trial ? trialPillWords(trial) : described.label;

  return (
    <Link
      href={settingsRoutes.usage}
      aria-label={`${label}. Open usage`}
      data-collapse="hide"
      className={cn(
        "block rounded-sm px-3 py-2 transition-colors duration-(--duration-fast) ease-out hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
        className,
      )}
    >
      {share !== null && total !== null && (
        <Meter value={left} max={total} low={low} />
      )}
      <span className="mt-2 block text-caption text-muted-foreground">
        <span className="num font-medium text-foreground">
          {left.toLocaleString()}
        </span>
        {total !== null && (
          <>
            {" "}
            of <span className="num">{total.toLocaleString()}</span>
          </>
        )}{" "}
        credits
      </span>
    </Link>
  );
}
