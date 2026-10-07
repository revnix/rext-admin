"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { PaywallDialog } from "@/components/billing/paywall-dialog";
import { useAuthSession } from "@/hooks/use-auth-session";
import { shortfall } from "@/lib/billing/credits";
import { subscriptionQueries } from "@/lib/query-keys";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspaceOptional } from "@/providers/workspace-provider";
import type { BilledRun } from "@/types/subscription";

const OUT_OF_CREDITS_MESSAGE = "Your credits have run out.";
const TRIAL_ENDED_MESSAGE = "A trial's credits can't be spent once it ends.";

/**
 * The credits this page spends: the workspace owner's on a workspace page, the person's own
 * elsewhere. Every caller shares the store's one fetch, so a button reading its cost adds no
 * request.
 */
export function useWorkspaceCredits() {
  const onWorkspacePage = useWorkspaceOptional() !== null;
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const credits = useSubscriptionStore((s) => s.credits);
  const fetchCredits = useSubscriptionStore((s) => s.fetchCredits);
  const workspaceId = onWorkspacePage ? currentWorkspace?.id : undefined;

  useEffect(() => {
    // Wait for the real workspace id on workspace pages — prevents firing an account-level
    // fetch before the workspace UUID resolves, which causes duplicate calls
    if (onWorkspacePage && !workspaceId) return;
    fetchCredits(workspaceId).catch(() => {});
  }, [onWorkspacePage, workspaceId, fetchCredits]);

  return credits;
}

/**
 * Single credit gate for every flow that starts or continues a generation.
 *
 * The backend bills per pipeline stage, so a partial balance buys a run that dies halfway and
 * leaves the user with nothing. Each billed button is therefore checked against the backend's
 * own figure for it (`runs` in `GET /subscriptions/credits`): a new article needs a whole
 * article's worth in hand, "Approve & Generate" the cost of the stages it starts.
 *
 * - `ensureCredits(run)` — before a billed button's run (`analyze` when omitted).
 * - `ensureCreditsToContinue()` — resuming an in-flight one between gates; only a fully
 *   exhausted balance stops an article whose earlier stages are already paid for.
 *
 * Both open the paywall (PaywallDialog: why, what an article costs, the plan grid inline), and
 * return false when they block, so the caller bails before anything is sent. A trial that ended
 * with nothing bought since blocks both, whatever it has left: the backend stops spending its
 * credits only when the daily expiry job runs.
 */
export function useCreditGate() {
  const credits = useWorkspaceCredits();
  const { user } = useAuthSession();
  const [showModal, setShowModal] = useState(false);
  const [modalDetail, setModalDetail] = useState(OUT_OF_CREDITS_MESSAGE);

  // The trial is the person's own: on a workspace they don't own, the credits are the owner's.
  const ownCredits =
    Boolean(credits) &&
    (!credits?.target_user_id || credits.target_user_id === user?.id);
  const trial = useQuery({
    ...subscriptionQueries.trialStatus(),
    enabled: ownCredits,
  });
  const trialEnded = ownCredits && Boolean(trial.data?.trial_expired);

  // A null articles_remaining means an unlimited plan; an unloaded balance is not a block.
  const isUnlimited = !credits || credits.articles_remaining === null;

  /** Why `run` can't start now, or null when it can. */
  const blockFor = useCallback(
    (run: BilledRun): string | null => {
      if (trialEnded) return TRIAL_ENDED_MESSAGE;
      if (isUnlimited || !credits) return null;
      if (credits.runs) return shortfall(run, credits);
      // A backend without the cost table: a whole article to start, anything to go on.
      const short =
        run === "analyze"
          ? (credits.articles_remaining ?? 0) < 1
          : credits.current_credits <= 0;
      return short ? OUT_OF_CREDITS_MESSAGE : null;
    },
    [credits, isUnlimited, trialEnded],
  );

  // Cannot afford a complete article — starting would burn credits for nothing.
  const isBlocked = blockFor("analyze") !== null;

  // Re-writing the outline or a title is billed per call, so a run can still run dry between
  // gates; the stream's `credits.exhausted` event catches that.
  const isExhausted = !isUnlimited && (credits?.current_credits ?? 0) <= 0;

  const openCreditsModal = useCallback(() => {
    setModalDetail(OUT_OF_CREDITS_MESSAGE);
    setShowModal(true);
  }, []);

  const ensureCredits = useCallback(
    (run: BilledRun = "analyze") => {
      const reason = blockFor(run);
      if (reason) {
        setModalDetail(reason);
        setShowModal(true);
        return false;
      }
      return true;
    },
    [blockFor],
  );

  const ensureCreditsToContinue = useCallback(() => {
    if (trialEnded || isExhausted) {
      setModalDetail(trialEnded ? TRIAL_ENDED_MESSAGE : OUT_OF_CREDITS_MESSAGE);
      setShowModal(true);
      return false;
    }
    return true;
  }, [isExhausted, trialEnded]);

  const creditsModal = (
    <PaywallDialog
      open={showModal}
      onOpenChange={setShowModal}
      reason={modalDetail}
      credits={credits}
    />
  );

  return {
    isBlocked,
    ensureCredits,
    ensureCreditsToContinue,
    openCreditsModal,
    creditsModal,
  };
}
