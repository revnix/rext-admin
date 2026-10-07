/**
 * What a run costs, in the backend's own figures: `GET /subscriptions/credits` returns `runs`,
 * built from one table (`plan_catalog.RUN_STAGES` over `credit_manager.STAGE_CREDITS`). The
 * dashboard types no amount; it only names the stages and does the subtraction when a live
 * credits event moves the balance.
 */

import type { BilledRun, CreditBalance, RunCost } from "@/types/subscription";

/** The pipeline's billed stages, by the backend's keys (`credit_manager.py`). */
export const STAGE_NAMES: Record<string, string> = {
  serp_seo: "Search and SEO analysis",
  title_generation: "Title",
  generate_outline: "Outline",
  deep_research: "Research",
  content_drafting: "Draft",
  featured_image: "Featured image",
  humanization: "Rewrite for a natural voice",
  eeat_optimization: "Experience and trust signals",
};

export const stageName = (key: string) =>
  STAGE_NAMES[key] ?? key.replaceAll("_", " ");

export const formatCount = (n: number) => n.toLocaleString("en-US");

/** "1 credit", "12 credits". */
export const formatCredits = (n: number) =>
  `${formatCount(n)} ${n === 1 ? "credit" : "credits"}`;

/** What each button starts, in the words of the credit gate's popup. */
const RUN_WORDS: Record<BilledRun, string> = {
  analyze: "Starting an article",
  change_keyword: "Changing the keyword",
  regenerate_outline: "Writing the outline again",
  generate: "Writing the article",
};

/**
 * The balance's figures once a live credits event moved it: each run's `can_run` and
 * `balance_after` from the backend's costs and minimums, and the whole articles it buys (a new
 * run's minimum is the backend's whole article).
 */
export function withBalance(
  credits: CreditBalance,
  balance: number,
): CreditBalance {
  const runs = credits.runs
    ? (Object.fromEntries(
        Object.entries(credits.runs).map(([key, run]) => {
          const canRun = balance >= run.minimum_balance;
          return [
            key,
            {
              ...run,
              can_run: canRun,
              balance_after: canRun ? balance - run.cost : null,
            },
          ];
        }),
      ) as Record<BilledRun, RunCost>)
    : undefined;
  const perArticle = credits.runs?.analyze.minimum_balance;
  return {
    ...credits,
    current_credits: balance,
    articles_remaining:
      credits.credits_per_month === null
        ? null
        : perArticle
          ? Math.floor(balance / perArticle)
          : credits.articles_remaining,
    ...(runs ? { runs } : {}),
  };
}

/** Why a run can't start, in the backend's numbers; null when it can (or the costs aren't known). */
export function shortfall(
  run: BilledRun,
  credits: CreditBalance,
): string | null {
  const cost = credits.runs?.[run];
  if (!cost || cost.can_run) return null;
  const have = formatCredits(credits.current_credits);
  if (cost.minimum_balance > cost.cost) {
    return `${RUN_WORDS[run]} needs ${formatCredits(cost.minimum_balance)} in hand, a whole article's worth, and you have ${have}.`;
  }
  return `${RUN_WORDS[run]} costs ${formatCredits(cost.cost)}, and you have ${have}.`;
}
