/**
 * What the plan dialog reads from the backend's answer (FB2.29): the summary, the three lists of
 * choices with the backend's own refusals, the line that says what a change will do, the question
 * before a change that charges or downgrades, the requests, the toasts, a trial's new end and its
 * limits, and a row's plan in Admin > Users. No plan, price, credit amount or rule is held here:
 * every number below comes from the fixture.
 */

import {
  BILLING_LABELS,
  beforePlanChange,
  billingChoices,
  billingDescription,
  chosenChange,
  defaultBilling,
  defaultPeriod,
  formatListPrice,
  periodChoices,
  periodPrice,
  planActionLabel,
  planCell,
  planChangeLine,
  planChangeOutcome,
  planChangeRequest,
  planChoices,
  planCredits,
  planRefusal,
  planSummary,
  planWords,
  trialDayLimits,
  trialEnd,
  trialEndError,
  trialExtensionLine,
  trialExtensionOutcome,
  trialExtensionRequest,
} from "@/lib/billing/plan-changes";
import {
  adminPlan,
  adminTrialPlan,
  adminUnbilledPlan,
  CURRENT_REASON,
  GROWTH,
  PERIOD_REASON,
  SCALE,
  STARTER,
} from "../fixtures/admin-plan";

const EMAIL = "x@example.com";
const TO_SCALE = {
  plan_id: "plan-scale",
  billing_period: "monthly",
  billing: "next_renewal",
};

describe("prices and credits", () => {
  it("formats a list price in the answer's currency", () => {
    expect(formatListPrice("89.00", "USD")).toBe("$89.00");
    expect(formatListPrice("1990.00", "USD")).toBe("$1,990.00");
    expect(formatListPrice("89.00", "EUR")).toBe("€89.00");
  });

  it("has no price for none, or for text that isn't one", () => {
    expect(formatListPrice(null, "USD")).toBeNull();
    expect(formatListPrice("", "USD")).toBeNull();
    expect(formatListPrice("free", "USD")).toBeNull();
  });

  it("says a period's price by its period", () => {
    expect(periodPrice(SCALE, "monthly", "USD")).toBe("$199.00 a month");
    expect(periodPrice(SCALE, "yearly", "USD")).toBe("$1,990.00 a year");
    expect(
      periodPrice({ ...SCALE, price_yearly: null }, "yearly", "USD"),
    ).toBeNull();
  });

  it("says a plan's monthly credits, or that it has none", () => {
    expect(planCredits(1500)).toBe("1,500 credits a month");
    expect(planCredits(null)).toBe("No monthly credits");
  });
});

describe("the summary of the plan now", () => {
  it("shows the plan with its period, the status, the renewal, the credits and who bills it", () => {
    expect(planSummary(adminPlan().subscription)).toEqual([
      { label: "Plan", value: "Growth, monthly" },
      { label: "Status", value: "Active" },
      { label: "Renews", value: "Nov 1, 2026" },
      { label: "Monthly credits", value: "320 of 500 left" },
      { label: "Billing", value: "Through Lemon Squeezy" },
    ]);
  });

  it("shows a trial's end in place of a renewal, and that nothing bills it", () => {
    expect(planSummary(adminTrialPlan().subscription)).toEqual([
      { label: "Plan", value: "Trial" },
      { label: "Status", value: "Trial" },
      { label: "Trial ends", value: "Oct 12, 2026" },
      { label: "Monthly credits", value: "40 of 60 left" },
      { label: "Billing", value: "Not billed" },
    ]);
  });

  it("reads a status of two words, and a plan without monthly credits", () => {
    const subscription = adminPlan().subscription;
    if (!subscription) throw new Error("the fixture has a subscription");
    const rows = planSummary({
      ...subscription,
      status: "past_due",
      renews_at: null,
      credits_per_month: null,
    });
    expect(rows[1].value).toBe("Past due");
    expect(rows[2].value).toBe("No renewal date");
    expect(rows[3].value).toBe("320 left");
  });

  it("says so when nothing grants access", () => {
    expect(planSummary(null)).toEqual([{ label: "Plan", value: "No plan" }]);
  });
});

