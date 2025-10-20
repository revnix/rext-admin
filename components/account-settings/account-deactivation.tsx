"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { UserSubscription } from "@/types/subscription";
import { SubscriptionStatus } from "@/types/subscription";

export function AccountDeactivation() {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancelSubscriptions, setCancelSubscriptions] = useState(false);

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

  // Check if user has an active subscription
  const hasActiveSubscriptions =
    subscription &&
    (subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIAL);

  // Convert single subscription to array format for easier rendering
  const subscriptions = hasActiveSubscriptions ? [subscription] : [];

  const deactivateMutation = useMutation({
    mutationFn: (data: {
      reason?: string;
      confirm: boolean;
      cancel_subscriptions?: boolean;
    }) => apiClient.account.deactivate(data),
    onSuccess: async (data) => {
      toast.success(
        data.message ||
          "Your account has been deactivated and will be deleted in 14 days.",
      );

      // Wait a moment to show the toast
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Sign out and redirect
      await signOut({ callbackUrl: "/auth/signin" });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to deactivate account. Please try again.",
      );
    },
  });

  const handleDeactivate = () => {
    if (!understood || confirmText !== "DEACTIVATE") {
      toast.error(
        "Please confirm you understand the consequences and type DEACTIVATE to proceed.",
      );
      return;
    }

    if (hasActiveSubscriptions && !cancelSubscriptions) {
      toast.error(
        "Please confirm automatic cancellation of your active subscriptions to proceed.",
      );
      return;
    }

    deactivateMutation.mutate({
      reason: reason || undefined,
      confirm: true,
      cancel_subscriptions: hasActiveSubscriptions
        ? cancelSubscriptions
        : false,
    });
  };

  const isConfirmValid =
    confirmText === "DEACTIVATE" &&
    understood &&
    (!hasActiveSubscriptions || cancelSubscriptions);

  return (
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
              {subscriptions.length > 1 ? "s" : ""}. You&apos;ll need to cancel{" "}
              {subscriptions.length > 1 ? "them" : "it"} before deactivating
              your account, or choose to automatically cancel during
              deactivation.
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
            <Button variant="destructive" className="w-full sm:w-auto">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Deactivate My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Deactivate Account
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate your account ({profile?.email}) and
                schedule it for permanent deletion in 14 days.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              {hasActiveSubscriptions && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong className="block mb-2">
                      Active Subscriptions Found
                    </strong>
                    <div className="space-y-2 text-sm">
                      {subscriptions.map((sub: UserSubscription) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded"
                        >
                          <div>
                            <div className="font-medium">{sub.plan_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Status: {sub.status}
                              {sub.current_period_end &&
                                ` • Renews ${new Date(sub.current_period_end).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason for deactivation (optional)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Help us improve by letting us know why you're leaving..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  disabled={deactivateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-text">
                  Type <strong>DEACTIVATE</strong> to confirm
                </Label>
                <Input
                  id="confirm-text"
                  type="text"
                  placeholder="DEACTIVATE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={deactivateMutation.isPending}
                />
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/50">
                <Checkbox
                  id="understood"
                  checked={understood}
                  onCheckedChange={(checked) =>
                    setUnderstood(checked as boolean)
                  }
                  disabled={deactivateMutation.isPending}
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="understood"
                    className="cursor-pointer font-medium"
                  >
                    I understand that my account will be permanently deleted
                    after 14 days
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    You can contact support within 14 days to reactivate your
                    account
                  </p>
                </div>
              </div>

              {hasActiveSubscriptions && (
                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-destructive/10 border-destructive/20">
                  <Checkbox
                    id="cancel-subscriptions"
                    checked={cancelSubscriptions}
                    onCheckedChange={(checked) =>
                      setCancelSubscriptions(checked as boolean)
                    }
                    disabled={deactivateMutation.isPending}
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="cancel-subscriptions"
                      className="cursor-pointer font-medium"
                    >
                      Automatically cancel my {subscriptions.length} active
                      subscription{subscriptions.length > 1 ? "s" : ""}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      All active subscriptions will be canceled immediately.
                      You&apos;ll retain access until the end of your current
                      billing period.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deactivateMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={!isConfirmValid || deactivateMutation.isPending}
              >
                {deactivateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  "Deactivate Account"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
