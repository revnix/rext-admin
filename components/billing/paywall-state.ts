/**
 * The paywall (plans/app/F-billing.md §2 item 3): the trial is over with nothing bought since, or
 * the balance can't start an article. Every figure is the backend's: the trial from
 * `/subscriptions/trial-status`, what an article needs from the credits endpoint's cost table,
 * what it costs from the catalogue.
 */

import type { CreditBalance, TrialStatus } from "@/types/subscription";

export type PaywallState =
  | { kind: "trial-ended"; endedOn: string }
  | { kind: "no-credits"; balance: number; perArticle: number | null };

export function paywallState({
  trial,
  credits,
  perArticle = null,
}: {
  /** The person's own trial: only when the credits are theirs (not a workspace owner's). */
  trial?: TrialStatus | null;
  credits?: CreditBalance | null;
  perArticle?: number | null;
}): PaywallState | null {
  if (trial?.trial_expired && trial.trial_end_date) {
    return { kind: "trial-ended", endedOn: trial.trial_end_date };
  }
  // Unknown or unlimited: nothing to lock. A null articles_remaining is the unlimited plan; no
  // plan at all (a paid plan that lapsed) has a null credits_per_month but 0 articles, and locks.
  if (!credits || credits.articles_remaining === null) return null;
  const analyze = credits.runs?.analyze;
  const short = analyze
    ? !analyze.can_run
    : (credits.articles_remaining ?? 0) < 1;
  return short
    ? { kind: "no-credits", balance: credits.current_credits, perArticle }
    : null;
}

/** "October 5": the day a trial ended, in the person's time zone. */
export function endedOnWords(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

/** The paywall's heading. */
export function paywallTitle(state: PaywallState): string {
  return state.kind === "trial-ended"
    ? `Your trial ended on ${endedOnWords(state.endedOn)}`
    : "Not enough credits for a new article";
}

/** What one article costs and what's in hand, in the backend's numbers. */
export function paywallBalanceWords(
  balance: number,
  perArticle: number | null,
): string {
  const have = `You have ${balance.toLocaleString()} ${balance === 1 ? "credit" : "credits"}`;
  return perArticle
    ? `${have}; one article is ${perArticle} credits.`
    : `${have}.`;
}
