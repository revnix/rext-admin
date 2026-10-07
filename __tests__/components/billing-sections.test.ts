/**
 * Account settings' billing sections (F5): the plan's next date says what happens next for each
 * state, and amounts are the order's cents in its currency.
 */

import {
  againstAllowance,
  balanceLine,
  bonusWords,
  breakdownWords,
  formatAmount,
  monthlyCreditsLeft,
  nextDate,
  statusBesidePlan,
} from "@/components/billing/billing-format";
import {
  BillingPeriod,
  SubscriptionStatus,
  type UserSubscriptionDetail,
} from "@/types/subscription";

const subscription = (
  fields: Partial<UserSubscriptionDetail>,
): UserSubscriptionDetail =>
  ({
    id: "s",
    user_id: "u",
    plan_id: "p",
    plan_name: "growth",
    plan_display_name: "Growth",
    status: SubscriptionStatus.ACTIVE,
    billing_period: BillingPeriod.MONTHLY,
    start_date: null,
    end_date: null,
    trial_end_date: null,
    cancelled_at: null,
    current_api_calls: 0,
    current_credits: 0,
    credits_reset_date: null,
    created_at: "2026-10-01T00:00:00Z",
    lemonsqueezy_subscription_id: "ls-1",
    lemonsqueezy_customer_id: "c-1",
    ...fields,
  }) as UserSubscriptionDetail;

describe("nextDate", () => {
  it("says when an active plan renews", () => {
    expect(nextDate(subscription({ renews_at: "2026-11-06T10:00:00Z" }))).toBe(
      "It renews Nov 6, 2026.",
    );
  });

  it("says when a cancelled plan ends", () => {
    expect(
      nextDate(
        subscription({
          status: SubscriptionStatus.CANCELLED,
          ends_at: "2026-11-06T10:00:00Z",
        }),
      ),
    ).toBe("It ends Nov 6, 2026, and nothing more is charged.");
  });

  it("reads a cancelled plan's end from end_date, as the backend sends it (#529)", () => {
    expect(
      nextDate(
        subscription({
          status: SubscriptionStatus.CANCELLED,
          end_date: "2026-11-06T10:00:00Z",
        }),
      ),
    ).toBe("It ends Nov 6, 2026, and nothing more is charged.");
  });

  it("says when a trial ends", () => {
    expect(
      nextDate(
        subscription({
          status: SubscriptionStatus.TRIAL,
          trial_end_date: "2026-10-13T10:00:00Z",
        }),
      ),
    ).toBe("Your trial ends Oct 13, 2026.");
  });

  it("says nothing for an expired plan", () => {
    expect(
      nextDate(
        subscription({
          status: SubscriptionStatus.EXPIRED,
          renews_at: "2026-11-06T10:00:00Z",
        }),
      ),
    ).toBeNull();
  });
});

describe("formatAmount", () => {
  it("reads cents in the order's currency", () => {
    expect(formatAmount(8900, "USD")).toBe("$89.00");
    expect(formatAmount(3900, "EUR")).toBe("€39.00");
  });
});

describe("monthlyCreditsLeft and bonusWords", () => {
  it("sets the plan's own credits against its allowance, and the bonus apart", () => {
    const credits = {
      current_credits: 1500,
      monthly_credits: 500,
      bonus: {
        label: "Launch bonus",
        promotion: "launch",
        credits: 1000,
        granted: 1000,
        expires_at: "2026-10-14T06:59:00Z",
      },
    };
    expect(monthlyCreditsLeft(credits)).toBe(500);
    expect(bonusWords(credits)).toBe(
      "Plus 1,000 launch bonus credits, until Oct 14, 2026.",
    );
  });

  it("reads the total when the backend sends no monthly figure, and no bonus", () => {
    expect(monthlyCreditsLeft({ current_credits: 300 })).toBe(300);
    expect(bonusWords({ bonus: null })).toBeNull();
  });
});

describe("a balance against the plan's allowance (task 784)", () => {
  it("names the allowance at or under it, with the bar at its share", () => {
    expect(againstAllowance(412, 1000)).toEqual({
      over: false,
      of: 1000,
      meter: { value: 412, max: 1000 },
    });
    expect(againstAllowance(1000, 1000).of).toBe(1000);
    expect(balanceLine(412, 1000)).toBe("412 of 1,000 credits");
    expect(balanceLine(1000, 1000)).toBe("1,000 of 1,000 credits");
  });

  it("lets a balance above the allowance stand alone, with the bar full and no further", () => {
    // 150 credits added to a trial of 60: never "157 of 60".
    expect(againstAllowance(157, 60)).toEqual({
      over: true,
      of: null,
      meter: { value: 60, max: 60 },
    });
    expect(balanceLine(157, 60)).toBe("157 credits");
    expect(balanceLine(2000, 1000)).toBe("2,000 credits");
  });

  it("has no allowance to name or measure against on a plan without one", () => {
    expect(againstAllowance(120, null)).toEqual({
      over: false,
      of: null,
      meter: null,
    });
    expect(balanceLine(120, null)).toBe("120 credits");
    expect(againstAllowance(0, 0).meter).toBeNull();
  });

  it("never draws a bar under empty", () => {
    expect(againstAllowance(-5, 60).meter).toEqual({ value: 0, max: 60 });
  });

  it("says what the balance is made of while a bonus is left", () => {
    const launch = {
      current_credits: 1600,
      monthly_credits: 1000,
      bonus: {
        label: "Launch bonus",
        promotion: "launch",
        credits: 600,
        granted: 1000,
        expires_at: "2026-10-14T06:59:00Z",
      },
    };
    expect(breakdownWords(launch)).toBe("1,000 monthly + 600 launch bonus");
    expect(
      breakdownWords({ ...launch, bonus: { ...launch.bonus, credits: 0 } }),
    ).toBeNull();
    expect(breakdownWords({ current_credits: 300, bonus: null })).toBeNull();
  });
});

describe("statusBesidePlan", () => {
  const trial = { label: "Trial", tone: "neutral" };
  const active = { label: "Active", tone: "success" };
  const cancelled = { label: "Cancelled", tone: "neutral" };

  it("leaves out the trial's badge beside the plan named Trial", () => {
    expect(
      statusBesidePlan(SubscriptionStatus.TRIAL, trial, "Trial"),
    ).toBeUndefined();
    expect(
      statusBesidePlan(SubscriptionStatus.TRIAL, trial, " trial "),
    ).toBeUndefined();
  });

  it("keeps every other badge, whatever the plan is named", () => {
    expect(statusBesidePlan(SubscriptionStatus.ACTIVE, active, "Growth")).toBe(
      active,
    );
    expect(statusBesidePlan(SubscriptionStatus.TRIAL, trial, "Growth")).toBe(
      trial,
    );
    // An admin may name a plan anything: its status still shows.
    expect(statusBesidePlan(SubscriptionStatus.ACTIVE, active, "Active")).toBe(
      active,
    );
    expect(
      statusBesidePlan(SubscriptionStatus.CANCELLED, cancelled, "Cancelled"),
    ).toBe(cancelled);
    expect(statusBesidePlan(undefined, undefined, "Growth")).toBeUndefined();
  });
});
