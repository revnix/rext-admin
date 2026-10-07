/**
 * A super admin's change to a user's credits (FB2.28), in words and as the request: what the form
 * holds as typed, the body it sends, the line that says what will happen, and what the toast says
 * once it has. Kept apart from the dialog so tests stay light; `schemas/admin-schemas.ts` checks
 * the fields with the same readings of the amount and the expiry.
 */

import { endOfDay, isValid, parse } from "date-fns";
import type {
  AdminCreditAdjustmentRequest,
  AdminCreditAdjustmentResult,
  AdminCreditBreakdown,
} from "@/lib/api-client/admin-credits";
import { dateFormat } from "@/lib/formatters/date-formatters";
import type { CreditAdjustmentAction } from "@/types/subscription";
import { formatCount, formatCredits } from "./credits";

/** What may be added or deducted at once, and the reason's length (the backend's limits). */
export const CREDIT_AMOUNT_MAX = 100_000;
export const CREDIT_REASON_MIN = 3;
export const CREDIT_REASON_MAX = 500;

/** The form's fields as typed: the amount and the expiry's day are text until they are sent. */
export interface CreditAdjustmentFields {
  action: CreditAdjustmentAction;
  amount: string;
  /** The expiry's day, `yyyy-MM-dd` as a date input gives it; empty for credits that last. */
  expires_at: string;
  reason: string;
}

/**
 * The amount as a whole number: digits, with or without thousands commas; null for anything else.
 * The backend takes a JSON integer only, so the text never travels as typed.
 */