describe("the plans to choose from", () => {
  it("lists each plan with its credits and the price of every period this user can take it in, and the backend's reason on one that can't be chosen", () => {
    expect(planChoices(adminPlan())).toEqual([
      {
        value: "plan-starter",
        label: "Starter",
        // Billed monthly by Lemon Squeezy: the yearly price isn't on offer, so it isn't shown.
        description: "$29.00 a month · 150 credits a month",
        disabled: false,
      },
      {
        value: "plan-growth",
        label: "Growth",
        description: CURRENT_REASON,
        disabled: true,
      },
      {
        value: "plan-scale",
        label: "Scale",
        description: "$199.00 a month · 1,500 credits a month",
        disabled: false,
      },
    ]);
    // A user nobody bills can take either period, and their own plan in the other one.
    expect(
      planChoices(adminUnbilledPlan()).map((choice) => choice.description),
    ).toEqual([
      "$29.00 a month or $290.00 a year · 150 credits a month",
      "$890.00 a year · 500 credits a month",
      "$199.00 a month or $1,990.00 a year · 1,500 credits a month",
    ]);
  });

  it("gives a refused plan the reason of the user's own period, else the first one", () => {
    expect(planRefusal(GROWTH, "monthly")).toBe(CURRENT_REASON);
    expect(planRefusal(GROWTH, "yearly")).toBe(PERIOD_REASON);
    expect(planRefusal(GROWTH, null)).toBe(CURRENT_REASON);
    expect(planRefusal(SCALE, "monthly")).toBeNull();
  });

  it("lists a plan's periods with the price, which way it moves the user, or the reason", () => {
    expect(periodChoices(SCALE, "USD")).toEqual([
      {
        value: "monthly",
        label: "Monthly",
        description: "$199.00 a month · Upgrade",
        disabled: false,
      },
      {
        value: "yearly",
        label: "Yearly",
        description: PERIOD_REASON,
        disabled: true,
      },
    ]);
    expect(periodChoices(STARTER, "USD")[0].description).toBe(
      "$29.00 a month · Downgrade",
    );
    const unbilled = adminUnbilledPlan().plans;
    expect(periodChoices(unbilled[2], "USD")[1]).toEqual({
      value: "yearly",
      label: "Yearly",
      description: "$1,990.00 a year · Upgrade",
      disabled: false,
    });
    expect(periodChoices(unbilled[1], "USD")[1].description).toBe(
      "$890.00 a year · The same plan in another period",
    );
    expect(periodChoices(GROWTH, "USD")).toEqual([
      {
        value: "monthly",
        label: "Monthly",
        description: CURRENT_REASON,
        disabled: true,
      },
      {
        value: "yearly",
        label: "Yearly",
        description: PERIOD_REASON,
        disabled: true,
      },
    ]);
    expect(periodChoices(undefined, "USD")).toEqual([]);
  });

  it("lists only the ways of billing the backend offers for that period", () => {
    const renews = adminPlan().subscription?.renews_at;
    expect(
      billingChoices(SCALE.periods[0], renews).map((c) => c.value),
    ).toEqual(["next_renewal", "charge_now"]);
    // A downgrade is never charged now: the backend doesn't offer it, so it isn't listed.
    expect(billingChoices(STARTER.periods[0], renews)).toEqual([
      {
        value: "next_renewal",
        label: BILLING_LABELS.next_renewal,
        description:
          "Nothing is charged now. The new price applies from Nov 1, 2026.",
        disabled: false,
      },
    ]);
    expect(billingChoices(GROWTH.periods[0], renews)).toEqual([]);
    expect(billingChoices(undefined, renews)).toEqual([]);
  });

  it("says what each way of billing does to the money", () => {
    expect(billingDescription("charge_now", "2026-11-01T12:00:00Z")).toBe(
      "Lemon Squeezy invoices the prorated difference now.",
    );
    expect(billingDescription("not_billed", null)).toBe(
      "This user isn't billed through Lemon Squeezy, so nothing is charged.",
    );
    expect(billingDescription("next_renewal", null)).toBe(
      "Nothing is charged now. The new price applies from the next renewal.",
    );
  });

  it("starts a picked plan on the user's own period, else on the first allowed one", () => {
    expect(defaultPeriod(adminUnbilledPlan().plans[2], "yearly")).toBe(
      "yearly",
    );
    // Their own period isn't on offer for this plan: the one that is.
    expect(defaultPeriod(SCALE, "yearly")).toBe("monthly");
    expect(defaultPeriod(SCALE, "lifetime")).toBe("monthly");
    expect(defaultPeriod(SCALE, null)).toBe("monthly");
    expect(defaultPeriod(GROWTH, "monthly")).toBe("");
    expect(defaultPeriod(undefined, "monthly")).toBe("");
  });

  it("starts a picked period on the backend's default billing, else on the first offered", () => {
    expect(defaultBilling(SCALE.periods[0], "charge_now")).toBe("charge_now");
    expect(defaultBilling(SCALE.periods[0], "not_billed")).toBe("next_renewal");
    expect(defaultBilling(SCALE.periods[0], null)).toBe("next_renewal");
    expect(defaultBilling(GROWTH.periods[0], "next_renewal")).toBe("");
  });

  it("names a choice only when the backend allows all three parts of it", () => {
    expect(chosenChange(adminPlan(), TO_SCALE)?.mode.billing).toBe(
      "next_renewal",
    );
    expect(
      chosenChange(adminPlan(), { ...TO_SCALE, plan_id: "plan-growth" }),
    ).toBeNull();
    expect(
      chosenChange(adminPlan(), {
        plan_id: "plan-starter",
        billing_period: "monthly",
        billing: "charge_now",
      }),
    ).toBeNull();
    expect(chosenChange(adminPlan(), { ...TO_SCALE, billing: "" })).toBeNull();
  });
});

