"use client";

import { useQuery } from "@tanstack/react-query";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useEffect, useId, useMemo, useState } from "react";
import { CreditHistoryList } from "@/components/billing/credit-history-list";
import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustUserCredits } from "@/hooks/mutations/use-adjust-user-credits";
import { useShowAfter } from "@/hooks/use-show-after";
import type {
  AdminCreditBreakdown,
  AdminCreditLimits,
} from "@/lib/api-client/admin-credits";
import type { User } from "@/lib/api-client/users";
import {
  adjustmentRequest,
  confirmationLine,
  creditsSummary,
  SUBMIT_LABELS,
} from "@/lib/billing/credit-adjustments";
import { mergeCreditHistory } from "@/lib/billing/credit-history";
import { formatCount } from "@/lib/billing/credits";
import { extractFieldErrors } from "@/lib/error-utils";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { adminUserCreditsQueryOptions } from "@/lib/query-options/credits";
import {
  type AdminCreditAdjustmentValues,
  adminCreditAdjustmentSchema,
} from "@/schemas/admin-schemas";
import type { CreditAdjustmentAction } from "@/types/subscription";

interface UserCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const ACTIONS: {
  value: CreditAdjustmentAction;
  label: string;
  description: string;
}[] = [
  {
    value: "add",
    label: "Add",
    description:
      "Credits on top of the plan's, lasting or with an expiry. They are the user's: they stay when the subscription changes, for example when a trial user subscribes.",
  },
  {
    value: "deduct",
    label: "Deduct",
    description:
      "Takes added credits first, then the month's, never below 0. A bonus is left alone.",
  },
  {
    value: "reset",
    label: "Reset",
    description: "Sets the month's credits back to the plan's amount.",
  },
];

const EMPTY: AdminCreditAdjustmentValues = {
  action: "add",
  amount: "",
  expires_at: "",
  reason: "",
};

/** What the question before a deduct or a reset says under its title, and its way out. */
const BEFORE: Record<
  Exclude<CreditAdjustmentAction, "add">,
  { description: string; keep: string }
> = {
  deduct: {
    description:
      "Added credits are taken first, then the month's. When fewer are there than asked for, what is there is taken. The customer sees the change and your reason.",
    keep: "Keep the credits",
  },
  reset: {
    description:
      "The month's credits go back to the plan's amount, whatever is left of them now. The customer sees the change and your reason.",
    keep: "Leave them as they are",
  },
};

/**
 * A user's credits for a super admin (FB2.28): what they can spend now and where it comes from,
 * the form that adds, deducts or resets them, and every admin change so far. The backend checks
 * the role again, audits each change and refuses one on a Super Admin's account.
 */
export function UserCreditsDialog({
  open,
  onOpenChange,
  user,
}: UserCreditsDialogProps) {
  if (!user) return null;
  // Keyed, so each opening and each user starts with nothing unsaved, under way or being asked.
  return (
    <CreditsDialog
      key={`${user.id}:${open}`}
      open={open}
      // The page's handler closes whatever it is told, so it is called only to close.
      onClose={() => onOpenChange(false)}
      user={user}
    />
  );
}

function CreditsDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
}) {
  const historyId = useId();
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const credits = useQuery({
    ...adminUserCreditsQueryOptions(user.id),
    enabled: open,
  });
  const showSkeleton = useShowAfter(open && credits.isPending);

  // The close button, Escape or a click outside: with anything entered, ask before discarding it.
  // While a change is under way the dialog stays: the request is out and can't be taken back.
  const requestClose = () => {
    if (saving) return;
    if (unsaved) setConfirming(true);
    else onClose();
  };

  const name = user.display_name || user.full_name;
  const rows = credits.data ? mergeCreditHistory(credits.data, "admin") : [];

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Credits</DialogTitle>
            <DialogDescription className="wrap-anywhere">
              {name ? `${name} (${user.email})` : user.email}. Every change is
              audited, and the customer sees it with its reason.
            </DialogDescription>
          </DialogHeader>

          {credits.isPending ? (
            showSkeleton && <Skeleton className="h-64 w-full" />
          ) : credits.isError ? (
            <Notice
              tone="danger"
              title="The credits didn't load"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void credits.refetch()}
                >
                  Try again
                </Button>
              }
            >
              {credits.error.message || "Something went wrong reading them."}
            </Notice>
          ) : (
            <>
              <CreditsSummary credits={credits.data.credits} />

              {credits.data.credits.subscription_id === null ? (
                <Notice tone="info" title="Nothing to change">
                  This user has no plan that grants access, so there are no
                  credits to add, deduct or reset.
                </Notice>
              ) : (
                <CreditAdjustmentForm
                  user={user}
                  credits={credits.data.credits}
                  limits={credits.data.limits}
                  onDirtyChange={setUnsaved}
                  onSubmittingChange={setSaving}
                />
              )}

              <section
                aria-labelledby={historyId}
                className="flex flex-col gap-3"
              >
                <h2 id={historyId} className="text-section">
                  History
                </h2>
                {rows.length === 0 ? (
                  <p className="text-body text-muted-foreground">
                    No admin has changed this user's credits.
                  </p>
                ) : (
                  <CreditHistoryList
                    rows={rows}
                    label="Admin changes to the credits"
                    unknownActor="an admin whose account is gone"
                  />
                )}
              </section>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this change?</AlertDialogTitle>
            <AlertDialogDescription>
              What you've entered hasn't been sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>
              Discard change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CreditsSummary({ credits }: { credits: AdminCreditBreakdown }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2">
      {creditsSummary(credits).map(({ label, value }) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-caption text-muted-foreground">{label}</dt>
          <dd className="num wrap-anywhere text-body text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CreditAdjustmentForm({
  user,
  credits,
  limits,
  onDirtyChange,
  onSubmittingChange,
}: {
  user: User;
  credits: AdminCreditBreakdown;
  /** What a change may ask for, when the backend sent it: the form holds no limit of its own. */
  limits: AdminCreditLimits | undefined;
  /** Whether anything entered is unsent, so closing the dialog can ask first. */
  onDirtyChange: (dirty: boolean) => void;
  /** Whether a change is under way, so nothing closes the dialog until it settles. */
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const ids = useId();
  const schema = useMemo(() => adminCreditAdjustmentSchema(limits), [limits]);
  const form = useZodForm(schema, { defaultValues: EMPTY });
  const adjust = useAdjustUserCredits();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Told again as false when the form goes (the credits failing to load again takes its place),
  // so the dialog is never left waiting on a form that is no longer there.
  const { isDirty, isSubmitting } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);
  useEffect(() => {
    onSubmittingChange(isSubmitting);
    return () => onSubmittingChange(false);
  }, [isSubmitting, onSubmittingChange]);

  const action = form.watch("action");
  const planCredits = credits.credits_per_month;
  // The backend says whether a reset is possible (a trial has monthly credits and still
  // can't be reset); one that doesn't say yet is read as before.
  const canReset =
    credits.can_reset ?? (planCredits !== null && planCredits > 0);
  const amountMax = limits?.amount_max;
  const line = confirmationLine(
    {
      action,
      amount: form.watch("amount"),
      expires_at: form.watch("expires_at"),
    },
    user.email,
    planCredits,
    { amountMax },
  );
  const serverError = form.formState.errors.root?.server?.message;

  const send = async (values: AdminCreditAdjustmentValues) => {
    try {
      await adjust.mutateAsync({
        user: { id: user.id, email: user.email },
        body: adjustmentRequest(values),
      });
      // Sent: nothing is unsaved, so the dialog closes without asking.
      form.reset(EMPTY);
    } catch (error) {
      // The backend's message goes beside the field it is about, when that field is on screen.
      const messages = extractFieldErrors(error);
      const shown = (["amount", "expires_at", "reason"] as const).filter(
        (field) =>
          messages[field] &&
          (field === "reason" ||
            (field === "amount" && values.action !== "reset") ||
            (field === "expires_at" && values.action === "add")),
      );
      shown.forEach((field, index) => {
        form.setError(
          field,
          { type: "server", message: messages[field] },
          { shouldFocus: index === 0 },
        );
      });
      if (shown.length === 0) {
        form.setError("root.server", {
          message:
            error instanceof Error && error.message
              ? error.message
              : "Something went wrong. Try again.",
        });
      }
    }
  };

  // An add is sent at once; a deduct or a reset can take credits away, so it asks first. Awaited
  // to the end, the answer included: the form is submitting from the click until the request ends.
  const onSubmit = async (values: AdminCreditAdjustmentValues) => {
    if (values.action !== "add") {
      const before = BEFORE[values.action];
      const question =
        confirmationLine(values, user.email, planCredits, { amountMax }) ??
        SUBMIT_LABELS[values.action];
      const sure = await confirm({
        title: `${question}?`,
        description: before.description,
        confirmText: SUBMIT_LABELS[values.action],
        cancelText: before.keep,
        variant: "destructive",
      });
      if (!sure) return;
    }
    await send(values);
  };

  return (
    <>
      <FormShell
        form={form}
        onSubmit={onSubmit}
        submitLabel={SUBMIT_LABELS[action]}
      >
        {serverError && (
          <Notice tone="danger" title="The credits weren't changed">
            {serverError}
          </Notice>
        )}

        <FormSection title="Change the credits">
          <FieldController control={form.control} name="action" label="Action">
            {(field) => (
              <RadioGroupPrimitive.Root
                id={field.id}
                aria-label="Action"
                value={field.value}
                onValueChange={field.onChange}
                className="divide-y divide-border rounded-md border border-border"
              >
                {ACTIONS.map((option) => {
                  const unavailable = option.value === "reset" && !canReset;
                  return (
                    <label
                      key={option.value}
                      htmlFor={`${ids}-${option.value}`}
                      className="flex cursor-pointer items-start gap-3 px-3 py-2.5 first:rounded-t-md last:rounded-b-md hover:bg-surface-inset has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60 has-data-[state=checked]:bg-surface-inset"
                    >
                      <RadioGroupPrimitive.Item
                        id={`${ids}-${option.value}`}
                        value={option.value}
                        disabled={unavailable}
                        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:border-primary"
                      >
                        <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
                      </RadioGroupPrimitive.Item>
                      <span className="space-y-0.5">
                        <span className="block text-label text-foreground">
                          {option.label}
                        </span>
                        <span className="block text-caption text-muted-foreground">
                          {unavailable
                            ? "This plan has no monthly credits to reset to."
                            : option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </RadioGroupPrimitive.Root>
            )}
          </FieldController>

          {action !== "reset" && (
            <FieldController
              control={form.control}
              name="amount"
              label="Amount"
              required
              description={
                amountMax === undefined
                  ? "A whole number of credits."
                  : `A whole number of credits from 1 to ${formatCount(amountMax)}.`
              }
            >
              {(field) => (
                <Input
                  {...field}
                  inputMode="numeric"
                  autoComplete="off"
                  className="num"
                />
              )}
            </FieldController>
          )}

          {action === "add" && (
            <FieldController
              control={form.control}
              name="expires_at"
              label="Expires on"
              description="Optional. With a day, the credits count until that day ends and are spent before the month's. Without one they last, and are spent after."
            >
              {(field) => (
                <Input
                  {...field}
                  type="date"
                  min={dateFormat.iso(new Date())}
                />
              )}
            </FieldController>
          )}

          <FieldController
            control={form.control}
            name="reason"
            label="Reason"
            required
            maxLength={limits?.reason_max}
            description="The customer sees this in their credit history."
          >
            {(field) => <Textarea {...field} rows={3} />}
          </FieldController>

          <p className="wrap-anywhere rounded-md border border-border bg-surface-inset px-3 py-2 text-body text-foreground">
            {line ?? "Complete the fields above to see what will happen."}
          </p>
        </FormSection>
      </FormShell>
      {ConfirmationComponent}
    </>
  );
}
