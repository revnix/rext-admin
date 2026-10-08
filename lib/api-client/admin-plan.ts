/**
 * Admin Plan API Namespace
 *
 * A super admin reads any user's plan with the changes the backend allows for it, moves the user
 * to another plan, or extends a trial, each with a reason kept with its audit entry (FB2.29,
 * revnix/rext-control#710). The customer's activity shows the change, not the reason. The backend
 * changes the plan at Lemon Squeezy first, audits every change and refuses one on a Super Admin's
 * account.
 *
 * Everything a choice shows comes with the read: the plans and their prices, which changes are
 * allowed and why not, what the month's credits would be afterwards, and the limits of the reason
 * and of the trial's new end. The dashboard holds no copy of any of it.
 *
 * The types are written by hand: these routes are not in api/openapi.json yet. Once the spec has
 * them, `pnpm api:types` and these become aliases of `components["schemas"]`.
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

/** How a plan change is billed. `not_billed` is a user without a Lemon Squeezy subscription. */
export type AdminPlanBilling = "next_renewal" | "charge_now" | "not_billed";

/** The periods a plan can be changed to. */
export type AdminPlanPeriod = "monthly" | "yearly";

/** Which way a choice moves the user, as the backend judges it. */
export type AdminPlanChangeKind = "upgrade" | "downgrade" | "period_change";

/** The subscription that grants the user access now. */
export interface AdminPlanSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_display_name: string;
  status: string;
  is_trial: boolean;
  billing_period: AdminPlanPeriod | "lifetime" | null;
  /** Whether Lemon Squeezy bills it: a seeded or legacy row is not billed. */
  billed_by_provider: boolean;
  renews_at: string | null;
  trial_ends_at: string | null;
  /** What is left of the month's credits now. */
  monthly_credits: number;
  credits_per_month: number | null;
}

/** One way to bill a choice, and what it leaves. */
export interface AdminPlanMode {
  billing: AdminPlanBilling;
  /** When the plan and its credits change: at once today, whatever the billing. */
  plan_changes: "now" | "at_renewal";
  /** The month's credits after the change; null for a plan without monthly credits. */
  monthly_credits_after: number | null;
}

/** A plan in one billing period, as a choice for this user. */
export interface AdminPlanPeriodChoice {
  billing_period: AdminPlanPeriod;
  kind: AdminPlanChangeKind;
  allowed: boolean;
  /** Why not, ready to show. */
  refused_reason: string | null;
  /** The ways it can be billed; none when it isn't allowed. */
  modes: AdminPlanMode[];
}

export interface AdminPlanChoice {
  id: string;
  name: string;
  display_name: string;
  /** The list price as a decimal string in `AdminUserPlan.currency` ("89.00"). */
  price_monthly: string | null;
  price_yearly: string | null;
  credits_per_month: number | null;
  periods: AdminPlanPeriodChoice[];
}

/** What a change's reason may be (rext-backend). */
export interface AdminPlanLimits {
  /** The reason's shortest length, once trimmed. */
  reason_min: number;
  /** The reason's longest length. */
  reason_max: number;
}

/** GET /admin/users/{user_id}/plan */
export interface AdminUserPlan {
  user_id: string;
  /** The currency of every price here ("USD"). */
  currency: string;
  /** null when nothing grants the user access. */
  subscription: AdminPlanSubscription | null;
  change: {
    allowed: boolean;
    refused_reason: string | null;
    default_billing: AdminPlanBilling | null;
  };
  trial_extension: {
    allowed: boolean;
    refused_reason: string | null;
    /**
     * The trial's new end may be any instant from here… Absent with a refusal: a trial that
     * already ends beyond the limit has no window at all.
     */
    earliest_ends_at?: string | null;
    /** …to here. */
    latest_ends_at?: string | null;
  };
  /** The plans an admin may choose, the current one included. */
  plans: AdminPlanChoice[];
  limits: AdminPlanLimits;
}

/** POST /admin/users/{user_id}/plan */
export interface AdminPlanChangeRequest {
  plan_id: string;
  billing_period: AdminPlanPeriod;
  billing: AdminPlanBilling;
  /** Trimmed; kept with the audit entry, not shown to the customer. */
  reason: string;
}

export interface AdminPlanName {
  id: string;
  name: string;
  display_name: string;
}

/** What the change did. */
export interface AdminPlanChangeResult {
  subscription_id: string;
  old_plan: AdminPlanName;
  new_plan: AdminPlanName;
  old_billing_period: AdminPlanSubscription["billing_period"];
  new_billing_period: AdminPlanPeriod;
  billing: AdminPlanBilling;
  monthly_credits_before: number;
  monthly_credits_after: number;
  renews_at: string | null;
  audit_id: string;
}

/** POST /admin/users/{user_id}/trial */
export interface AdminTrialExtensionRequest {
  /** Later than the trial's current end, within `trial_extension`'s two limits. */
  ends_at: string;
  reason: string;
}

export interface AdminTrialExtensionResult {
  subscription_id: string;
  trial_ended_at_before: string | null;
  trial_ends_at: string;
  audit_id: string;
}

const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function createAdminPlanNamespace(client: ApiClient) {
  return {
    /**
     * A user's plan and the changes allowed for it (super admin only)
     */
    get: async (userId: string): Promise<AdminUserPlan> => {
      return client.request<AdminUserPlan>(ENDPOINTS.ADMIN.userPlan(userId), {
        method: "GET",
      });
    },

    /**
     * Move a user to another plan (super admin only); the backend audits it
     */
    change: async (
      userId: string,
      body: AdminPlanChangeRequest,
    ): Promise<AdminPlanChangeResult> => {
      return client.request<AdminPlanChangeResult>(
        ENDPOINTS.ADMIN.userPlan(userId),
        json(body),
      );
    },

    /**
     * Give a trial a later end (super admin only); the backend audits it
     */
    extendTrial: async (
      userId: string,
      body: AdminTrialExtensionRequest,
    ): Promise<AdminTrialExtensionResult> => {
      return client.request<AdminTrialExtensionResult>(
        ENDPOINTS.ADMIN.userTrial(userId),
        json(body),
      );
    },
  };
}
