/**
 * A super admin's change to a user's credits (FB2.28): the line that says what will happen, the
 * body each action sends (no amount for a reset, an expiry only for an add), what the toast says
 * was really done, and the summary above the form. The most one change may carry is the backend's
 * to say: these readings take it as an argument and hold no number of their own.
 */

import { addDays, endOfDay, format } from "date-fns";
import type {
  AdminCreditAdjustmentResult,
  AdminCreditBreakdown,
} from "@/lib/api-client/admin-credits";
import {
  adjustmentOutcome,
  adjustmentRequest,
  type CreditAdjustmentFields,
  confirmationLine,
  creditAmountError,
  creditsSummary,
  parseCreditAmount,
} from "@/lib/billing/credit-adjustments";

const EMAIL = "x@example.com";
// Noon, so "today" is the same day wherever the test runs.
const NOW = new Date(2026, 9, 8, 12).getTime();
/** `limits.amount_max` as an API answer might send it; nothing in the client says this number. */
const AMOUNT_MAX = 2500;

const fields = (
  values: Partial<CreditAdjustmentFields>,
): CreditAdjustmentFields => ({
  action: "add",
  amount: "200",
  expires_at: "",
  reason: "Compensation for the outage",
  ...values,
});

describe("confirmationLine", () => {
  it("says what an add will do", () => {
    expect(confirmationLine(fields({}), EMAIL, 500, { now: NOW })).toBe(
      "Add 200 credits to x@example.com",
    );
    expect(
      confirmationLine(fields({ amount: "1" }), EMAIL, 500, { now: NOW }),
    ).toBe("Add 1 credit to x@example.com");
    expect(
      confirmationLine(fields({ amount: "1,500" }), EMAIL, 500, { now: NOW }),
    ).toBe("Add 1,500 credits to x@example.com");
  });

  it("names an add's expiry day", () => {
    expect(
      confirmationLine(fields({ expires_at: "2026-10-31" }), EMAIL, 500, {
        now: NOW,
      }),
    ).toBe(
      "Add 200 credits to x@example.com, expiring at the end of Oct 31, 2026",
    );
  });

  it("says what a deduct will do, and never names an expiry", () => {
    expect(
      confirmationLine(
        fields({ action: "deduct", amount: "50", expires_at: "2026-10-31" }),
        EMAIL,
        500,
        { now: NOW },
      ),
    ).toBe("Deduct 50 credits from x@example.com");
  });

  it("says what a reset will do, with the plan's amount when it has one", () => {
    expect(
      confirmationLine(fields({ action: "reset", amount: "" }), EMAIL, 500),
    ).toBe("Reset x@example.com's monthly credits to the plan's 500");
    expect(
      confirmationLine(fields({ action: "reset", amount: "" }), EMAIL, null),
    ).toBe("Reset x@example.com's monthly credits to the plan's amount");
  });

  it("says nothing while the amount or the expiry can't be sent", () => {
    for (const amount of ["", "0", "12.5", "ten"]) {
      expect(
        confirmationLine(fields({ amount }), EMAIL, 500, { now: NOW }),
      ).toBeNull();
      expect(
        confirmationLine(fields({ action: "deduct", amount }), EMAIL, 500, {
          now: NOW,
        }),
      ).toBeNull();
    }
    expect(
      confirmationLine(fields({ expires_at: "2026-10-07" }), EMAIL, 500, {
        now: NOW,
      }),
    ).toBeNull();
  });

  it("says nothing for more than the backend's ceiling, once it is known", () => {
    const known = { amountMax: AMOUNT_MAX, now: NOW };
    expect(
      confirmationLine(fields({ amount: "2500" }), EMAIL, 500, known),
    ).toBe("Add 2,500 credits to x@example.com");
    expect(
      confirmationLine(fields({ amount: "2501" }), EMAIL, 500, known),
    ).toBeNull();
    expect(
      confirmationLine(
        fields({ action: "deduct", amount: "2501" }),
        EMAIL,
        500,
        known,
      ),
    ).toBeNull();
    // Not known: the client has no ceiling of its own, and the backend refuses what is too much.
    expect(
      confirmationLine(fields({ amount: "2501" }), EMAIL, 500, { now: NOW }),
    ).toBe("Add 2,501 credits to x@example.com");
    expect(
      confirmationLine(fields({ amount: "9,000,000" }), EMAIL, 500, {
        now: NOW,
      }),
    ).toBe("Add 9,000,000 credits to x@example.com");
  });
});

