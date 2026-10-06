"use client";

import { useQuery } from "@tanstack/react-query";
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

/**
 * The person's billing action, with the button that does it: "Update card" opens Lemon Squeezy's
 * card form in the on-site overlay, "Resume" resumes or un-cancels the same subscription. While
 * one is set the backend refuses a new checkout, so every place that would offer one offers this.
 */
export function useBillingAction() {
  const { data } = useQuery(subscriptionQueries.billingAction());
  const { isLoading, updatePaymentMethod, resumeSubscription } =
    useBillingActions();
  const action = data?.billing_action ?? null;
  if (!action) return null;
  return {
    ...action,
    ...words(action),
    label: action.action === "update_payment_method" ? "Update card" : "Resume",
    run:
      action.action === "update_payment_method"
        ? updatePaymentMethod
        : resumeSubscription,
    busy: isLoading,
  };
}

function ActionNotice({
  action,
  className,
}: {
  action: NonNullable<ReturnType<typeof useBillingAction>>;
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
  const action = useBillingAction();
  if (!action || !kinds.includes(action.action)) return null;
  return <ActionNotice action={action} className={className} />;
}

/**
 * The shell's banner (plan F11): a failed renewal, on every page, at the content's width. Resume
 * waits in Billing and on the plan grid: a cancelled plan still runs, so it needs no banner.
 */
export function ShellBillingBanner() {
  const action = useBillingAction();
  if (action?.action !== "update_payment_method") return null;
  return (
    // layout-ok: the shell's banner above every page, at the content's width and gutters
    <div className="mx-auto w-full max-w-(--content-max) px-4 pt-6 md:px-6 xl:px-8">
      <ActionNotice action={action} />
    </div>
  );
}
