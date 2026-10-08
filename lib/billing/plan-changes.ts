/**
 * A super admin's change to a user's plan, or to a trial's end (FB2.29): what the dialog shows of
 * the backend's answer, the lines that say what a change will do and did, and the requests.
 *
 * Nothing here knows a plan, a price, a credit amount or a rule: which changes are allowed, how
 * each is billed, what the month's credits become and how far a trial may be moved all come with
 * `GET /admin/users/{id}/plan`. This module only puts them into words.
 */

import { addDays, isValid, parse, set, startOfDay } from "date-fns";
import type {
  AdminPlanBilling,
  AdminPlanChangeKind,
  AdminPlanChangeRequest,
  AdminPlanChangeResult,
  AdminPlanChoice,
  AdminPlanMode,
  AdminPlanPeriodChoice,
  AdminPlanSubscription,
  AdminTrialExtensionRequest,
  AdminTrialExtensionResult,
  AdminUserPlan,
} from "@/lib/api-client/admin-plan";
import type { User } from "@/lib/api-client/users";
import { formatCount } from "@/lib/billing/credits";
import { dateFormat } from "@/lib/formatters/date-formatters";

/** The plan form's fields as they are entered. */
export interface PlanChangeFields {
  plan_id: string;
  billing_period: string;
  billing: string;
  reason: string;
}

/** The trial form's fields as they are entered: the new end as a day ("2026-10-26"). */
export interface TrialExtensionFields {
  ends_on: string;
  reason: string;
}

const capitalized = (word: string) =>
  word ? word[0].toUpperCase() + word.slice(1) : word;

/** A status or a period as the backend names it, in words: "past_due" reads "Past due". */
const words = (value: string) => capitalized(value.replaceAll("_", " "));

