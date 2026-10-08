/**
 * `GET /admin/users/{id}/plan` as the backend answers it (FB2.29), for the tests of the plan
 * dialog and of what it reads. A Growth customer on a monthly plan billed through Lemon Squeezy,
 * 180 of the month's 500 credits used: Starter is a downgrade, Scale an upgrade, Growth itself
 * can't be chosen, and no plan can be taken yearly, since a subscription Lemon Squeezy bills keeps
 * its billing period.
 */

import type {
  AdminPlanChoice,
  AdminPlanMode,
  AdminPlanPeriodChoice,
  AdminUserPlan,
} from "@/lib/api-client/admin-plan";

const modes = (
  after: number,
  ...billing: AdminPlanMode["billing"][]
): AdminPlanMode[] =>
  billing.map((mode) => ({
    billing: mode,
    plan_changes: "now",
    monthly_credits_after: after,
  }));

export const CURRENT_REASON = "This is the user's current plan and period.";
export const PERIOD_REASON =
  "This subscription is billed monthly: its billing period can't be changed from here yet.";

const refused = (
  billing_period: AdminPlanPeriodChoice["billing_period"],
  kind: AdminPlanPeriodChoice["kind"],
  refused_reason: string,
): AdminPlanPeriodChoice => ({
  billing_period,
  kind,
  allowed: false,
  refused_reason,
  modes: [],
});

const allowed = (
  billing_period: AdminPlanPeriodChoice["billing_period"],
  kind: AdminPlanPeriodChoice["kind"],
  choices: AdminPlanMode[],
): AdminPlanPeriodChoice => ({
  billing_period,
  kind,
  allowed: true,
  refused_reason: null,
  modes: choices,
});

export const STARTER: AdminPlanChoice = {
  id: "plan-starter",
  name: "starter",
  display_name: "Starter",
  price_monthly: "29.00",
  price_yearly: "290.00",
  credits_per_month: 150,
  periods: [
    allowed("monthly", "downgrade", modes(0, "next_renewal")),
    refused("yearly", "downgrade", PERIOD_REASON),
  ],
};

export const GROWTH: AdminPlanChoice = {
  id: "plan-growth",
  name: "growth",
  display_name: "Growth",
  price_monthly: "89.00",
  price_yearly: "890.00",
  credits_per_month: 500,
  periods: [
    refused("monthly", "period_change", CURRENT_REASON),
    refused("yearly", "period_change", PERIOD_REASON),
  ],
};

export const SCALE: AdminPlanChoice = {
  id: "plan-scale",
  name: "scale",
  display_name: "Scale",
  price_monthly: "199.00",
  price_yearly: "1990.00",
  credits_per_month: 1500,
  periods: [
    allowed("monthly", "upgrade", modes(1320, "next_renewal", "charge_now")),
    refused("yearly", "upgrade", PERIOD_REASON),
  ],
};

export const TRIAL_REASON =
  "A trial can't be moved to a paid plan here. Extend the trial or add credits instead.";

/** The answer for the Growth customer; `over` replaces top-level parts of it. */
export const adminPlan = (
  over: Partial<AdminUserPlan> = {},
): AdminUserPlan => ({
  user_id: "user-1",
  currency: "USD",
  subscription: {
    id: "sub-1",
    plan_id: "plan-growth",
    plan_name: "growth",
    plan_display_name: "Growth",
    status: "active",
    is_trial: false,
    billing_period: "monthly",
    billed_by_provider: true,
    renews_at: "2026-11-01T12:00:00Z",
    trial_ends_at: null,
    monthly_credits: 320,
    credits_per_month: 500,
  },
  change: {
    allowed: true,
    refused_reason: null,
    default_billing: "next_renewal",
  },
  trial_extension: {
    allowed: false,
    refused_reason: "This user isn't on a trial.",
    earliest_ends_at: null,
    latest_ends_at: null,
  },
  plans: [STARTER, GROWTH, SCALE],
  limits: { reason_min: 3, reason_max: 500 },
  ...over,
});

/**
 * The same customer when nobody bills them (a seeded or legacy row): every change is "not billed",
 * and the period can change too, on another plan or on their own.
 */
export const adminUnbilledPlan = (): AdminUserPlan => {
  const plan = adminPlan({
    change: {
      allowed: true,
      refused_reason: null,
      default_billing: "not_billed",
    },
  });
  const kinds = {
    "plan-starter": "downgrade",
    "plan-scale": "upgrade",
  } as const;
  return {
    ...plan,
    subscription: plan.subscription && {
      ...plan.subscription,
      billed_by_provider: false,
    },
    plans: plan.plans.map((choice) => ({
      ...choice,
      periods: (["monthly", "yearly"] as const).map((period) => {
        const own = choice.id === "plan-growth";
        if (own && period === "monthly")
          return refused(period, "period_change", CURRENT_REASON);
        return allowed(
          period,
          own ? "period_change" : kinds[choice.id as keyof typeof kinds],
          modes(
            Math.max(0, (choice.credits_per_month ?? 0) - 180),
            "not_billed",
          ),
        );
      }),
    })),
  };
};

/**
 * The answer for a trial user whose trial ends on 12 October 2026 at 12:00 UTC, read on the 8th:
 * no plan change, and an end anywhere up to 30 days from now.
 */
export const adminTrialPlan = (
  over: Partial<AdminUserPlan> = {},
): AdminUserPlan =>
  adminPlan({
    subscription: {
      id: "sub-2",
      plan_id: "plan-trial",
      plan_name: "trial",
      plan_display_name: "Trial",
      status: "trial",
      is_trial: true,
      billing_period: null,
      billed_by_provider: false,
      renews_at: null,
      trial_ends_at: "2026-10-12T12:00:00Z",
      monthly_credits: 40,
      credits_per_month: 60,
    },
    change: {
      allowed: false,
      refused_reason: TRIAL_REASON,
      default_billing: null,
    },
    trial_extension: {
      allowed: true,
      refused_reason: null,
      earliest_ends_at: "2026-10-12T12:00:00Z",
      latest_ends_at: "2026-11-07T12:00:00Z",
    },
    ...over,
  });
