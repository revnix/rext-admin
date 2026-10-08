"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { performLogout } from "@/lib/logout-utils";
import { toast } from "sonner";
import { Notice } from "@/components/ui/notice";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { SubscriptionStatus } from "@/types/subscription";
import { useMemo, useState } from "react";
import { FieldController } from "@/components/forms/field-controller";
import { ToggleController } from "@/components/forms/toggle-controller";
import { PasswordInput } from "@/components/forms/password-input";
import { useZodForm } from "@/components/forms/use-zod-form";
import {
  DEACTIVATION_CONFIRM_TEXT,
  type DeactivateAccountFormValues,
  createDeactivateAccountSchema,
} from "@/schemas/account-schemas";

export function AccountDeactivation() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiClient.profile.get(),
  });

  // Fetch current subscription
  const { data: subscription } = useQuery({
    queryKey: ["current-subscription"],
    queryFn: () => apiClient.subscriptions.getCurrentPlan(),
    retry: false,
  });

  const status = subscription?.subscription?.status;
  // A trial Lemon Squeezy doesn't bill ends with the account: nothing to cancel and
  // nothing renews, so it isn't asked about (D24, rext-control#580). The request
  // still says to end it, which the backend needs for any plan that gives access.
  const isLocalTrial =
    status === SubscriptionStatus.TRIAL &&
    !subscription?.subscription?.lemonsqueezy_subscription_id &&
    !subscription?.billing_account?.lemonsqueezy_subscription_id;
  // A plan that renews counts, a past-due one too: Lemon Squeezy is still retrying
  // its payment, and closing the account stops that.
  const hasActiveSubscriptions =
    !isLocalTrial &&
    (status === SubscriptionStatus.ACTIVE ||
      status === SubscriptionStatus.TRIAL ||
      status === SubscriptionStatus.PAST_DUE);

  // Convert single subscription to array format for easier rendering
  const subscriptions = hasActiveSubscriptions ? [subscription] : [];

  const deactivationSchema = useMemo(
    () => createDeactivateAccountSchema(Boolean(hasActiveSubscriptions)),
    [hasActiveSubscriptions],
  );

  const form = useZodForm(deactivationSchema, {
    defaultValues: {
      reason: "",
      confirm_text: "",
      password: "",
      understood: false,
      cancel_subscriptions: false,
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (data: {
      reason?: string;
      confirm: boolean;
      password: string;
      cancel_subscriptions?: boolean;
    }) => apiClient.account.deactivate(data),
    onSuccess: async (data) => {
      toast.success(
        data.message ||
          "Your account has been deactivated and will be deleted in 14 days.",
      );

      // Intentional UX delay: allow the success toast to be visible before
      // redirect. This is NOT waiting on external/async backend state.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Sign out and redirect
      await performLogout("/auth/signin");
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to deactivate account. Please try again.",
      );
    },
  });

  const handleDeactivate = async (values: DeactivateAccountFormValues) => {
    await deactivateMutation
      .mutateAsync({
        reason: values.reason?.trim() || undefined,
        confirm: true,
        password: values.password,
        cancel_subscriptions: hasActiveSubscriptions
          ? values.cancel_subscriptions
          : isLocalTrial,
      })
      .catch(() => undefined);
  };
  const busy = form.formState.isSubmitting || deactivateMutation.isPending;

  return (
    <div className="space-y-6">
      <Notice tone="danger" title="This schedules your account for deletion">
        Deactivating your account is a serious action. Your account will be
        scheduled for permanent deletion in 14 days.
      </Notice>

      {isLocalTrial && (
        <Notice tone="info" title="Your trial ends now">
          Closing your account ends your trial today. There&apos;s nothing to
          cancel, and nothing renews.
        </Notice>
      )}

      {hasActiveSubscriptions && (
        <Notice tone="warning" title="Active subscriptions detected">
          You have {subscriptions.length} active subscription
          {subscriptions.length > 1 ? "s" : ""}. You&apos;ll need to cancel{" "}
          {subscriptions.length > 1 ? "them" : "it"} before deactivating your
          account, or choose to automatically cancel during deactivation.
        </Notice>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-section text-foreground">Deactivate account</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Once you deactivate your account:
          </p>
        </div>

        <ul className="space-y-2 text-sm text-muted-foreground ml-4">
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>Your account will be immediately disabled</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>You will be logged out of all devices</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>All your data will be permanently deleted after 14 days</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>This action cannot be undone after the 14-day period</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>You can reactivate within 14 days by contacting support</span>
          </li>
        </ul>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              data-rec="show"
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <AlertTriangle />
              Deactivate my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-2xl max-h-[80vh] sm:max-h-[98vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate your account ({profile?.email}) and
                schedule it for permanent deletion in 14 days.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form
              noValidate
              onSubmit={form.handleSubmit(handleDeactivate)}
              className="flex flex-col gap-4"
            >
              <FieldController
                control={form.control}
                name="reason"
                label="Reason for deactivation"
                description="Optional."
              >
                {(field) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={3}
                    disabled={busy}
                  />
                )}
              </FieldController>

              <FieldController
                control={form.control}
                name="confirm_text"
                label={
                  <>
                    Type <strong>{DEACTIVATION_CONFIRM_TEXT}</strong> to confirm
                  </>
                }
                required
              >
                {(field) => (
                  <Input {...field} autoComplete="off" disabled={busy} />
                )}
              </FieldController>

              <FieldController
                control={form.control}
                name="password"
                label="Your password"
                required
              >
                {(field) => (
                  <PasswordInput
                    {...field}
                    autoComplete="current-password"
                    disabled={busy}
                  />
                )}
              </FieldController>

              <ToggleController
                control={form.control}
                name="understood"
                label="I understand that my account will be permanently deleted after 14 days"
                disabled={busy}
              />

              {hasActiveSubscriptions && (
                <ToggleController
                  control={form.control}
                  name="cancel_subscriptions"
                  label={`Cancel my ${subscriptions.length} active subscription${subscriptions.length > 1 ? "s" : ""}`}
                  description="Renewals stop now. The confirmation shows whether your plan stays active, and until when."
                  disabled={busy}
                />
              )}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>
                  Keep my account
                </AlertDialogCancel>
                <Button
                  data-rec="show"
                  type="submit"
                  variant="destructive"
                  disabled={busy}
                >
                  Deactivate account
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
