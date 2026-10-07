/**
 * Admin Credits API Namespace
 *
 * A super admin reads any user's credits and the history of admin changes to them, and adds,
 * deducts or resets them with a reason the customer sees (FB2.28, revnix/rext-control#709). The
 * backend audits every change and refuses one on a Super Admin's account.
 *
 * The types are written by hand: these routes are not in api/openapi.json yet. Once the spec has
 * them, `pnpm api:types` and these become aliases of `components["schemas"]`.
 */

import type {
  AddedCredits,
  CreditAdjustmentAction,
  CreditAdjustmentEntry,
  CreditBonus,
  CreditGrantEntry,
} from "@/types/subscription";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

/** POST /admin/users/{user_id}/credits (rext-backend AdminCreditAdjustment). */
export type AdminCreditAdjustmentRequest =
  | {
      action: "add";
      /** A whole number from 1 to 100,000, as a JSON number: the backend refuses "5" and 5.5. */
      amount: number;
      /** 3 to 500 characters once trimmed; the customer sees it. */
      reason: string;
      /** In the future. Left out, the credits last and are spent after the month's. */
      expires_at?: string;
    }
  | { action: "deduct"; amount: number; reason: string }
  /** The month's credits back to the plan's amount: no amount. */
  | { action: "reset"; reason: string };

/** What the change did (rext-backend AdminCreditAdjustmentResult). */
export interface AdminCreditAdjustmentResult {
  action: CreditAdjustmentAction;
  /** null for a reset. */
  requested_amount: number | null;
  /**
   * The credits added or deducted, less than asked for a deduct when less was there; for a reset,
   * the signed change to the month's credits.
   */
  amount: number;
  balance_before: number;
  balance_after: number;
  /** The month's credits after the change. */
  monthly_credits: number;
  /** What is left of the credits admins added, after it. */
  admin_credits: number;
  subscription_id: string;
  /** The grant an add made. */
  grant_id: string | null;
  audit_id: string;
}

/** What the user can spend now, by where it comes from (rext-backend CreditBreakdown). */
export interface AdminCreditBreakdown {
  /** null when nothing grants access: then there is nothing to change. */
  subscription_id: string | null;
  plan_name: string | null;
  /** Everything spendable now. */
  current_credits: number;
  monthly_credits: number;
  credits_per_month: number | null;
  /** When the period ends and the monthly credits reset. */
  credits_reset_date: string | null;
  bonus: CreditBonus | null;
  added_credits: AddedCredits | null;
  /** What admins changed this period's monthly credits by (deductions negative). */
  period_adjustment: number;
}

export interface AdminCreditGrant extends CreditGrantEntry {
  subscription_id: string;
  /** null once that admin is deleted. */
  granted_by: string | null;
  granted_by_email: string | null;
}

export interface AdminCreditAdjustment extends CreditAdjustmentEntry {
  requested_amount: number | null;
  /** The grant an add made. */
  grant_id: string | null;
  adjusted_by: string | null;
  adjusted_by_email: string | null;
}

/** GET /admin/users/{user_id}/credits: the breakdown and the history, newest first. */
export interface AdminUserCredits {
  user_id: string;
  credits: AdminCreditBreakdown;
  grants: AdminCreditGrant[];
  adjustments: AdminCreditAdjustment[];
}

export function createAdminCreditsNamespace(client: ApiClient) {
  return {
    /**
     * A user's credits and the credits admins added and changed (super admin only)
     */
    get: async (userId: string): Promise<AdminUserCredits> => {
      return client.request<AdminUserCredits>(
        ENDPOINTS.ADMIN.userCredits(userId),
        { method: "GET" },
      );
    },

    /**
     * Add, deduct or reset a user's credits (super admin only); the backend audits it
     */
    adjust: async (
      userId: string,
      body: AdminCreditAdjustmentRequest,
    ): Promise<AdminCreditAdjustmentResult> => {
      return client.request<AdminCreditAdjustmentResult>(
        ENDPOINTS.ADMIN.userCredits(userId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
    },
  };
}