describe("the line that says what a change will do", () => {
  it("says who moves where and when, the credits the backend sent, and the money", () => {
    expect(planChangeLine(adminPlan(), TO_SCALE, EMAIL)).toBe(
      "Move x@example.com to Scale, monthly, now. The month's credits become 1,320 (320 now). Nothing is charged now. The new price applies from Nov 1, 2026.",
    );
    expect(
      planChangeLine(
        adminPlan(),
        { ...TO_SCALE, billing: "charge_now" },
        EMAIL,
      ),
    ).toBe(
      "Move x@example.com to Scale, monthly, now. The month's credits become 1,320 (320 now). Lemon Squeezy invoices the prorated difference now.",
    );
    expect(
      planChangeLine(
        adminUnbilledPlan(),
        {
          plan_id: "plan-scale",
          billing_period: "yearly",
          billing: "not_billed",
        },
        EMAIL,
      ),
    ).toBe(
      "Move x@example.com to Scale, yearly, now. The month's credits become 1,320 (320 now). This user isn't billed through Lemon Squeezy, so nothing is charged.",
    );
    // A period the backend refuses for this user names no change.
    expect(
      planChangeLine(
        adminPlan(),
        { ...TO_SCALE, billing_period: "yearly" },
        EMAIL,
      ),
    ).toBeNull();
  });

  it("reads when the plan changes from the answer, not from a rule of its own", () => {
    const later = adminPlan({
      plans: [
        {
          ...SCALE,
          periods: [
            {
              ...SCALE.periods[0],
              modes: [
                {
                  billing: "next_renewal",
                  plan_changes: "at_renewal",
                  monthly_credits_after: null,
                },
              ],
            },
          ],
        },
      ],
    });
    expect(planChangeLine(later, TO_SCALE, EMAIL)).toBe(
      "Move x@example.com to Scale, monthly, at the renewal on Nov 1, 2026. Nothing is charged now. The new price applies from Nov 1, 2026.",
    );
  });

  it("says nothing until the fields name a choice the backend allows", () => {
    expect(
      planChangeLine(
        adminPlan(),
        { plan_id: "", billing_period: "", billing: "" },
        EMAIL,
      ),
    ).toBeNull();
    expect(
      planChangeLine(adminPlan(), { ...TO_SCALE, billing: "" }, EMAIL),
    ).toBeNull();
    expect(
      planChangeLine(
        adminPlan(),
        { ...TO_SCALE, plan_id: "plan-growth" },
        EMAIL,
      ),
    ).toBeNull();
  });
});

