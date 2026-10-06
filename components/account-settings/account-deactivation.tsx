"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { performLogout } from "@/lib/logout-utils";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { SubscriptionStatus } from "@/types/subscription";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

  // A plan that renews counts, a past-due one too: Lemon Squeezy is still retrying
  // its payment, and closing the account stops that.
  const hasActiveSubscriptions =
    subscription &&
    (subscription?.subscription?.status === SubscriptionStatus.ACTIVE ||
      subscription?.subscription?.status === SubscriptionStatus.TRIAL ||
      subscription?.subscription?.status === SubscriptionStatus.PAST_DUE);

  // Convert single subscription to array format for easier rendering
  const subscriptions = hasActiveSubscriptions ? [subscription] : [];

  const deactivationSchema = useMemo(
    () => createDeactivateAccountSchema(Boolean(hasActiveSubscriptions)),
    [hasActiveSubscriptions],
  );

  const form = useForm<DeactivateAccountFormValues>({
    resolver: zodResolver(deactivationSchema),
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

  const handleDeactivate = (values: DeactivateAccountFormValues) => {
    deactivateMutation.mutate({
      reason: values.reason?.trim() || undefined,
      confirm: true,
      password: values.password,
      cancel_subscriptions: hasActiveSubscriptions
        ? values.cancel_subscriptions
        : false,
    });
  };

  // const formValues = form.watch();

  // const isConfirmValid =
  //   formValues.confirm_text === "DEACTIVATE" &&
  //   formValues.understood &&
  //   (!hasActiveSubscriptions || formValues.cancel_subscriptions);

  return (
    <Form {...form}>
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Deactivating your account is a serious
            action. Your account will be scheduled for permanent deletion in 14
            days.
          </AlertDescription>
        </Alert>

        {hasActiveSubscriptions && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Active Subscriptions Detected</strong>
              <p className="mt-2">
                You have {subscriptions.length} active subscription
                {subscriptions.length > 1 ? "s" : ""}. You&apos;ll need to
                cancel {subscriptions.length > 1 ? "them" : "it"} before
                deactivating your account, or choose to automatically cancel
                during deactivation.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-destructive">
              Deactivate Account
            </h3>
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
              <span>
                All your data will be permanently deleted after 14 days
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>This action cannot be undone after the 14-day period</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>
                You can reactivate within 14 days by contacting support
              </span>
            </li>
          </ul>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Deactivate My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl max-h-[80vh] sm:max-h-[98vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  Deactivate Account
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate your account ({profile?.email}) and
                  schedule it for permanent deletion in 14 days.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <form
                onSubmit={form.handleSubmit(handleDeactivate)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="reason">
                        Reason for deactivation (optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="reason"
                          rows={3}
                          disabled={deactivateMutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="confirm-text">
                        Type <strong>{DEACTIVATION_CONFIRM_TEXT}</strong> to
                        confirm
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="confirm-text"
                          disabled={deactivateMutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="password-text">
                        Type password to proceed
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="password-text"
                          type="password"
                          disabled={deactivateMutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="understood"
                  render={({ field }) => (
                    <FormItem className="p-4 border rounded-md bg-muted/50">
                      <div className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            id="understood"
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                            disabled={deactivateMutation.isPending}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel
                            htmlFor="understood"
                            className="cursor-pointer font-medium"
                          >
                            I understand that my account will be permanently
                            deleted after 14 days
                          </FormLabel>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {hasActiveSubscriptions && (
                  <FormField
                    control={form.control}
                    name="cancel_subscriptions"
                    render={({ field }) => (
                      <FormItem className="p-4 border rounded-md bg-destructive/10 border-destructive/20">
                        <div className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              id="cancel-subscriptions-inline"
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                              disabled={deactivateMutation.isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel
                              htmlFor="cancel-subscriptions-inline"
                              className="cursor-pointer font-medium"
                            >
                              Automatically cancel my {subscriptions.length}{" "}
                              active subscription
                              {subscriptions.length > 1 ? "s" : ""}
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Renewals stop now. The confirmation shows whether
                              your plan stays active, and until when.
                            </p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deactivateMutation.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={deactivateMutation.isPending}
                  >
                    Deactivate Account
                  </Button>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Form>
  );
}