describe("creditAmountError", () => {
  it.each([
    ["", "Enter how many credits"],
    ["   ", "Enter how many credits"],
    ["12.5", "Use a whole number"],
    ["-5", "Use a whole number"],
    ["ten", "Use a whole number"],
  ])("refuses %p, with or without a ceiling", (typed, message) => {
    expect(creditAmountError(typed)).toBe(message);
    expect(creditAmountError(typed, AMOUNT_MAX)).toBe(message);
  });

  it("keeps to the backend's ceiling when it is given, and names the range", () => {
    expect(creditAmountError("1", AMOUNT_MAX)).toBeNull();
    expect(creditAmountError("2,500", AMOUNT_MAX)).toBeNull();
    expect(creditAmountError("2501", AMOUNT_MAX)).toBe(
      "Enter a whole number from 1 to 2,500",
    );
    expect(creditAmountError("0", AMOUNT_MAX)).toBe(
      "Enter a whole number from 1 to 2,500",
    );
  });

  it("has no ceiling of its own: only a whole number of at least 1", () => {
    expect(creditAmountError("1")).toBeNull();
    expect(creditAmountError("2501")).toBeNull();
    expect(creditAmountError("9,000,000")).toBeNull();
    expect(creditAmountError("0")).toBe("Enter a whole number of at least 1");
  });
});

describe("adjustmentRequest", () => {
  it("sends an add's amount and trimmed reason, and no expiry when none is set", () => {
    expect(adjustmentRequest(fields({ reason: "  Goodwill  " }))).toEqual({
      action: "add",
      amount: 200,
      reason: "Goodwill",
    });
  });

  it("sends an add's expiry as the end of its day", () => {
    const day = addDays(new Date(), 30);
    const body = adjustmentRequest(
      fields({ amount: "1,500", expires_at: format(day, "yyyy-MM-dd") }),
    );
    expect(body).toEqual({
      action: "add",
      amount: 1500,
      reason: "Compensation for the outage",
      expires_at: endOfDay(day).toISOString(),
    });
  });

  it("sends a deduct's amount and never an expiry", () => {
    const body = adjustmentRequest(
      fields({ action: "deduct", amount: "50", expires_at: "2026-10-31" }),
    );
    expect(body).toEqual({
      action: "deduct",
      amount: 50,
      reason: "Compensation for the outage",
    });
    expect(body).not.toHaveProperty("expires_at");
  });

  it("sends the amount as a whole JSON number, never as it was typed", () => {
    // The backend's amount is a strict integer: "1500" and 1500.5 are both refused.
    expect(
      JSON.stringify(adjustmentRequest(fields({ amount: " 1,500 " }))),
    ).toBe(
      '{"action":"add","amount":1500,"reason":"Compensation for the outage"}',
    );
    expect(
      JSON.stringify(
        adjustmentRequest(fields({ action: "deduct", amount: "050" })),
      ),
    ).toBe(
      '{"action":"deduct","amount":50,"reason":"Compensation for the outage"}',
    );
  });

  it("sends a reset's body with no amount in it at all", () => {
    expect(
      JSON.stringify(
        adjustmentRequest(fields({ action: "reset", amount: "300" })),
      ),
    ).toBe('{"action":"reset","reason":"Compensation for the outage"}');
  });

  it("sends a reset with neither an amount nor an expiry", () => {
    const body = adjustmentRequest(
      fields({ action: "reset", amount: "300", expires_at: "2026-10-31" }),
    );
    expect(body).toEqual({
      action: "reset",
      reason: "Compensation for the outage",
    });
    expect(body).not.toHaveProperty("amount");
    expect(body).not.toHaveProperty("expires_at");
  });
});

describe("parseCreditAmount", () => {
  it("reads digits, with or without commas", () => {
    expect(parseCreditAmount(" 200 ")).toBe(200);
    expect(parseCreditAmount("100,000")).toBe(100000);
  });

  it("reads nothing else", () => {
    for (const typed of ["", "12.5", "-5", "1e3", "ten", "5 credits"]) {
      expect(parseCreditAmount(typed)).toBeNull();
    }
  });
});

const result = (
  fields: Partial<AdminCreditAdjustmentResult>,
): AdminCreditAdjustmentResult => ({
  action: "add",
  requested_amount: 200,
  amount: 200,
  balance_before: 500,
  balance_after: 700,
  monthly_credits: 500,
  admin_credits: 200,
  subscription_id: "sub-1",
  grant_id: "grant-1",
  audit_id: "audit-1",
  ...fields,
});