/** A list price ("89.00") in the answer's currency: "$89.00". null when there is none. */
export function formatListPrice(
  price: string | null,
  currency: string,
): string | null {
  if (price === null || price.trim() === "") return null;
  const amount = Number(price);
  if (!Number.isFinite(amount)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

/** A plan's price for one period: "$89.00 a month", "$890.00 a year". */
export function periodPrice(
  plan: Partial<Pick<AdminPlanChoice, "price_monthly" | "price_yearly">>,
  period: string,
  currency: string,
): string | null {
  const price = formatListPrice(
    (period === "yearly" ? plan.price_yearly : plan.price_monthly) ?? null,
    currency,
  );
  return price && `${price} ${period === "yearly" ? "a year" : "a month"}`;
}

/** "500 credits a month", or that the plan has none. */
export function planCredits(creditsPerMonth: number | null): string {
  return creditsPerMonth === null
    ? "No monthly credits"
    : `${formatCount(creditsPerMonth)} credits a month`;
}

/**
 * The user's plan now, as the dialog's summary: the plan and its period, the status, when it
 * renews or the trial ends, the month's credits and whether Lemon Squeezy bills it.
 */
export function planSummary(
  subscription: AdminPlanSubscription | null,
): { label: string; value: string }[] {
  if (!subscription) return [{ label: "Plan", value: "No plan" }];
  const period = subscription.billing_period;
  return [
    {
      label: "Plan",
      value: period
        ? `${subscription.plan_display_name}, ${period}`
        : subscription.plan_display_name,
    },
    { label: "Status", value: words(subscription.status) },
    subscription.is_trial
      ? {
          label: "Trial ends",
          value: dateFormat.short(subscription.trial_ends_at) || "No end date",
        }
      : {
          label: "Renews",
          value: dateFormat.short(subscription.renews_at) || "No renewal date",
        },
    {
      label: "Monthly credits",
      value:
        subscription.credits_per_month === null
          ? `${formatCount(subscription.monthly_credits)} left`
          : `${formatCount(subscription.monthly_credits)} of ${formatCount(subscription.credits_per_month)} left`,
    },
    {
      label: "Billing",
      value: subscription.billed_by_provider
        ? "Through Lemon Squeezy"
        : "Not billed",
    },
  ];
}

/** Whether a plan can be chosen at all: in at least one period. */
export function planAvailable(choice: AdminPlanChoice): boolean {
  return choice.periods.some((period) => period.allowed);
}

/**
 * Why a plan can't be chosen, when none of its periods can: the reason of the user's own period
 * where the plan has it (the current plan says so there), else the first one given.
 */
export function planRefusal(
  choice: AdminPlanChoice,
  currentPeriod: string | null | undefined,
): string | null {
  if (planAvailable(choice)) return null;
  const own = choice.periods.find(
    (period) => period.billing_period === currentPeriod,
  );
  return (
    own?.refused_reason ??
    choice.periods.find((period) => period.refused_reason)?.refused_reason ??
    null
  );
}

/** The period a newly picked plan starts on: the user's own where it is allowed, else the first allowed. */
export function defaultPeriod(
  choice: AdminPlanChoice | undefined,
  currentPeriod: string | null | undefined,
): string {
  const allowed = choice?.periods.filter((period) => period.allowed) ?? [];
  return (
    (
      allowed.find((period) => period.billing_period === currentPeriod) ??
      allowed[0]
    )?.billing_period ?? ""
  );
}

/** The billing a newly picked period starts on: the backend's default where the period offers it. */
export function defaultBilling(
  period: AdminPlanPeriodChoice | undefined,
  preferred: AdminPlanBilling | null,
): string {
  const modes = period?.modes ?? [];
  return (
    (modes.find((mode) => mode.billing === preferred) ?? modes[0])?.billing ??
    ""
  );
}

/** The plan, the period and the billing the fields name, when the backend allows that choice. */
export function chosenChange(
  plan: Pick<AdminUserPlan, "plans">,
  values: Pick<PlanChangeFields, "plan_id" | "billing_period" | "billing">,
): {
  choice: AdminPlanChoice;
  period: AdminPlanPeriodChoice;
  mode: AdminPlanMode;
} | null {
  const choice = plan.plans.find((item) => item.id === values.plan_id);
  const period = choice?.periods.find(
    (item) => item.billing_period === values.billing_period && item.allowed,
  );
  const mode = period?.modes.find((item) => item.billing === values.billing);
  return choice && period && mode ? { choice, period, mode } : null;
}

/** What each way of billing is called. */
export const BILLING_LABELS: Record<AdminPlanBilling, string> = {
  next_renewal: "New price from the next renewal",
  charge_now: "Charge the difference now",
  not_billed: "Not billed",
};

/** What a way of billing does to the customer's money. */
export function billingDescription(
  billing: AdminPlanBilling,
  renewsAt: string | null | undefined,
): string {
  if (billing === "charge_now")
    return "Lemon Squeezy invoices the prorated difference now.";
  if (billing === "not_billed")
    return "This user isn't billed through Lemon Squeezy, so nothing is charged.";
  const renews = dateFormat.short(renewsAt);
  return `Nothing is charged now. The new price applies from ${
    renews || "the next renewal"
  }.`;
}

/** One row of a choice list: what it is called, the line under it, and whether it can be picked. */
export interface ChangeChoice {
  value: string;
  label: string;
  description: string;
  disabled: boolean;
}

/**
 * The plans to choose from: each with its monthly credits and the price of every period this user
 * can take it in, or, when none of its periods can be chosen, the backend's reason.
 */
export function planChoices(
  plan: Pick<AdminUserPlan, "plans" | "currency" | "subscription">,
): ChangeChoice[] {
  return plan.plans.map((choice) => {
    const prices = choice.periods
      .filter((period) => period.allowed)
      .map((period) =>
        periodPrice(choice, period.billing_period, plan.currency),
      )
      .filter(Boolean)
      .join(" or ");
    const refusal = planRefusal(choice, plan.subscription?.billing_period);
    return {
      value: choice.id,
      label: choice.display_name,
      description:
        refusal ??
        [prices, planCredits(choice.credits_per_month)]
          .filter(Boolean)
          .join(" · "),
      disabled: !planAvailable(choice),
    };
  });
}

const KIND_WORDS: Record<AdminPlanChangeKind, string> = {
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  period_change: "The same plan in another period",
};

/** A plan's periods: each with its price and which way it moves the user, or the reason it can't be chosen. */
export function periodChoices(
  choice: AdminPlanChoice | undefined,
  currency: string,
): ChangeChoice[] {
  return (choice?.periods ?? []).map((period) => ({
    value: period.billing_period,
    label: words(period.billing_period),
    description: period.allowed
      ? [
          periodPrice(choice ?? {}, period.billing_period, currency),
          KIND_WORDS[period.kind],
        ]
          .filter(Boolean)
          .join(" · ")
      : (period.refused_reason ?? "Not available for this user."),
    disabled: !period.allowed,
  }));
}

/** The ways a period can be billed, each with what it does to the customer's money. */
export function billingChoices(
  period: AdminPlanPeriodChoice | undefined,
  renewsAt: string | null | undefined,
): ChangeChoice[] {
  return (period?.allowed ? period.modes : []).map((mode) => ({
    value: mode.billing,
    label: BILLING_LABELS[mode.billing] ?? words(mode.billing),
    description: billingDescription(mode.billing, renewsAt),
    disabled: false,
  }));
}

/**
 * What submitting will do, in one paragraph: who moves to which plan and when, what the month's
 * credits become, and what happens to the money. null until the fields name a choice the backend
 * allows, so the line never promises something else than the request.
 */
export function planChangeLine(
  plan: Pick<AdminUserPlan, "plans" | "subscription">,
  values: Pick<PlanChangeFields, "plan_id" | "billing_period" | "billing">,
  email: string,
): string | null {
  const chosen = chosenChange(plan, values);
  if (!chosen) return null;
  const { choice, period, mode } = chosen;
  const renews = dateFormat.short(plan.subscription?.renews_at);
  const when =
    mode.plan_changes === "now"
      ? "now"
      : `at the renewal${renews ? ` on ${renews}` : ""}`;
  const credits =
    mode.monthly_credits_after === null
      ? ""
      : ` The month's credits become ${formatCount(mode.monthly_credits_after)}${
          plan.subscription
            ? ` (${formatCount(plan.subscription.monthly_credits)} now)`
            : ""
        }.`;
  return `Move ${email} to ${choice.display_name}, ${period.billing_period}, ${when}.${credits} ${billingDescription(
    mode.billing,
    plan.subscription?.renews_at,
  )}`;
}

/** The body for the checked fields. */
export function planChangeRequest(
  values: PlanChangeFields,
): AdminPlanChangeRequest {
  return {
    plan_id: values.plan_id,
    billing_period:
      values.billing_period as AdminPlanChangeRequest["billing_period"],
    billing: values.billing as AdminPlanBilling,
    reason: values.reason.trim(),
  };
}

/**
 * What the question before a change says under its title, for a change that asks first: one that
 * charges the customer now, or moves them to a smaller plan. null for one that is sent at once.
 */
export function beforePlanChange(
  kind: AdminPlanChangeKind,
  billing: AdminPlanBilling,
): string | null {
  if (billing === "charge_now")
    return "Lemon Squeezy charges the customer the prorated difference now.";
  if (kind === "downgrade")
    return "The customer moves to a smaller plan now, and nothing is credited for the rest of the period already paid.";
  return null;
}

/** What the change did, for the toast. */
export function planChangeOutcome(
  result: AdminPlanChangeResult,
  email: string,
): { title: string; description: string } {
  const renews = dateFormat.short(result.renews_at);
  const money =
    result.billing === "charge_now"
      ? "Lemon Squeezy has invoiced the prorated difference."
      : result.billing === "not_billed"
        ? "Nothing was billed."
        : `The new price applies from ${renews || "the next renewal"}.`;
  return {
    title: `${email} moved to ${result.new_plan.display_name}, ${result.new_billing_period}`,
    description: `The month's credits are now ${formatCount(result.monthly_credits_after)} (${formatCount(result.monthly_credits_before)} before). ${money}`,
  };
}

/**
 * The instant a trial ends when moved to this day: that day where the admin is, at the time of day
 * the trial ends now, so only the day moves. A trial with no end yet ends when the day does. null
 * for no day, or text that isn't one.
 */
export function trialEnd(
  day: string,
  currentEnd: string | null | undefined,
): Date | null {
  if (!day) return null;
  const parsed = parse(day, "yyyy-MM-dd", new Date());
  if (!isValid(parsed)) return null;
  const current = currentEnd ? new Date(currentEnd) : null;
  if (!current || !isValid(current))
    return set(parsed, {
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 0,
    });
  return set(parsed, {
    hours: current.getHours(),
    minutes: current.getMinutes(),
    seconds: current.getSeconds(),
    milliseconds: current.getMilliseconds(),
  });
}

/** Whether an end is one the backend takes: later than the current end, within its two limits. */
function endAllowed(
  end: Date,
  extension: AdminUserPlan["trial_extension"],
  currentEnd: string | null | undefined,
): boolean {
  const time = end.getTime();
  const current = currentEnd ? Date.parse(currentEnd) : Number.NaN;
  if (!Number.isNaN(current) && time <= current) return false;
  const earliest = extension.earliest_ends_at
    ? Date.parse(extension.earliest_ends_at)
    : Number.NaN;
  if (!Number.isNaN(earliest) && time < earliest) return false;
  const latest = extension.latest_ends_at
    ? Date.parse(extension.latest_ends_at)
    : Number.NaN;
  return Number.isNaN(latest) || time <= latest;
}

/**
 * The first and the last day the date field may hold, from the backend's two limits. null when it
 * sent none, or when no day fits between them.
 */
export function trialDayLimits(
  extension: AdminUserPlan["trial_extension"],
  currentEnd: string | null | undefined,
): { min: string; max: string } | null {
  if (!extension.earliest_ends_at || !extension.latest_ends_at) return null;
  const first = startOfDay(new Date(extension.earliest_ends_at));
  const last = startOfDay(new Date(extension.latest_ends_at));
  if (!isValid(first) || !isValid(last)) return null;
  const days: string[] = [];
  // The backend's window is a month; a year of days is the most this ever walks.
  for (
    let day = first, walked = 0;
    day.getTime() <= last.getTime() && walked < 366;
    day = addDays(day, 1), walked += 1
  ) {
    const iso = dateFormat.iso(day);
    const end = trialEnd(iso, currentEnd);
    if (end && endAllowed(end, extension, currentEnd)) days.push(iso);
  }
  return days.length > 0 ? { min: days[0], max: days[days.length - 1] } : null;
}

/** What is wrong with the trial's new day, or null. */
export function trialEndError(
  day: string,
  extension: AdminUserPlan["trial_extension"],
  currentEnd: string | null | undefined,
): string | null {
  if (!day) return "Choose the day the trial ends";
  const end = trialEnd(day, currentEnd);
  if (!end) return "Enter a valid date";
  if (endAllowed(end, extension, currentEnd)) return null;
  const limits = trialDayLimits(extension, currentEnd);
  if (!limits) return "Choose a later day";
  return limits.min === limits.max
    ? `Choose ${dateFormat.short(limits.min)}`
    : `Choose a day from ${dateFormat.short(limits.min)} to ${dateFormat.short(limits.max)}`;
}

/**
 * What submitting will do, in one line: "Extend x@example.com's trial to Oct 26, 2026 (it ends
 * Oct 12, 2026 now)". null while the day can't be sent as entered.
 */
export function trialExtensionLine(
  values: Pick<TrialExtensionFields, "ends_on">,
  plan: Pick<AdminUserPlan, "subscription" | "trial_extension">,
  email: string,
  now: number = Date.now(),
): string | null {
  const currentEnd = plan.subscription?.trial_ends_at;
  if (trialEndError(values.ends_on, plan.trial_extension, currentEnd))
    return null;
  const end = trialEnd(values.ends_on, currentEnd);
  if (!end) return null;
  const current = dateFormat.short(currentEnd);
  const before = !current
    ? ""
    : Date.parse(currentEnd ?? "") <= now
      ? ` (it ended ${current})`
      : ` (it ends ${current} now)`;
  return `Extend ${email}'s trial to ${dateFormat.short(end)}${before}`;
}

/** The body for the checked fields. */
export function trialExtensionRequest(
  values: TrialExtensionFields,
  currentEnd: string | null | undefined,
): AdminTrialExtensionRequest {
  const end = trialEnd(values.ends_on, currentEnd);
  return {
    ends_at: (end ?? new Date(Number.NaN)).toISOString(),
    reason: values.reason.trim(),
  };
}

/** What the extension did, for the toast. */
export function trialExtensionOutcome(
  result: AdminTrialExtensionResult,
  email: string,
): { title: string; description: string } {
  const before = dateFormat.short(result.trial_ended_at_before);
  return {
    title: `${email}'s trial now ends ${dateFormat.short(result.trial_ends_at)}`,
    description: before
      ? `Before, its end was ${before}.`
      : "It had no end date before.",
  };
}

/**
 * A row's plan in Admin > Users: its name, and beside it the trial or the billing period. A row
 * from an API that doesn't send the plan yet is not known, which is not "No plan".
 */
export function planCell(
  row: Pick<User, "plan_display_name" | "is_trial" | "billing_period">,
): { name: string; detail: string | null } | "none" | "unknown" {
  if (row.plan_display_name === undefined) return "unknown";
  if (row.plan_display_name === null) return "none";
  const name = row.plan_display_name;
  // A trial's plan is usually named "Trial": the word is said once.
  const detail = row.is_trial
    ? name.trim().toLowerCase() === "trial"
      ? null
      : "Trial"
    : row.billing_period
      ? words(row.billing_period)
      : null;
  return { name, detail };
}

/**
 * The same in one line, for a row drawn as a card: "Growth, monthly", "Trial", "No plan". null
 * when the plan isn't known, so the card says nothing rather than something untrue.
 */
export function planWords(
  row: Pick<User, "plan_display_name" | "is_trial" | "billing_period">,
): string | null {
  const plan = planCell(row);
  if (plan === "unknown") return null;
  if (plan === "none") return "No plan";
  return plan.detail ? `${plan.name}, ${plan.detail.toLowerCase()}` : plan.name;
}

/** What the row action is called: a trial can only be extended, any other plan changed. */
export function planActionLabel(row: Pick<User, "is_trial">): string {
  return row.is_trial ? "Extend trial" : "Change plan";
}
