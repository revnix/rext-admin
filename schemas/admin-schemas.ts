import { z } from "zod";
import type { AdminCreditLimits } from "@/lib/api-client/admin-credits";
import type { AdminUserPlan } from "@/lib/api-client/admin-plan";
import {
  creditAmountError,
  creditExpiryError,
} from "@/lib/billing/credit-adjustments";
import { formatCount } from "@/lib/billing/credits";
import { chosenChange, trialEndError } from "@/lib/billing/plan-changes";

import {
  BANNER_AREAS,
  BANNER_MAX_MINUTES,
  BANNER_MESSAGE_MAX,
  BANNER_MIN_MINUTES,
} from "@/lib/api-client/incident-banner";

/**
 * Invite a platform administrator (super admins only): the address, the admin role, an optional
 * note for the email, and how long the link lasts.
 */
export const adminInvitationSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  admin_role: z.enum(["super_admin", "support_admin", "platform_admin"]),
  message: z
    .string()
    .max(1000, "Keep the message under 1,000 characters")
    .optional(),
  expiry_days: z.number().min(1).max(30),
});

export type AdminInvitationValues = z.infer<typeof adminInvitationSchema>;

/**
 * The incident banner (super admins, rext-control#728): its plain-text message, what is affected,
 * and how long it shows unless it is switched off first. The limits are the backend's.
 */
export const incidentBannerSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Say what is happening")
    .max(
      BANNER_MESSAGE_MAX,
      `Keep the message to ${BANNER_MESSAGE_MAX} characters`,
    ),
  areas: z.array(z.enum(BANNER_AREAS)),
  duration_minutes: z
    .number()
    .int()
    .min(BANNER_MIN_MINUTES)
    .max(BANNER_MAX_MINUTES),
});

export type IncidentBannerValues = z.infer<typeof incidentBannerSchema>;

const characters = (count: number) =>
  `${formatCount(count)} ${count === 1 ? "character" : "characters"}`;

/**
 * Add, deduct or reset a user's credits (super admins only), within the limits the backend sent
 * with the user's credits: the most one change may carry, and the reason's length once trimmed.
 * The amount and the expiry's day stay as typed (`lib/billing/credit-adjustments.ts` reads them):
 * an amount is needed to add or deduct and ignored for a reset, and only an add has an expiry, on
 * a day that hasn't ended. The customer sees the reason.
 *
 * Without limits (an API that doesn't send them yet) the amount has no ceiling here and the reason
 * only has to be there: the backend's own refusal is shown beside the field.
 */
export function adminCreditAdjustmentSchema(limits?: AdminCreditLimits) {
  const reason = z.string().trim();
  return z
    .object({
      action: z.enum(["add", "deduct", "reset"]),
      amount: z.string(),
      expires_at: z.string(),
      reason: limits
        ? reason
            .min(
              limits.reason_min,
              `Give a reason of at least ${characters(limits.reason_min)}`,
            )
            .max(
              limits.reason_max,
              `Use at most ${characters(limits.reason_max)}`,
            )
        : reason.min(1, "Give a reason"),
    })
    .superRefine((values, ctx) => {
      if (values.action === "reset") return;
      const amount = creditAmountError(values.amount, limits?.amount_max);
      if (amount)
        ctx.addIssue({ code: "custom", path: ["amount"], message: amount });
      const expiry =
        values.action === "add" ? creditExpiryError(values.expires_at) : null;
      if (expiry)
        ctx.addIssue({ code: "custom", path: ["expires_at"], message: expiry });
    });
}

export type AdminCreditAdjustmentValues = z.infer<
  ReturnType<typeof adminCreditAdjustmentSchema>
>;

/** A change's reason, within the lengths the backend sent, once trimmed. */
const reasonWithin = (limits: { reason_min: number; reason_max: number }) =>
  z
    .string()
    .trim()
    .min(
      Math.max(limits.reason_min, 1),
      limits.reason_min > 1
        ? `Give a reason of at least ${characters(limits.reason_min)}`
        : "Give a reason",
    )
    .max(limits.reason_max, `Use at most ${characters(limits.reason_max)}`);

/**
 * Move a user to another plan (super admins only): a plan, a billing period and a way of billing
 * that the backend offers for this user (`GET /admin/users/{id}/plan` lists them, with the
 * reason's limits), and the reason. The three choices stay text: which values exist is the
 * backend's to say.
 */
export function adminPlanChangeSchema(
  plan: Pick<AdminUserPlan, "plans" | "limits">,
) {
  return z
    .object({
      plan_id: z.string().min(1, "Choose a plan"),
      billing_period: z.string(),
      billing: z.string(),
      reason: reasonWithin(plan.limits),
    })
    .superRefine((values, ctx) => {
      if (!values.plan_id) return;
      const period = plan.plans
        .find((choice) => choice.id === values.plan_id)
        ?.periods.find(
          (item) =>
            item.billing_period === values.billing_period && item.allowed,
        );
      if (!period) {
        ctx.addIssue({
          code: "custom",
          path: ["billing_period"],
          message: "Choose a billing period",
        });
        return;
      }
      if (!chosenChange(plan, values))
        ctx.addIssue({
          code: "custom",
          path: ["billing"],
          message: "Choose how the change is billed",
        });
    });
}

export type AdminPlanChangeValues = z.infer<
  ReturnType<typeof adminPlanChangeSchema>
>;

/**
 * Give a trial a later end (super admins only): a day inside the limits the backend sent, and the
 * reason. The day stays as entered (`lib/billing/plan-changes.ts` reads it).
 */
export function adminTrialExtensionSchema(
  plan: Pick<AdminUserPlan, "limits" | "trial_extension" | "subscription">,
) {
  return z
    .object({
      ends_on: z.string(),
      reason: reasonWithin(plan.limits),
    })
    .superRefine((values, ctx) => {
      const error = trialEndError(
        values.ends_on,
        plan.trial_extension,
        plan.subscription?.trial_ends_at,
      );
      if (error)
        ctx.addIssue({ code: "custom", path: ["ends_on"], message: error });
    });
}

export type AdminTrialExtensionValues = z.infer<
  ReturnType<typeof adminTrialExtensionSchema>
>;