describe("adjustmentOutcome", () => {
  it("says what was added and the new balance", () => {
    expect(adjustmentOutcome(result({}), EMAIL)).toEqual({
      title: "200 credits added to x@example.com",
      description: "The balance is now 700 credits.",
    });
  });

  it("says what was deducted", () => {
    expect(
      adjustmentOutcome(
        result({
          action: "deduct",
          requested_amount: 50,
          amount: 50,
          balance_after: 450,
          grant_id: null,
        }),
        EMAIL,
      ),
    ).toEqual({
      title: "50 credits deducted from x@example.com",
      description: "The balance is now 450 credits.",
    });
  });

  it("says what was really taken when a deduct took less than asked", () => {
    expect(
      adjustmentOutcome(
        result({
          action: "deduct",
          requested_amount: 50,
          amount: 30,
          balance_before: 30,
          balance_after: 0,
          grant_id: null,
        }),
        EMAIL,
      ),
    ).toEqual({
      title: "30 credits deducted from x@example.com, not the 50 asked for",
      description:
        "That was all there was to take. The balance is now 0 credits.",
    });
  });

  it("says so when a deduct found nothing to take", () => {
    expect(
      adjustmentOutcome(
        result({
          action: "deduct",
          requested_amount: 50,
          amount: 0,
          balance_before: 0,
          balance_after: 0,
          grant_id: null,
        }),
        EMAIL,
      ),
    ).toEqual({
      title: "No credits deducted from x@example.com",
      description:
        "There were none to take of the 50 asked for. The balance is now 0 credits.",
    });
  });

  it("says what a reset set the month's credits to, and by how much it moved them", () => {
    const reset = (amount: number) =>
      adjustmentOutcome(
        result({
          action: "reset",
          requested_amount: null,
          amount,
          monthly_credits: 500,
          balance_after: 1700,
          grant_id: null,
        }),
        EMAIL,
      );
    expect(reset(120)).toEqual({
      title: "x@example.com's monthly credits reset to 500",
      description: "120 more than before. The balance is now 1,700 credits.",
    });
    expect(reset(-80).description).toBe(
      "80 fewer than before. The balance is now 1,700 credits.",
    );
    expect(reset(0).description).toBe(
      "They were already at that amount. The balance is now 1,700 credits.",
    );
  });
});

const breakdown = (
  fields: Partial<AdminCreditBreakdown>,
): AdminCreditBreakdown => ({
  subscription_id: "sub-1",
  plan_name: "Growth",
  current_credits: 1520,
  monthly_credits: 320,
  credits_per_month: 500,
  credits_reset_date: "2026-11-01T12:00:00Z",
  bonus: {
    label: "Launch bonus",
    promotion: "launch",
    credits: 1000,
    granted: 1000,
    expires_at: "2026-10-14T12:00:00Z",
  },
  added_credits: {
    credits: 200,
    granted: 250,
    expires_at: "2026-10-31T12:00:00Z",
  },
  period_adjustment: 0,
  ...fields,
});

describe("creditsSummary", () => {
  it("lists the plan, the month's credits, the added credits, the bonus and the period's end", () => {
    expect(creditsSummary(breakdown({}))).toEqual([
      { label: "Plan", value: "Growth" },
      { label: "Monthly credits", value: "320 of 500 left" },
      {
        label: "Added credits",
        value: "200 left of 250, soonest expiry Oct 31, 2026",
      },
      {
        label: "Bonus",
        value: "1,000 left of 1,000 (Launch bonus), until Oct 14, 2026",
      },
      { label: "Period ends", value: "Nov 1, 2026" },
      { label: "To spend now", value: "1,520 credits" },
    ]);
  });

  it("says when there is no plan, nothing added and no bonus", () => {
    expect(
      creditsSummary(
        breakdown({
          subscription_id: null,
          plan_name: null,
          current_credits: 0,
          monthly_credits: 0,
          credits_per_month: null,
          credits_reset_date: null,
          bonus: null,
          added_credits: null,
        }),
      ),
    ).toEqual([
      { label: "Plan", value: "No plan" },
      { label: "Monthly credits", value: "0 left" },
      { label: "Added credits", value: "None" },
      { label: "Bonus", value: "None" },
      { label: "Period ends", value: "No end date" },
      { label: "To spend now", value: "0 credits" },
    ]);
  });

  it("says added credits that never expire have no expiry", () => {
    const added = { credits: 200, granted: 200, expires_at: null };
    expect(creditsSummary(breakdown({ added_credits: added }))[2].value).toBe(
      "200 left of 200, no expiry",
    );
  });

  it("says what admins changed this period's monthly credits by, when they did", () => {
    const last = (period_adjustment: number) =>
      creditsSummary(breakdown({ period_adjustment })).at(-1);
    expect(last(120)).toEqual({
      label: "Changed by admins this period",
      value: "120 more monthly credits",
    });
    expect(last(-50)).toEqual({
      label: "Changed by admins this period",
      value: "50 fewer monthly credits",
    });
  });
});
