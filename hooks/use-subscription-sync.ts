"use client";

/**
 * Subscription Sync Hook
 *
 * Bounded polling for the subscription record to catch up with LemonSqueezy
 * after a checkout completes. Payment succeeds on LemonSqueezy's side before
 * their webhook reaches our backend, so the subscription is briefly stale —
 * this polls until it reports a settled status or the timeout elapses.
 *
 * Shared by the checkout overlay (in-app success) and /checkout/success (the
 * non-JS fallback route).
 *
 * @module hooks/use-subscription-sync
 */

import { useCallback } from "react";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { UserSubscription } from "@/types/subscription";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 20_000;
/** Statuses that mean the subscription has settled after checkout. */
export const READY_STATUSES = new Set(["active", "trial", "cancelled"]);

/** The facts that decide whether a purchase actually landed. */
export interface PurchaseState {
  lemonsqueezySubscriptionId: string | null;
  planId: string | null;
  status: string | null;
}

/** Statuses that mean the subscription is genuinely granting access. */
const LIVE_STATUSES = new Set(["active", "trial", "trialing", "on_trial"]);

/** Read the purchase-relevant fields out of a subscription. */
export function getPurchaseState(
  subscription: UserSubscription | null,
): PurchaseState {
  const detail = subscription?.subscription;
  return {
    lemonsqueezySubscriptionId: detail?.lemonsqueezy_subscription_id ?? null,
    planId: detail?.plan_id ?? null,
    status: detail?.status ?? null,
  };
}

/**
 * Whether `latest` represents a completed purchase relative to `baseline`.
 *
 * Deliberately strict, because the two looser checks both produced false
 * successes in practice:
 *
 * - "has a ready status" passed instantly for a user already on a trial, since
 *   "trial" is itself a ready status.
 * - "anything changed" passed when the trial was *cancelled*, reporting a
 *   successful purchase for a change in the opposite direction.
 *
 * A real purchase always ends with a LemonSqueezy-backed subscription in a
 * live state, so that is what we require.
 */
export function isPurchaseSettled(
  baseline: PurchaseState,
  latest: PurchaseState,
): boolean {
  // The webhook writes this id. Without it, LemonSqueezy never told us
  // anything, whatever else may have changed locally.
  if (!latest.lemonsqueezySubscriptionId) return false;

  // Cancelled / expired / past_due are changes, but not successes.
  if (!LIVE_STATUSES.has((latest.status ?? "").toLowerCase())) return false;

  // Distinguish this purchase from the subscription the user already had:
  // a new subscription changes the LemonSqueezy id, a plan change changes
  // the plan while keeping it.
  return (
    latest.lemonsqueezySubscriptionId !== baseline.lemonsqueezySubscriptionId ||
    latest.planId !== baseline.planId
  );
}

export function useSubscriptionSync() {
  const fetchSubscription = useSubscriptionStore(
    (state) => state.fetchSubscription,
  );

  /**
   * Poll until the subscription reports a settled status.
   *
   * @returns true if the subscription synced, false on timeout or abort.
   */
  const waitForSubscriptionSync = useCallback(
    async (signal?: AbortSignal): Promise<boolean> => {
      const startedAt = Date.now();

      while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        if (signal?.aborted) return false;

        // Poll the plan status only — usage/credits don't change the
        // settlement verdict and the old full burst tripled per-tick traffic.
        await fetchSubscription({ force: true, planOnly: true });
        const latest = useSubscriptionStore.getState().subscription;

        if (latest && READY_STATUSES.has(latest?.subscription?.status || "")) {
          // Settled: refresh usage/credits once, then stop polling.
          await fetchSubscription({ force: true });
          return true;
        }

        await new Promise<void>((resolve) =>
          setTimeout(resolve, POLL_INTERVAL_MS),
        );
      }

      return false;
    },
    [fetchSubscription],
  );

  /**
   * Poll until the purchase has demonstrably landed.
   *
   * @param baseline Purchase state captured before checkout opened.
   * @returns true once a LemonSqueezy-backed subscription is live, false on
   *   timeout or abort. False means "we could not confirm", never "it failed".
   */
  const waitForPurchaseSettled = useCallback(
    async (baseline: PurchaseState, signal?: AbortSignal): Promise<boolean> => {
      const startedAt = Date.now();

      while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        if (signal?.aborted) return false;

        // Plan-only polling (see waitForSubscriptionSync).
        await fetchSubscription({ force: true, planOnly: true });
        const latest = getPurchaseState(
          useSubscriptionStore.getState().subscription,
        );

        if (isPurchaseSettled(baseline, latest)) {
          await fetchSubscription({ force: true });
          return true;
        }

        await new Promise<void>((resolve) =>
          setTimeout(resolve, POLL_INTERVAL_MS),
        );
      }

      return false;
    },
    [fetchSubscription],
  );

  return { waitForSubscriptionSync, waitForPurchaseSettled };
}
