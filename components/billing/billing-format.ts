import { dateFormat } from "@/lib/formatters/date-formatters";
import {
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
  if (status === SubscriptionStatus.CANCELLED && subscription.ends_at)
    return `It ends ${dateFormat.short(subscription.ends_at)}, and nothing more is charged.`;
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
