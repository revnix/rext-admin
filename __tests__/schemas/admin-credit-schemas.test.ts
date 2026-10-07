/**
 * A super admin's change to a user's credits (FB2.28): the form refuses what the backend would,
 * within the limits the backend sent (the most one change may carry, the reason's length), an
 * expiry on a day that has ended, and asks a reset for no amount. Without those limits it keeps
 * no ceiling and no length of its own.
 */

import { addDays, format } from "date-fns";
import type { AdminCreditLimits } from "@/lib/api-client/admin-credits";
import {
  type AdminCreditAdjustmentValues,
  adminCreditAdjustmentSchema,
} from "@/schemas/admin-schemas";

/** `limits` as GET /admin/users/{id}/credits sends them. */
const LIMITS: AdminCreditLimits = {
  amount_max: 100000,
  reason_min: 3,
  reason_max: 500,
};

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

/** The messages the schema gives, by field: with these limits, or with none for `null`. */
function errors(
  fields: Partial<AdminCreditAdjustmentValues>,
  limits: AdminCreditLimits | null = LIMITS,
) {
  const schema = adminCreditAdjustmentSchema(limits ?? undefined);
  const result = schema.safeParse(values(fields));
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("adminCreditAdjustmentSchema, with the API's limits", () => {
  it("accepts an add, a deduct and a reset that are filled in", () => {
    expect(errors({})).toEqual({});
    expect(errors({ action: "deduct", amount: "50" })).toEqual({});
    expect(errors({ action: "reset", amount: "" })).toEqual({});
  });

  it.each([
    ["the smallest amount", "1"],
    ["the largest amount", String(LIMITS.amount_max)],
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
      String(LIMITS.amount_max + 1),
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
      adminCreditAdjustmentSchema(LIMITS).parse(
        values({ reason: "  Goodwill \n" }),
      ).reason,
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
      "x".repeat(LIMITS.reason_max + 1),
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
    expect(errors({ reason: "x".repeat(LIMITS.reason_max) })).toEqual({});
  });

  it("follows whatever limits the API sends, not numbers of its own", () => {
    const other: AdminCreditLimits = {
      amount_max: 2500,
      reason_min: 1,
      reason_max: 12,
    };
    expect(errors({ amount: "2500", reason: "x" }, other)).toEqual({});
    expect(errors({ amount: "2501", reason: "" }, other)).toEqual({
      amount: "Enter a whole number from 1 to 2,500",
      reason: "Give a reason of at least 1 character",
    });
    expect(errors({ reason: "x".repeat(13) }, other)).toEqual({
      reason: "Use at most 12 characters",
    });
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

describe("adminCreditAdjustmentSchema, from an API that sends no limits", () => {
  it("keeps no ceiling for the amount: the backend refuses what is too much", () => {
    expect(errors({ amount: "100001" }, null)).toEqual({});
    expect(errors({ action: "deduct", amount: "9,000,000" }, null)).toEqual({});
  });

  it("still asks for a whole number of at least 1", () => {
    expect(errors({ amount: "" }, null)).toEqual({
      amount: "Enter how many credits",
    });
    expect(errors({ amount: "0" }, null)).toEqual({
      amount: "Enter a whole number of at least 1",
    });
    expect(errors({ amount: "12.5" }, null)).toEqual({
      amount: "Use a whole number",
    });
  });

  it("asks only that the reason is there, at any length", () => {
    expect(errors({ reason: "" }, null)).toEqual({ reason: "Give a reason" });
    expect(errors({ reason: "   " }, null)).toEqual({
      reason: "Give a reason",
    });
    expect(errors({ reason: "ok" }, null)).toEqual({});
    expect(errors({ reason: "x".repeat(501) }, null)).toEqual({});
    expect(
      adminCreditAdjustmentSchema().parse(values({ reason: "  ok \n" })).reason,
    ).toBe("ok");
  });

  it("keeps the checks that are its own: a reset's amount and an add's expiry", () => {
    expect(errors({ action: "reset", amount: "abc" }, null)).toEqual({});
    expect(errors({ expires_at: "2020-01-01" }, null)).toEqual({
      expires_at: "Choose today or a later day",
    });
  });
});