describe("sending a plan change", () => {
  it("asks first only before a charge now or a downgrade", () => {
    expect(beforePlanChange("upgrade", "next_renewal")).toBeNull();
    expect(beforePlanChange("upgrade", "not_billed")).toBeNull();
    expect(beforePlanChange("upgrade", "charge_now")).toBe(
      "Lemon Squeezy charges the customer the prorated difference now.",
    );
    expect(beforePlanChange("downgrade", "next_renewal")).toBe(
      "The customer moves to a smaller plan now, and nothing is credited for the rest of the period already paid.",
    );
  });

  it("builds the body with the reason trimmed", () => {
    expect(
      planChangeRequest({ ...TO_SCALE, reason: "  Asked by phone  " }),
    ).toEqual({
      plan_id: "plan-scale",
      billing_period: "monthly",
      billing: "next_renewal",
      reason: "Asked by phone",
    });
  });

  const result = {
    subscription_id: "sub-1",
    old_plan: { id: "plan-growth", name: "growth", display_name: "Growth" },
    new_plan: { id: "plan-scale", name: "scale", display_name: "Scale" },
    old_billing_period: "monthly" as const,
    new_billing_period: "yearly" as const,
    billing: "next_renewal" as const,
    monthly_credits_before: 320,
    monthly_credits_after: 1320,
    renews_at: "2026-11-01T12:00:00Z",
    audit_id: "audit-1",
  };

  it("says what the change did, with the credits the backend reported", () => {
    expect(planChangeOutcome(result, EMAIL)).toEqual({
      title: "x@example.com moved to Scale, yearly",
      description:
        "The month's credits are now 1,320 (320 before). The new price applies from Nov 1, 2026.",
    });
  });

  it("says what happened to the money for each way of billing", () => {
    expect(
      planChangeOutcome({ ...result, billing: "charge_now" }, EMAIL)
        .description,
    ).toBe(
      "The month's credits are now 1,320 (320 before). Lemon Squeezy has invoiced the prorated difference.",
    );
    expect(
      planChangeOutcome({ ...result, billing: "not_billed" }, EMAIL)
        .description,
    ).toBe(
      "The month's credits are now 1,320 (320 before). Nothing was billed.",
    );
    expect(
      planChangeOutcome({ ...result, renews_at: null }, EMAIL).description,
    ).toBe(
      "The month's credits are now 1,320 (320 before). The new price applies from the next renewal.",
    );
  });
});

describe("a trial's new end", () => {
  const trial = adminTrialPlan();
  const currentEnd = trial.subscription?.trial_ends_at;

  it("moves only the day: the time of day stays the one the trial ends at now", () => {
    expect(trialEnd("2026-10-26", currentEnd)?.toISOString()).toBe(
      "2026-10-26T12:00:00.000Z",
    );
  });

  it("ends with the day for a trial that has no end yet", () => {
    const end = trialEnd("2026-10-26", null);
    expect(end?.getHours()).toBe(23);
    expect(end?.getMinutes()).toBe(59);
  });

  it("has no end for no day, or for text that isn't one", () => {
    expect(trialEnd("", currentEnd)).toBeNull();
    expect(trialEnd("soon", currentEnd)).toBeNull();
  });

  it("takes the date field's first and last day from the backend's two limits", () => {
    // The 12th itself would be the current end again, which is not later.
    expect(trialDayLimits(trial.trial_extension, currentEnd)).toEqual({
      min: "2026-10-13",
      max: "2026-11-07",
    });
  });

  it("has no limits when the backend sent none, or when no day fits", () => {
    expect(
      trialDayLimits(
        { ...trial.trial_extension, latest_ends_at: null },
        currentEnd,
      ),
    ).toBeNull();
    expect(
      trialDayLimits(
        {
          ...trial.trial_extension,
          latest_ends_at: "2026-10-12T18:00:00Z",
        },
        currentEnd,
      ),
    ).toBeNull();
  });

  it("refuses no day, a day that is no date, and a day outside the limits", () => {
    const check = (day: string) =>
      trialEndError(day, trial.trial_extension, currentEnd);
    expect(check("")).toBe("Choose the day the trial ends");
    expect(check("soon")).toBe("Enter a valid date");
    expect(check("2026-10-12")).toBe(
      "Choose a day from Oct 13, 2026 to Nov 7, 2026",
    );
    expect(check("2026-11-08")).toBe(
      "Choose a day from Oct 13, 2026 to Nov 7, 2026",
    );
    expect(check("2026-10-13")).toBeNull();
    expect(check("2026-11-07")).toBeNull();
  });

  it("leaves the limits to the backend when it sent none", () => {
    const open = {
      ...trial.trial_extension,
      earliest_ends_at: null,
      latest_ends_at: null,
    };
    expect(trialEndError("2027-01-01", open, currentEnd)).toBeNull();
    expect(trialEndError("2026-10-12", open, currentEnd)).toBe(
      "Choose a later day",
    );
  });

  it("says what the extension will do, and where the trial stands now", () => {
    const before = Date.parse("2026-10-08T05:00:00Z");
    expect(
      trialExtensionLine({ ends_on: "2026-10-26" }, trial, EMAIL, before),
    ).toBe(
      "Extend x@example.com's trial to Oct 26, 2026 (it ends Oct 12, 2026 now)",
    );
    const after = Date.parse("2026-10-13T05:00:00Z");
    expect(
      trialExtensionLine({ ends_on: "2026-10-26" }, trial, EMAIL, after),
    ).toBe(
      "Extend x@example.com's trial to Oct 26, 2026 (it ended Oct 12, 2026)",
    );
    expect(
      trialExtensionLine({ ends_on: "2026-11-08" }, trial, EMAIL, before),
    ).toBeNull();
    expect(
      trialExtensionLine({ ends_on: "" }, trial, EMAIL, before),
    ).toBeNull();
  });

  it("builds the body: the end as an instant, the reason trimmed", () => {
    expect(
      trialExtensionRequest(
        { ends_on: "2026-10-26", reason: "  Needs another week  " },
        currentEnd,
      ),
    ).toEqual({
      ends_at: "2026-10-26T12:00:00.000Z",
      reason: "Needs another week",
    });
  });

  it("says what the extension did", () => {
    expect(
      trialExtensionOutcome(
        {
          subscription_id: "sub-2",
          trial_ended_at_before: "2026-10-12T12:00:00Z",
          trial_ends_at: "2026-10-26T12:00:00Z",
          audit_id: "audit-2",
        },
        EMAIL,
      ),
    ).toEqual({
      title: "x@example.com's trial now ends Oct 26, 2026",
      description: "Before, its end was Oct 12, 2026.",
    });
    expect(
      trialExtensionOutcome(
        {
          subscription_id: "sub-2",
          trial_ended_at_before: null,
          trial_ends_at: "2026-10-26T12:00:00Z",
          audit_id: "audit-2",
        },
        EMAIL,
      ).description,
    ).toBe("It had no end date before.");
  });
});

