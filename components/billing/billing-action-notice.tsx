"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TrialBanner } from "@/components/billing/trial-banner";
import { PageBand } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Notice, type NoticeTone } from "@/components/ui/notice";
import { useBillingActions } from "@/hooks/use-billing-actions";
import { subscriptionQueries } from "@/lib/query-keys";
import type { BillingAction } from "@/types/subscription";

/** "October 1": the day a payment failed or a plan ends, in the person's time zone. */
function day(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

/**
 * What the notice says (plan F11, the coordinator's decision of 2026-10-06 on rext-control #336).
 * Lemon Squeezy gives no time for its next retry, so a failed renewal names no cut-off date.
 */
function words(action: BillingAction): {
  tone: NoticeTone;
  title: string;
  text: string;
} {
  if (action.action === "update_payment_method") {
    if (action.status === "unpaid") {
      return {
        tone: "danger",
        title: "Your renewal couldn't be collected",
        text: "Your plan is on hold. Update your card to reactivate it.",
      };
    }
    const failed = day(action.payment_failed_at);
    return {
      tone: "warning",
      title: failed
        ? `Your payment on ${failed} failed`
        : "Your last payment failed",
      text: "We'll retry automatically over the next two weeks. Update your card to avoid an interruption.",
    };
  }
  if (action.status === "paused") {
    return {
      tone: "info",
      title: "Your subscription is paused",
      text: "Resume it to use your plan again.",
    };
  }
  const ends = day(action.ends_at);
  return {
    tone: "info",
    title: ends
      ? `Your subscription ends on ${ends}`
      : "Your subscription is cancelled",
    text: "Resume it to keep your plan after that date.",
  };
}

/** The action, its words and the button that does it. */
export type ResolvedBillingAction = BillingAction &
  ReturnType<typeof words> & { label: string; run: () => void; busy: boolean };

/**
 * The person's billing action, with the button that does it: "Update card" opens Lemon Squeezy's
 * card form in the on-site overlay, "Resume" resumes or un-cancels the same subscription. While
 * one is set the backend refuses a new checkout, so every place that would offer one offers this.
 * `settled` is true only once the backend has answered: until then, or when the request failed
 * (`failed`), no one can tell whether a checkout would be refused.
 */
export function useBillingAction() {
  const queryClient = useQueryClient();
  const query = useQuery(subscriptionQueries.billingAction());
  const { isLoading, updatePaymentMethod, resumeSubscription } =
    useBillingActions();
  const [resumed, setResumed] = useState(false);
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: subscriptionQueries.billingAction().queryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: subscriptionQueries.current().queryKey,
      }),
    ]);
  // After a resume, the action and the current plan are read again, and once more a little
  // later: our record changes when Lemon Squeezy's webhook lands, usually seconds after.
  const resume = async () => {
    if (!(await resumeSubscription())) return;
    setResumed(true);
    await refresh();
    setTimeout(() => void refresh(), RESUME_SETTLE_MS);
  };
  const raw = query.data?.billing_action ?? null;
  const action: ResolvedBillingAction | null = raw
    ? {
        ...raw,
        ...words(raw),
        label:
          raw.action === "update_payment_method"
            ? "Update card"
            : isLoading
              ? "Resuming…"
              : "Resume",
        run:
          raw.action === "update_payment_method" ? updatePaymentMethod : resume,
        busy: isLoading,
      }
    : null;
  return {
    action,
    /** A resume went through in this visit; the plan may still read cancelled for a moment. */
    resumed,
    settled: query.isSuccess,
    failed: query.isError,
    retry: () => void query.refetch(),
  };
}

const RESUME_SETTLE_MS = 5000;

function ActionNotice({
  action,
  className,
}: {
  action: ResolvedBillingAction;
  className?: string;
}) {
  return (
    <Notice
      tone={action.tone}
      title={action.title}
      className={className}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={action.run}
          disabled={action.busy}
        >
          {action.label}
        </Button>
      }
    >
      {action.text}
    </Notice>
  );
}

/** The billing action as a Notice, for the actions in `kinds` only. */
export function BillingActionNotice({
  kinds,
  className,
}: {
  kinds: BillingAction["action"][];
  className?: string;
}) {
  const { action } = useBillingAction();
  if (!action || !kinds.includes(action.action)) return null;
  return <ActionNotice action={action} className={className} />;
}

/**
 * The shell's one banner slot, on every page at the content's width (plans F11 and F6): a failed
 * renewal first, then the trial ending or ended (TrialBanner), then nothing. Resume waits in Plan
 * and on the plan grid: a cancelled plan still runs, so it needs no banner.
 */
export function ShellBillingBanner() {
  const { action } = useBillingAction();
  if (action?.action !== "update_payment_method") return <TrialBanner />;
  return (
    <PageBand>
      <ActionNotice action={action} />
    </PageBand>
  );
}
