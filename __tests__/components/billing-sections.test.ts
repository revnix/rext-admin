/**
 * Account settings' billing sections (F5): the plan's next date says what happens next for each
 * state, and amounts are the order's cents in its currency.
 */

import { formatAmount, nextDate } from "@/components/billing/billing-format";
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