describe("a row's plan in Admin > Users", () => {
  it("shows the plan with its billing period", () => {
    expect(
      planCell({
        plan_display_name: "Growth",
        is_trial: false,
        billing_period: "yearly",
      }),
    ).toEqual({ name: "Growth", detail: "Yearly" });
    expect(
      planCell({
        plan_display_name: "Founders",
        is_trial: false,
        billing_period: null,
      }),
    ).toEqual({ name: "Founders", detail: null });
  });

  it("says Trial once: beside a plan of another name, not beside one named Trial", () => {
    expect(
      planCell({
        plan_display_name: "Trial",
        is_trial: true,
        billing_period: null,
      }),
    ).toEqual({ name: "Trial", detail: null });
    expect(
      planCell({
        plan_display_name: "Growth",
        is_trial: true,
        billing_period: "monthly",
      }),
    ).toEqual({ name: "Growth", detail: "Trial" });
  });

  it("tells no plan from a plan the API didn't send", () => {
    expect(planCell({ plan_display_name: null, is_trial: false })).toBe("none");
    expect(planCell({})).toBe("unknown");
  });

  it("says the same in one line for a row drawn as a card, and nothing for a plan not known", () => {
    expect(
      planWords({
        plan_display_name: "Growth",
        is_trial: false,
        billing_period: "monthly",
      }),
    ).toBe("Growth, monthly");
    expect(
      planWords({
        plan_display_name: "Trial",
        is_trial: true,
        billing_period: null,
      }),
    ).toBe("Trial");
    expect(
      planWords({
        plan_display_name: "Growth",
        is_trial: true,
        billing_period: "monthly",
      }),
    ).toBe("Growth, trial");
    expect(planWords({ plan_display_name: null })).toBe("No plan");
    expect(planWords({})).toBeNull();
  });

  it("calls the row action by what it can do", () => {
    expect(planActionLabel({ is_trial: true })).toBe("Extend trial");
    expect(planActionLabel({ is_trial: false })).toBe("Change plan");
    expect(planActionLabel({})).toBe("Change plan");
  });
});
