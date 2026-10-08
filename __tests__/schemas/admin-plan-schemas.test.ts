/**
 * The plan form's and the trial form's checks (FB2.29): a plan, a period and a way of billing
 * that the backend's answer offers for this user, a day inside its limits, and a reason within
 * the lengths it sent. The schemas hold no plan, period, billing or limit of their own.
 */

import {
  adminPlanChangeSchema,
  adminTrialExtensionSchema,
} from "@/schemas/admin-schemas";
import { adminPlan, adminTrialPlan } from "../fixtures/admin-plan";

const REASON = "Asked by phone";

/** The messages of a refused parse, by field. */
const errors = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) =>
  Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [
      String(issue.path[0]),
      issue.message,
    ]),
  );

describe("the plan change's checks", () => {
  const schema = adminPlanChangeSchema(adminPlan());
  const change = {
    plan_id: "plan-scale",
    billing_period: "monthly",
    billing: "next_renewal",
    reason: REASON,
  };

  it("passes a choice the backend offers, with the reason trimmed", () => {
    const result = schema.safeParse({ ...change, reason: `  ${REASON}  ` });
    expect(result.success).toBe(true);
    expect(result.data?.reason).toBe(REASON);
  });

  it("asks for a plan first", () => {
    expect(
      errors(
        schema.safeParse({
          plan_id: "",
          billing_period: "",
          billing: "",
          reason: REASON,
        }),
      ),
    ).toEqual({ plan_id: "Choose a plan" });
  });

  it("refuses a period the plan doesn't allow for this user", () => {
    expect(
      errors(schema.safeParse({ ...change, plan_id: "plan-growth" })),
    ).toEqual({ billing_period: "Choose a billing period" });
    expect(errors(schema.safeParse({ ...change, billing_period: "" }))).toEqual(
      { billing_period: "Choose a billing period" },
    );
    // A subscription billed monthly keeps its period: yearly is listed, and refused.
    expect(
      errors(schema.safeParse({ ...change, billing_period: "yearly" })),
    ).toEqual({ billing_period: "Choose a billing period" });
  });

  it("refuses a way of billing the period doesn't offer", () => {
    expect(
      errors(
        schema.safeParse({
          ...change,
          plan_id: "plan-starter",
          billing: "charge_now",
        }),
      ),
    ).toEqual({ billing: "Choose how the change is billed" });
  });

  it("holds the reason to the lengths the backend sent", () => {
    expect(errors(schema.safeParse({ ...change, reason: "  ab  " }))).toEqual({
      reason: "Give a reason of at least 3 characters",
    });
    expect(
      errors(schema.safeParse({ ...change, reason: "x".repeat(501) })),
    ).toEqual({ reason: "Use at most 500 characters" });
    const short = adminPlanChangeSchema(
      adminPlan({ limits: { reason_min: 1, reason_max: 500 } }),
    );
    expect(errors(short.safeParse({ ...change, reason: "   " }))).toEqual({
      reason: "Give a reason",
    });
  });
});

describe("the trial extension's checks", () => {
  const schema = adminTrialExtensionSchema(adminTrialPlan());

  it("passes a day inside the backend's limits", () => {
    expect(
      schema.safeParse({ ends_on: "2026-10-26", reason: REASON }).success,
    ).toBe(true);
  });

  it("refuses no day and a day outside the limits, in the limits' own days", () => {
    expect(errors(schema.safeParse({ ends_on: "", reason: REASON }))).toEqual({
      ends_on: "Choose the day the trial ends",
    });
    expect(
      errors(schema.safeParse({ ends_on: "2026-11-08", reason: REASON })),
    ).toEqual({ ends_on: "Choose a day from Oct 13, 2026 to Nov 7, 2026" });
  });

  it("asks for the reason", () => {
    expect(
      errors(schema.safeParse({ ends_on: "2026-10-26", reason: "" })),
    ).toEqual({ reason: "Give a reason of at least 3 characters" });
  });
});
