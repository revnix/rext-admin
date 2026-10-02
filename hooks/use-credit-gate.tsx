"use client";

import { useCallback, useEffect, useState } from "react";
import { InsufficientCreditsModal } from "@/components/subscription/insufficient-credits-modal";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspaceOptional } from "@/providers/workspace-provider";

const OUT_OF_CREDITS_MESSAGE =
  "You're out of credits. Please upgrade your plan to continue.";

/**
 * Single credit gate for every flow that starts or continues a generation.
 *
 * The backend bills per pipeline stage (serp_seo 1 … deep_research 4 …
 * humanization 5, 15 total per article), so a partial balance buys a run that
 * dies halfway and leaves the user with nothing. Starting therefore requires a
 * whole article's worth, not merely a non-zero balance.
 *
 * - `ensureCredits()` — starting a new generation; needs a full article.
 * - `ensureCreditsToContinue()` — resuming an in-flight one; only a fully
 *   exhausted balance stops an article whose earlier stages are already paid for.
 *
 * Both open the upgrade popup and return false when they block, so the caller
 * bails before anything is sent.
 */
export function useCreditGate() {
  const onWorkspacePage = useWorkspaceOptional() !== null;
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const credits = useSubscriptionStore((s) => s.credits);
  const fetchCredits = useSubscriptionStore((s) => s.fetchCredits);
  const [showModal, setShowModal] = useState(false);
  const workspaceId = onWorkspacePage ? currentWorkspace?.id : undefined;

  useEffect(() => {
    // Wait for the real workspace id on workspace pages — prevents firing an account-level
    // fetch before the workspace UUID resolves, which causes duplicate calls
    if (onWorkspacePage && !workspaceId) return;
    fetchCredits(workspaceId).catch(() => {});
  }, [onWorkspacePage, workspaceId, fetchCredits]);

  // articles_remaining is the backend's own `credits // 15` — how many whole
  // articles the balance covers. null means an unlimited plan; an unloaded
  // balance is not a block.
  const isUnlimited = !credits || credits.articles_remaining === null;

  // Cannot afford a complete article — starting would burn credits for nothing.
  const isBlocked = !isUnlimited && (credits?.articles_remaining ?? 0) < 1;

  // ponytail: a run that overruns 15 credits (outline/topic regenerations are
  // billed per call) can still exhaust mid-flight; the stream's
  // `credits.exhausted` event catches that. Model per-stage remaining cost here
  // if regeneration overruns become common.
  const isExhausted = !isUnlimited && (credits?.current_credits ?? 0) <= 0;

  const openCreditsModal = useCallback(() => setShowModal(true), []);

  const ensureCredits = useCallback(() => {
    if (isBlocked) {
      setShowModal(true);
      return false;
    }
    return true;
  }, [isBlocked]);

  const ensureCreditsToContinue = useCallback(() => {
    if (isExhausted) {
      setShowModal(true);
      return false;
    }
    return true;
  }, [isExhausted]);

  const creditsModal = (
    <InsufficientCreditsModal
      open={showModal}
      onOpenChange={setShowModal}
      errorDetail={OUT_OF_CREDITS_MESSAGE}
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
