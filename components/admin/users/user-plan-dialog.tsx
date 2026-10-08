"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChoiceList } from "@/components/forms/choice-list";
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
import {
  useChangeUserPlan,
  useExtendUserTrial,
} from "@/hooks/mutations/use-change-user-plan";
import { useShowAfter } from "@/hooks/use-show-after";
import type { AdminUserPlan } from "@/lib/api-client/admin-plan";
import type { User } from "@/lib/api-client/users";
import {
  beforePlanChange,
  billingChoices,
  chosenChange,
  defaultBilling,
  defaultPeriod,
  periodChoices,
  planChangeLine,
  planChangeRequest,
  planChoices,
  planSummary,
  trialDayLimits,
  trialExtensionLine,
  trialExtensionRequest,
} from "@/lib/billing/plan-changes";
import { extractFieldErrors } from "@/lib/error-utils";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { adminUserPlanQueryOptions } from "@/lib/query-options/admin-plan";
import {
  type AdminPlanChangeValues,
  type AdminTrialExtensionValues,
  adminPlanChangeSchema,
  adminTrialExtensionSchema,
} from "@/schemas/admin-schemas";

interface UserPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const EMPTY_CHANGE: AdminPlanChangeValues = {
  plan_id: "",
  billing_period: "",
  billing: "",
  reason: "",
};

const EMPTY_EXTENSION: AdminTrialExtensionValues = { ends_on: "", reason: "" };

const KEPT_WITH_AUDIT =
  "Kept with the audit entry. The customer doesn't see it.";

/**
 * A user's plan for a super admin (FB2.29): the plan that grants access now, and the one change
 * the backend allows for it: a move to another plan, billed the way the admin chooses, or for a
 * trial a later end. Which plans, periods and ways of billing exist, what each leaves and why one
 * is refused all come with the read; the backend checks the role again, changes the plan at Lemon
 * Squeezy first, audits each change and refuses one on a Super Admin's account.
 *
 * A refusal is shown in the backend's own words under a title that claims nothing about the
 * outcome: one of them says Lemon Squeezy has changed the plan although it couldn't be recorded.
 */
export function UserPlanDialog({
  open,
  onOpenChange,
  user,
}: UserPlanDialogProps) {
  if (!user) return null;
  // Keyed, so each opening and each user starts with nothing unsaved, under way or being asked.
  return (
    <PlanDialog
      key={`${user.id}:${open}`}
      open={open}
      // The page's handler closes whatever it is told, so it is called only to close.
      onClose={() => onOpenChange(false)}
      user={user}
    />
  );
}

function PlanDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
}) {
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const plan = useQuery({
    ...adminUserPlanQueryOptions(user.id),
    enabled: open,
  });
  const showSkeleton = useShowAfter(open && plan.isPending);

  // The close button, Escape or a click outside: with anything entered, ask before discarding it.
  // While a change is under way the dialog stays: the request is out and can't be taken back.
  const requestClose = () => {
    if (saving) return;
    if (unsaved) setConfirming(true);
    else onClose();
  };

  const name = user.display_name || user.full_name;

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
            <DialogTitle>Plan</DialogTitle>
            <DialogDescription className="wrap-anywhere">
              {name ? `${name} (${user.email})` : user.email}. Every change is
              audited with its reason. The customer's activity shows the change,
              not the reason.
            </DialogDescription>
          </DialogHeader>

          {plan.isPending ? (
            showSkeleton && <Skeleton className="h-64 w-full" />
          ) : plan.isError ? (
            <Notice
              tone="danger"
              title="The plan didn't load"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void plan.refetch()}
                >
                  Try again
                </Button>
              }
            >
              {plan.error.message || "Something went wrong reading it."}
            </Notice>
          ) : (
            <>
              <PlanSummary plan={plan.data} />
              <PlanActions
                user={user}
                plan={plan.data}
                onDirtyChange={setUnsaved}
                onSubmittingChange={setSaving}
              />
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

function PlanSummary({ plan }: { plan: AdminUserPlan }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 rounded-md border border-border bg-card p-4 sm:grid-cols-3">
      {planSummary(plan.subscription).map(({ label, value }) => (
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

interface FormProps {
  user: User;
  plan: AdminUserPlan;
  /** Whether anything entered is unsent, so closing the dialog can ask first. */
  onDirtyChange: (dirty: boolean) => void;
  /** Whether a change is under way, so nothing closes the dialog until it settles. */
  onSubmittingChange: (submitting: boolean) => void;
}

/**
 * The one thing the backend allows for this user: the plan form, or for a trial the extension
 * form under the reason its plan can't be changed, or only the reason.
 */
function PlanActions(props: FormProps) {
  const { change, trial_extension: extension, subscription } = props.plan;
  if (change.allowed) return <PlanChangeForm {...props} />;
  return (
    <>
      <Notice
        tone="info"
        title={subscription ? "The plan can't be changed" : "Nothing to change"}
      >
        {change.refused_reason ??
          (subscription
            ? "This user's plan can't be changed here."
            : "This user has no plan that grants access.")}
      </Notice>
      {extension.allowed ? (
        <TrialExtensionForm {...props} />
      ) : (
        subscription?.is_trial &&
        extension.refused_reason && (
          <Notice tone="info" title="The trial can't be extended">
            {extension.refused_reason}
          </Notice>
        )
      )}
    </>
  );
}

/**
 * Tells the dialog what the form holds. Told again as false when the form goes (the plan read
 * again after a change can take its place), so the dialog is never left waiting on a form that is
 * no longer there.
 */
function useReportFormState(
  { isDirty, isSubmitting }: { isDirty: boolean; isSubmitting: boolean },
  { onDirtyChange, onSubmittingChange }: FormProps,
) {
  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);
  useEffect(() => {
    onSubmittingChange(isSubmitting);
    return () => onSubmittingChange(false);
  }, [isSubmitting, onSubmittingChange]);
}

const refusalMessage = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Try again.";

function PlanChangeForm(props: FormProps) {
  const { user, plan } = props;
  const schema = useMemo(() => adminPlanChangeSchema(plan), [plan]);
  const form = useZodForm(schema, { defaultValues: EMPTY_CHANGE });
  const change = useChangeUserPlan();
  const { confirm, ConfirmationComponent } = useConfirmation();
  useReportFormState(form.formState, props);

  const picked = {
    plan_id: form.watch("plan_id"),
    billing_period: form.watch("billing_period"),
    billing: form.watch("billing"),
  };
  const choice = plan.plans.find((item) => item.id === picked.plan_id);
  const period = choice?.periods.find(
    (item) => item.billing_period === picked.billing_period,
  );
  const renewsAt = plan.subscription?.renews_at;
  const billing = billingChoices(period, renewsAt);
  const line = planChangeLine(plan, picked, user.email);
  const serverError = form.formState.errors.root?.server?.message;

  const set = (name: "plan_id" | "billing_period" | "billing", value: string) =>
    form.setValue(name, value, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  // A newly picked plan starts on the user's own period where it has one, and a newly picked
  // period on the backend's default billing: a later field never keeps a choice the earlier one
  // no longer offers.
  const pickPeriod = (billingPeriod: string, of = choice) => {
    set("billing_period", billingPeriod);
    set(
      "billing",
      defaultBilling(
        of?.periods.find((item) => item.billing_period === billingPeriod),
        plan.change.default_billing,
      ),
    );
  };
  const pickPlan = (planId: string) => {
    const next = plan.plans.find((item) => item.id === planId);
    set("plan_id", planId);
    pickPeriod(defaultPeriod(next, plan.subscription?.billing_period), next);
  };

  const send = async (values: AdminPlanChangeValues) => {
    try {
      await change.mutateAsync({
        user: { id: user.id, email: user.email },
        body: planChangeRequest(values),
      });
      // Sent: nothing is unsaved, so the dialog closes without asking.
      form.reset(EMPTY_CHANGE);
    } catch (error) {
      // The backend's message goes beside the field it is about.
      const messages = extractFieldErrors(error);
      const shown = (
        ["plan_id", "billing_period", "billing", "reason"] as const
      ).filter((field) => messages[field]);
      shown.forEach((field, index) => {
        form.setError(
          field,
          { type: "server", message: messages[field] },
          { shouldFocus: index === 0 },
        );
      });
      if (shown.length === 0)
        form.setError("root.server", { message: refusalMessage(error) });
    }
  };

  // A change that charges the customer now, or moves them to a smaller plan, asks first. Awaited
  // to the end, the answer included: the form is submitting from the click until the request ends.
  const onSubmit = async (values: AdminPlanChangeValues) => {
    const chosen = chosenChange(plan, values);
    const before =
      chosen && beforePlanChange(chosen.period.kind, chosen.mode.billing);
    if (chosen && before) {
      const sure = await confirm({
        title: `Move ${user.email} to ${chosen.choice.display_name}, ${chosen.period.billing_period}?`,
        description: before,
        confirmText: "Change plan",
        cancelText: "Keep the current plan",
        variant: "destructive",
      });
      if (!sure) return;
    }
    await send(values);
  };

  return (
    <>
      <FormShell form={form} onSubmit={onSubmit} submitLabel="Change plan">
        {serverError && (
          <Notice tone="danger" title="The plan change didn't complete">
            {serverError}
          </Notice>
        )}

        <FormSection title="Change the plan">
          <FieldController
            control={form.control}
            name="plan_id"
            label="New plan"
            required
          >
            {(field) => (
              <ChoiceList
                id={field.id}
                label="New plan"
                value={field.value}
                onChange={pickPlan}
                choices={planChoices(plan)}
                aria-invalid={field["aria-invalid"]}
                aria-describedby={field["aria-describedby"]}
              />
            )}
          </FieldController>

          {choice && (
            <FieldController
              control={form.control}
              name="billing_period"
              label="Billing period"
              required
            >
              {(field) => (
                <ChoiceList
                  id={field.id}
                  label="Billing period"
                  value={field.value}
                  onChange={(value) => pickPeriod(value)}
                  choices={periodChoices(choice, plan.currency)}
                  aria-invalid={field["aria-invalid"]}
                  aria-describedby={field["aria-describedby"]}
                />
              )}
            </FieldController>
          )}

          {billing.length > 0 && (
            <FieldController
              control={form.control}
              name="billing"
              label="Billing"
              required
            >
              {(field) => (
                <ChoiceList
                  id={field.id}
                  label="Billing"
                  value={field.value}
                  onChange={(value) => set("billing", value)}
                  choices={billing}
                  aria-invalid={field["aria-invalid"]}
                  aria-describedby={field["aria-describedby"]}
                />
              )}
            </FieldController>
          )}

          <FieldController
            control={form.control}
            name="reason"
            label="Reason"
            required
            maxLength={plan.limits.reason_max}
            description={KEPT_WITH_AUDIT}
          >
            {(field) => <Textarea {...field} rows={3} />}
          </FieldController>

          <p className="wrap-anywhere rounded-md border border-border bg-surface-inset px-3 py-2 text-body text-foreground">
            {line ?? "Choose a plan above to see what will happen."}
          </p>
        </FormSection>
      </FormShell>
      {ConfirmationComponent}
    </>
  );
}

function TrialExtensionForm(props: FormProps) {
  const { user, plan } = props;
  const schema = useMemo(() => adminTrialExtensionSchema(plan), [plan]);
  const form = useZodForm(schema, { defaultValues: EMPTY_EXTENSION });
  const extend = useExtendUserTrial();
  useReportFormState(form.formState, props);

  const currentEnd = plan.subscription?.trial_ends_at;
  const limits = trialDayLimits(plan.trial_extension, currentEnd);
  const line = trialExtensionLine(
    { ends_on: form.watch("ends_on") },
    plan,
    user.email,
  );
  const serverError = form.formState.errors.root?.server?.message;
  const keepsTime = "The trial ends that day at the time of day it ends now.";

  const onSubmit = async (values: AdminTrialExtensionValues) => {
    try {
      await extend.mutateAsync({
        user: { id: user.id, email: user.email },
        body: trialExtensionRequest(values, currentEnd),
      });
      form.reset(EMPTY_EXTENSION);
    } catch (error) {
      // The backend names the end `ends_at`; here it is the day's field.
      const messages = extractFieldErrors(error);
      const shown = (
        [
          ["ends_on", messages.ends_at],
          ["reason", messages.reason],
        ] as const
      ).filter(([, message]) => message);
      shown.forEach(([field, message], index) => {
        form.setError(
          field,
          { type: "server", message },
          { shouldFocus: index === 0 },
        );
      });
      if (shown.length === 0)
        form.setError("root.server", { message: refusalMessage(error) });
    }
  };

  return (
    <FormShell form={form} onSubmit={onSubmit} submitLabel="Extend trial">
      {serverError && (
        <Notice tone="danger" title="The trial extension didn't complete">
          {serverError}
        </Notice>
      )}

      <FormSection title="Extend the trial">
        <FieldController
          control={form.control}
          name="ends_on"
          label="New end date"
          required
          description={
            limits
              ? `A day from ${dateFormat.short(limits.min)} to ${dateFormat.short(limits.max)}. ${keepsTime}`
              : keepsTime
          }
        >
          {(field) => (
            <Input {...field} type="date" min={limits?.min} max={limits?.max} />
          )}
        </FieldController>

        <FieldController
          control={form.control}
          name="reason"
          label="Reason"
          required
          maxLength={plan.limits.reason_max}
          description={KEPT_WITH_AUDIT}
        >
          {(field) => <Textarea {...field} rows={3} />}
        </FieldController>

        <p className="wrap-anywhere rounded-md border border-border bg-surface-inset px-3 py-2 text-body text-foreground">
          {line ?? "Choose a day above to see what will happen."}
        </p>
      </FormSection>
    </FormShell>
  );
}
