/**
 * A super admin's change to a user's credits (FB2.28): the form refuses what the backend would,
 * an amount outside 1 to 100,000, a reason outside 3 to 500 characters, an expiry on a day that
 * has ended, and asks a reset for no amount.
 */

import { addDays, format } from "date-fns";
import {
  CREDIT_AMOUNT_MAX,
  CREDIT_REASON_MAX,
} from "@/lib/billing/credit-adjustments";
import {
  type AdminCreditAdjustmentValues,
  adminCreditAdjustmentSchema,
} from "@/schemas/admin-schemas";

const day = (fromToday: number) =>
  format(addDays(new Date(), fromToday), "yyyy-MM-dd");

const values = (
  fields: Partial<AdminCreditAdjustmentValues>,
): AdminCreditAdjustmentValues => ({
  action: "add",
  amount: "200",
  expires_at: "",
  reason: "Compensation for the outage",
  ...fields,
});

/** The messages the schema gives, by field. */
function errors(fields: Partial<AdminCreditAdjustmentValues>) {
  const result = adminCreditAdjustmentSchema.safeParse(values(fields));
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("adminCreditAdjustmentSchema", () => {
  it("accepts an add, a deduct and a reset that are filled in", () => {
    expect(errors({})).toEqual({});
    expect(errors({ action: "deduct", amount: "50" })).toEqual({});
    expect(errors({ action: "reset", amount: "" })).toEqual({});
  });

  it.each([
    ["the smallest amount", "1"],
    ["the largest amount", String(CREDIT_AMOUNT_MAX)],
    ["an amount written with commas", "100,000"],
  ])("accepts %s", (_case, amount) => {
    expect(errors({ amount })).toEqual({});
    expect(errors({ action: "deduct", amount })).toEqual({});
  });

  it.each([
    ["no amount", "", "Enter how many credits"],
    ["spaces only", "   ", "Enter how many credits"],
    ["zero", "0", "Enter a whole number from 1 to 100,000"],
    [
      "one past the limit",
      String(CREDIT_AMOUNT_MAX + 1),
      "Enter a whole number from 1 to 100,000",
    ],
    ["a fraction", "12.5", "Use a whole number"],
    ["a negative amount", "-5", "Use a whole number"],
    ["words", "ten", "Use a whole number"],
  ])("refuses %s to add or deduct", (_case, amount, message) => {
    expect(errors({ amount })).toEqual({ amount: message });
    expect(errors({ action: "deduct", amount })).toEqual({ amount: message });
  });

  it("asks a reset for no amount, and ignores one left in the field", () => {
    expect(errors({ action: "reset", amount: "" })).toEqual({});
    expect(errors({ action: "reset", amount: "abc" })).toEqual({});
  });

  it("trims the reason", () => {
    expect(
      adminCreditAdjustmentSchema.parse(values({ reason: "  Goodwill \n" }))
        .reason,
    ).toBe("Goodwill");
  });

  it.each([
    ["no reason", "", "Give a reason of at least 3 characters"],
    ["two characters", "ok", "Give a reason of at least 3 characters"],
    [
      "three characters padded out with spaces",
      "  ok  ",
      "Give a reason of at least 3 characters",
    ],
    [
      "a reason past the limit",
      "x".repeat(CREDIT_REASON_MAX + 1),
      "Use at most 500 characters",
    ],
  ])("refuses %s", (_case, reason, message) => {
    expect(errors({ reason })).toEqual({ reason: message });
    expect(errors({ action: "reset", amount: "", reason })).toEqual({
      reason: message,
    });
  });

  it("accepts a reason at each end of the range", () => {
    expect(errors({ reason: "abc" })).toEqual({});
    expect(errors({ reason: "x".repeat(CREDIT_REASON_MAX) })).toEqual({});
  });

  it("refuses an expiry on a day that has ended", () => {
    expect(errors({ expires_at: day(-1) })).toEqual({
      expires_at: "Choose today or a later day",
    });
    expect(errors({ expires_at: "2020-01-01" })).toEqual({
      expires_at: "Choose today or a later day",
    });
  });

  it("accepts an expiry today or later, and none at all", () => {
    expect(errors({ expires_at: day(0) })).toEqual({});
    expect(errors({ expires_at: day(30) })).toEqual({});
    expect(errors({ expires_at: "" })).toEqual({});
  });

  it("refuses an expiry that isn't a date", () => {
    expect(errors({ expires_at: "2026-02-31" })).toEqual({
      expires_at: "Enter a valid date",
    });
  });

  it("checks an expiry only for an add: a deduct and a reset send none", () => {
    expect(
      errors({ action: "deduct", amount: "50", expires_at: day(-1) }),
    ).toEqual({});
    expect(
      errors({ action: "reset", amount: "", expires_at: day(-1) }),
    ).toEqual({});
  });
});
