import { dateFormat } from "@/lib/formatters/date-formatters";
import {
  type CreditBalance,
  SubscriptionStatus,
  type UserSubscriptionDetail,
} from "@/types/subscription";

/** Words and figures the billing sections share, kept apart from the components so tests stay light. */

/** A plan the person pays for and still has: change and cancel apply to it. */
export const HOLDS_A_PAID_PLAN = new Set<string>([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.SUSPENDED,
  SubscriptionStatus.PAUSED,
]);

/** When the plan renews, ends, or the trial does, in one sentence. */
export function nextDate(subscription: UserSubscriptionDetail): string | null {
  const status = subscription.status;
  if (status === SubscriptionStatus.TRIAL && subscription.trial_end_date)
    return `Your trial ends ${dateFormat.short(subscription.trial_end_date)}.`;
  // The backend's subscription carries end_date; ends_at is the older field name.
  const ends = subscription.ends_at ?? subscription.end_date;
  if (status === SubscriptionStatus.CANCELLED && ends)
    return `It ends ${dateFormat.short(ends)}, and nothing more is charged.`;
  const renews = subscription.renews_at ?? subscription.current_period_end;
  if (renews && HOLDS_A_PAID_PLAN.has(status))
    return `It renews ${dateFormat.short(renews)}.`;
  return null;
}

/** Cents in the order's currency, as Lemon Squeezy reports them. */
export function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

/**
 * The plan's credits left this period, without a bonus, to set against the plan's allowance; a
 * bonus is shown apart. A backend that doesn't send `monthly_credits` sends no bonus either.
 */
export function monthlyCreditsLeft(
  credits: Pick<CreditBalance, "current_credits" | "monthly_credits">,
): number {
  return credits.monthly_credits ?? credits.current_credits;
}

/** "Plus 1,000 launch bonus credits, until Oct 14, 2026." or null. */
export function bonusWords(
  credits: Pick<CreditBalance, "bonus">,
): string | null {
  const bonus = credits.bonus;
  if (!bonus || bonus.credits <= 0) return null;
  return `Plus ${bonus.credits.toLocaleString()} ${bonus.label.toLowerCase()} credits${
    bonus.expires_at ? `, until ${dateFormat.short(bonus.expires_at)}` : ""
  }.`;
}

/**
 * What the credits answer says about the plan behind them. The backend sends `articles_remaining`
 * null only for a plan with no monthly allowance ("unlimited"); with nothing that grants access it
 * sends no allowance and 0 articles ("none"). Any allowance is "metered".
 */
export function creditsPlan(
  credits: Pick<CreditBalance, "credits_per_month" | "articles_remaining">,
): "metered" | "unlimited" | "none" {
  if (credits.articles_remaining === null) return "unlimited";
  if (credits.credits_per_month === null) return "none";
  return "metered";
}

/**
 * The status badge beside the plan's name, or none on the trial: its plan is named "Trial", so a
 * "Trial" badge would only say the name again. Every other status shows, whatever the plan is
 * called (an admin may name a plan anything).
 */
export function statusBesidePlan<T>(
  status: string | undefined,
  words: T | undefined,
  planName: string,
): T | undefined {
  if (
    status === SubscriptionStatus.TRIAL &&
    planName.trim().toLowerCase() === "trial"
  )
    return undefined;
  return words;
}
