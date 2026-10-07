/**
 * The history of admin changes to someone's credits (FB2.28), as one list. The backend sends two:
 * the credits added (`grants`, with what is left of each) and every add, deduct and reset from the
 * audit log (`adjustments`). An add is in both, so it is shown once, with its grant's figures.
 */

import { dateFormat } from "@/lib/formatters/date-formatters";
import type {
  CreditAdjustmentAction,
  CreditAdjustmentEntry,
  CreditGrantEntry,
} from "@/types/subscription";
import { formatCount, formatCredits } from "./credits";

/** A grant as either view sends it: the admin's names who added it, the customer's Rext support. */
export type HistoryGrant = CreditGrantEntry & {
  granted_by?: string | null;
  granted_by_email?: string | null;
};

/** An adjustment as either view sends it: only the admin's points at the grant an add made. */
export type HistoryAdjustment = CreditAdjustmentEntry & {
  requested_amount?: number | null;
  grant_id?: string | null;
  adjusted_by?: string | null;
  adjusted_by_email?: string | null;
};

/** One change in the merged list. */
export interface CreditHistoryRow {
  /** The adjustment's id, or the grant's for a grant with no adjustment in the list. */
  id: string;
  /** null for an audit entry whose action this dashboard doesn't know. */
  action: CreditAdjustmentAction | null;
  /** The credits added or deducted; for a reset, the signed change to the month's credits. */
  amount: number | null;
  /** What a deduct asked for, where the backend says (the admin's view). */
  requested_amount: number | null;
  balance_before: number | null;
  balance_after: number | null;
  reason: string | null;
  /** Who made it: the admin's email, or the customer view's "Rext support"; null when unknown. */
  by: string | null;
  created_at: string;
  /** An add's grant: what is left of it, what a deduction took back, and when it expires. */
  grant: {
    remaining: number;
    forfeited: number;
    expires_at: string | null;
  } | null;
}

/**
 * An add's audit entry and its grant are written in one request; the customer's rows carry no
 * grant id, so there they are matched by amount and reason within this long of each other.
 */
const SAME_CHANGE_MS = 60_000;

const ACTIONS: readonly string[] = ["add", "deduct", "reset"];

const time = (iso: string) => Date.parse(iso) || 0;

/** The grant this add made, taken out of `unpaired`: by its id, or failing one by what it holds. */
function takeGrant(
  adjustment: HistoryAdjustment,
  unpaired: Map<string, HistoryGrant>,
): HistoryGrant | null {
  let match: HistoryGrant | null = null;
  if (adjustment.grant_id) {
    match = unpaired.get(adjustment.grant_id) ?? null;
  } else {
    let nearest = SAME_CHANGE_MS;
    for (const grant of unpaired.values()) {
      const apart = Math.abs(
        time(grant.created_at) - time(adjustment.created_at),
      );
      if (
        grant.amount === adjustment.amount &&
        grant.reason === adjustment.reason &&
        apart <= nearest
      ) {
        match = grant;
        nearest = apart;
      }
    }
  }
  if (match) unpaired.delete(match.id);
  return match;
}

/**
 * Grants and adjustments as one list, newest first. An add and the grant it made are one row; a
 * grant no adjustment in the list made (the lists are capped) is a row of its own, as an add.
 * `view` says whose rows these are: the admin's name admins by email (their `*_by` is an id), the
 * customer's carry the name to show in `*_by`.
 */
export function mergeCreditHistory(
  history: { grants: HistoryGrant[]; adjustments: HistoryAdjustment[] },
  view: "admin" | "customer",
): CreditHistoryRow[] {
  const by = (
    adjustment: HistoryAdjustment | null,
    grant: HistoryGrant | null,
  ) =>
    (view === "admin"
      ? (adjustment?.adjusted_by_email ?? grant?.granted_by_email)
      : (adjustment?.adjusted_by ?? grant?.granted_by)) ?? null;
  const unpaired = new Map(history.grants.map((grant) => [grant.id, grant]));
  const rows: CreditHistoryRow[] = history.adjustments.map((adjustment) => {
    const grant =
      adjustment.action === "add" ? takeGrant(adjustment, unpaired) : null;
    return {
      id: adjustment.id,
      action: ACTIONS.includes(adjustment.action ?? "")
        ? (adjustment.action as CreditAdjustmentAction)
        : null,
      amount: adjustment.amount,
      requested_amount: adjustment.requested_amount ?? null,
      balance_before: adjustment.balance_before,
      balance_after: adjustment.balance_after,
      reason: adjustment.reason ?? grant?.reason ?? null,
      by: by(adjustment, grant),
      created_at: adjustment.created_at,
      grant: grant
        ? {
            remaining: grant.remaining,
            forfeited: grant.forfeited,
            expires_at: grant.expires_at,
          }
        : null,
    };
  });
  for (const grant of unpaired.values()) {
    rows.push({
      id: grant.id,
      action: "add",
      amount: grant.amount,
      requested_amount: null,
      balance_before: null,
      balance_after: null,
      reason: grant.reason,
      by: by(null, grant),
      created_at: grant.created_at,
      grant: {
        remaining: grant.remaining,
        forfeited: grant.forfeited,
        expires_at: grant.expires_at,
      },
    });
  }
  // Array.prototype.sort is stable: rows of one instant keep the backend's order.
  return rows.sort((a, b) => time(b.created_at) - time(a.created_at));
}

/** What happened, with how many credits: "200 credits added", "Monthly credits reset". */
export function historyTitle(row: CreditHistoryRow): string {
  const amount = row.amount ?? 0;
  if (row.action === "add") return `${formatCredits(amount)} added`;
  if (row.action === "deduct") {
    const asked = row.requested_amount;
    return asked !== null && asked > amount
      ? `${formatCredits(amount)} deducted of the ${formatCount(asked)} asked for`
      : `${formatCredits(amount)} deducted`;
  }
  if (row.action === "reset") {
    if (row.amount === null) return "Monthly credits reset";
    return amount > 0
      ? `Monthly credits reset, ${formatCount(amount)} more than before`
      : amount < 0
        ? `Monthly credits reset, ${formatCount(-amount)} fewer than before`
        : "Monthly credits reset, already at the plan's amount";
  }
  return "Credits changed";
}

/**
 * The figures under a row: an add's credits left, taken back and expiry, then the balance before
 * and after where the audit entry holds it. Expired credits aren't "left": they no longer count.
 */
export function historyDetails(
  row: CreditHistoryRow,
  now: number = Date.now(),
): string[] {
  const details: string[] = [];
  if (row.grant) {
    const { remaining, forfeited, expires_at } = row.grant;
    const expired = expires_at !== null && time(expires_at) <= now;
    if (!expired) details.push(`${formatCount(remaining)} left`);
    if (forfeited > 0) details.push(`${formatCount(forfeited)} taken back`);
    details.push(
      expires_at === null
        ? "No expiry"
        : expired
          ? `Expired ${dateFormat.short(expires_at)}${
              remaining > 0 ? ` with ${formatCount(remaining)} unspent` : ""
            }`
          : `Expires ${dateFormat.short(expires_at)}`,
    );
  }
  if (row.balance_before !== null && row.balance_after !== null)
    details.push(
      `Balance from ${formatCount(row.balance_before)} to ${formatCount(row.balance_after)}`,
    );
  return details;
}
