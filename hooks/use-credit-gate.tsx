"use client";

import { useCallback, useEffect, useState } from "react";
import { InsufficientCreditsModal } from "@/components/subscription/insufficient-credits-modal";
import { shortfall } from "@/lib/billing/credits";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspaceOptional } from "@/providers/workspace-provider";
import type { BilledRun } from "@/types/subscription";

const OUT_OF_CREDITS_MESSAGE =
  "You're out of credits. Please upgrade your plan to continue.";

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
 * Both open the upgrade popup, saying what the run needs and what the balance holds, and return
 * false when they block, so the caller bails before anything is sent.
 */
export function useCreditGate() {
  const credits = useWorkspaceCredits();
  const [showModal, setShowModal] = useState(false);
  const [modalDetail, setModalDetail] = useState(OUT_OF_CREDITS_MESSAGE);

  // A null articles_remaining means an unlimited plan; an unloaded balance is not a block.
  const isUnlimited = !credits || credits.articles_remaining === null;

  /** Why `run` can't start now, or null when it can. */
  const blockFor = useCallback(
    (run: BilledRun): string | null => {
      if (isUnlimited || !credits) return null;
      if (credits.runs) return shortfall(run, credits);
      // A backend without the cost table: a whole article to start, anything to go on.
      const short =
        run === "analyze"
          ? (credits.articles_remaining ?? 0) < 1
          : credits.current_credits <= 0;
      return short ? OUT_OF_CREDITS_MESSAGE : null;
    },
    [credits, isUnlimited],
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
    if (isExhausted) {
      setModalDetail(OUT_OF_CREDITS_MESSAGE);
      setShowModal(true);
      return false;
    }
    return true;
  }, [isExhausted]);

  const creditsModal = (
    <InsufficientCreditsModal
      open={showModal}
      onOpenChange={setShowModal}
      errorDetail={modalDetail}
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