export function parseCreditAmount(typed: string): number | null {
  const digits = typed.trim().replace(/,/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

/** What is wrong with a typed amount, or null: a whole number from 1 to the limit. */
export function creditAmountError(typed: string): string | null {
  if (!typed.trim()) return "Enter how many credits";
  const amount = parseCreditAmount(typed);
  if (amount === null) return "Use a whole number";
  if (amount < 1 || amount > CREDIT_AMOUNT_MAX)
    return `Enter a whole number from 1 to ${formatCount(CREDIT_AMOUNT_MAX)}`;
  return null;
}

/**
 * When credits with this expiry day stop counting: the end of that day where the admin is. null
 * for no day, or text that isn't one.
 */
export function creditExpiry(day: string): Date | null {
  if (!day) return null;
  const parsed = parse(day, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? endOfDay(parsed) : null;
}

/** What is wrong with an add's expiry day, or null: empty, or a day that hasn't ended yet. */
export function creditExpiryError(
  day: string,
  now: number = Date.now(),
): string | null {
  if (!day) return null;
  const expiry = creditExpiry(day);
  if (!expiry) return "Enter a valid date";
  if (expiry.getTime() <= now) return "Choose today or a later day";
  return null;
}

/**
 * The body for the checked fields: the amount as a whole number, none at all for a reset, and an
 * expiry only on an add.
 */
export function adjustmentRequest(
  values: CreditAdjustmentFields,
): AdminCreditAdjustmentRequest {
  const reason = values.reason.trim();
  if (values.action === "reset") return { action: "reset", reason };
  const amount = parseCreditAmount(values.amount) ?? 0;
  if (values.action === "deduct") return { action: "deduct", amount, reason };
  const expiry = creditExpiry(values.expires_at);
  return {
    action: "add",
    amount,
    reason,
    ...(expiry ? { expires_at: expiry.toISOString() } : {}),
  };
}

/**
 * What submitting will do, in one line: "Add 200 credits to x@example.com". null while the amount or
 * the expiry can't be sent as typed, so the line never promises something else than the request.
 * `planCredits` is the plan's monthly amount, which a reset goes back to.
 */
export function confirmationLine(
  values: Pick<CreditAdjustmentFields, "action" | "amount" | "expires_at">,
  email: string,
  planCredits: number | null,
  now: number = Date.now(),
): string | null {
  if (values.action === "reset")
    return `Reset ${email}'s monthly credits to the plan's ${
      planCredits === null ? "amount" : formatCount(planCredits)
    }`;
  if (creditAmountError(values.amount)) return null;
  const amount = formatCredits(parseCreditAmount(values.amount) ?? 0);
  if (values.action === "deduct") return `Deduct ${amount} from ${email}`;
  if (creditExpiryError(values.expires_at, now)) return null;
  const expiry = creditExpiry(values.expires_at);
  return `Add ${amount} to ${email}${
    expiry ? `, expiring at the end of ${dateFormat.short(expiry)}` : ""
  }`;
}

/** What the submit button, and the question before a deduct or a reset, call each action. */
export const SUBMIT_LABELS: Record<CreditAdjustmentAction, string> = {
  add: "Add credits",
  deduct: "Deduct credits",
  reset: "Reset monthly credits",
};

/**
 * What the user can spend now, by where it comes from, as the dialog's summary: the plan, the
 * month's credits, the credits admins added (with the soonest expiry), a promotion's bonus and the
 * period's end.
 */
export function creditsSummary(
  credits: AdminCreditBreakdown,
): { label: string; value: string }[] {
  const { added_credits: added, bonus, period_adjustment: changed } = credits;
  return [
    { label: "Plan", value: credits.plan_name ?? "No plan" },
    {
      label: "Monthly credits",
      value:
        credits.credits_per_month === null
          ? `${formatCount(credits.monthly_credits)} left`
          : `${formatCount(credits.monthly_credits)} of ${formatCount(credits.credits_per_month)} left`,
    },
    {
      label: "Added credits",
      value: added
        ? `${formatCount(added.credits)} left of ${formatCount(added.granted)}, ${
            added.expires_at
              ? `soonest expiry ${dateFormat.short(added.expires_at)}`
              : "no expiry"
          }`
        : "None",
    },
    {
      label: "Bonus",
      value: bonus
        ? `${formatCount(bonus.credits)} left of ${formatCount(bonus.granted)} (${bonus.label})${
            bonus.expires_at
              ? `, until ${dateFormat.short(bonus.expires_at)}`
              : ""
          }`
        : "None",
    },
    {
      label: "Period ends",
      value: credits.credits_reset_date
        ? dateFormat.short(credits.credits_reset_date)
        : "No end date",
    },
    { label: "To spend now", value: formatCredits(credits.current_credits) },
    ...(changed
      ? [
          {
            label: "Changed by admins this period",
            value:
              changed > 0
                ? `${formatCount(changed)} more monthly credits`
                : `${formatCount(-changed)} fewer monthly credits`,
          },
        ]
      : []),
  ];
}

/**
 * What the change did, for the toast: the credits really added or taken, which for a deduct can be
 * fewer than asked for, and the balance it left.
 */
export function adjustmentOutcome(
  result: AdminCreditAdjustmentResult,
  email: string,
): { title: string; description: string } {
  const balance = `The balance is now ${formatCredits(result.balance_after)}.`;
  if (result.action === "add")
    return {
      title: `${formatCredits(result.amount)} added to ${email}`,
      description: balance,
    };
  if (result.action === "deduct") {
    const asked = result.requested_amount ?? result.amount;
    if (result.amount >= asked)
      return {
        title: `${formatCredits(result.amount)} deducted from ${email}`,
        description: balance,
      };
    if (result.amount <= 0)
      return {
        title: `No credits deducted from ${email}`,
        description: `There were none to take of the ${formatCount(asked)} asked for. ${balance}`,
      };
    return {
      title: `${formatCredits(result.amount)} deducted from ${email}, not the ${formatCount(asked)} asked for`,
      description: `That was all there was to take. ${balance}`,
    };
  }
  const change =
    result.amount > 0
      ? `${formatCount(result.amount)} more than before.`
      : result.amount < 0
        ? `${formatCount(-result.amount)} fewer than before.`
        : "They were already at that amount.";
  return {
    title: `${email}'s monthly credits reset to ${formatCount(result.monthly_credits)}`,
    description: `${change} ${balance}`,
  };
}
