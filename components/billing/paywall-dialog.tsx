"use client";

import { useQuery } from "@tanstack/react-query";
import { PlanGrid } from "@/components/billing/plan-grid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthSession } from "@/hooks/use-auth-session";
import { subscriptionQueries } from "@/lib/query-keys";
import type { CreditBalance } from "@/types/subscription";
import { endedOnWords, paywallState } from "./paywall-state";

/**
 * The paywall (plans/app/F-billing.md §2 item 3, design/app-language.md §8): a billed action that
 * the balance can't start opens this instead of sending the person away. It says why (the
 * backend's own shortfall, or the trial's end), what one article costs and what is in hand, and
 * shows the plan grid inline. Reading, editing, copying and exporting what was written stay open.
 */
export function PaywallDialog({
  open,
  onOpenChange,
  reason,
  credits,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Why this action can't start: the credit gate's shortfall, in the backend's numbers. */
  reason: string;
  credits?: CreditBalance | null;
}) {
  const { user } = useAuthSession();
  // The trial is the person's own: on a workspace they don't own, the credits are the owner's.
  const ownCredits =
    !credits?.target_user_id || credits.target_user_id === user?.id;
  const trial = useQuery({
    ...subscriptionQueries.trialStatus(),
    enabled: open && ownCredits,
  });
  const catalog = useQuery({ ...subscriptionQueries.catalog(), enabled: open });
  const perArticle = catalog.data?.credits.per_article ?? null;
  const state = paywallState({
    trial: ownCredits ? trial.data : null,
    credits,
    perArticle,
  });

  const title =
    state?.kind === "trial-ended"
      ? `Your trial ended on ${endedOnWords(state.endedOn)}`
      : "Not enough credits for this";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {[
              // The gate's reason already says what is in hand.
              reason,
              perArticle ? `One article is ${perArticle} credits.` : null,
              ownCredits
                ? "Choose a plan to keep writing. Everything you've written stays open to read, edit and export."
                : "The credits are this workspace owner's: ask them to choose a plan. Everything written here stays open to read, edit and export.",
            ]
              .filter(Boolean)
              .join(" ")}
          </DialogDescription>
        </DialogHeader>
        {ownCredits && <PlanGrid />}
      </DialogContent>
    </Dialog>
  );
}
