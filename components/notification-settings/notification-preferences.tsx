"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, BookOpen, CreditCard, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import {
  type NotificationPreferences,
  type NotificationPreferencesApiResponse,
  notificationPreferencesSchema,
} from "@/schemas/notification-schemas";

interface NotificationPreferencesFormProps {
  initialPreferences: NotificationPreferencesApiResponse;
}

// The API returns digest fields flat at the root of data, alongside the nested
// category objects. We extend the type locally to cover those root-level fields.
type ApiResponseWithDigest = NotificationPreferencesApiResponse & {
  digest_enabled?: boolean;
  digest_frequency?: "daily" | "weekly" | "monthly";
};

// Transform API response to form structure
export function transformApiToFormData(
  apiData: ApiResponseWithDigest,
): NotificationPreferences {
  return {
    // Workspace notifications
    ws_invite_received:
      apiData.workspace_notifications?.invite_received ?? false,
    ws_invite_accepted:
      apiData.workspace_notifications?.invite_accepted ?? false,
    ws_role_changed: apiData.workspace_notifications?.role_changed ?? false,
    ws_member_removed: apiData.workspace_notifications?.member_removed ?? false,

    // Content generation
    gen_completed: apiData.content_generation?.generation_completed ?? false,
    gen_started: apiData.content_generation?.generation_started ?? false,
    gen_failed: apiData.content_generation?.generation_failed ?? false,
    gen_published: apiData.content_generation?.content_published ?? false,

    // Billing
    billing_payment_success: apiData.billing?.payment_success ?? false,
    billing_payment_failed: apiData.billing?.payment_failed ?? false,
    billing_subscription_cancelled:
      apiData.billing?.subscription_cancelled ?? false,
    billing_subscription_expiring:
      apiData.billing?.subscription_expiring ?? false,
    billing_trial_ending: apiData.billing?.trial_ending ?? false,
    billing_usage_limit_warning: apiData.billing?.usage_limit_warning ?? false,
    billing_usage_limit_exceeded:
      apiData.billing?.usage_limit_exceeded ?? false,

    // Knowledge base
    kb_processing_completed:
      apiData.knowledge_base?.processing_completed ?? false,
    kb_processing_failed: apiData.knowledge_base?.processing_failed ?? false,

    // Email digest — API returns these flat at root level, not inside email_digest
    digest_enabled:
      apiData.digest_enabled ?? apiData.email_digest?.enabled ?? false,
    digest_frequency:
      apiData.digest_frequency ?? apiData.email_digest?.frequency ?? "daily",

    // Marketing
    marketing_updates: apiData.marketing?.marketing_updates ?? false,
  };
}

export function NotificationPreferencesForm({
  initialPreferences,
}: NotificationPreferencesFormProps) {
  // Cast so transformApiToFormData can read root-level digest fields
  const typedPreferences = initialPreferences as ApiResponseWithDigest;
  const [isLoading, setIsLoading] = useState(false);
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<NotificationPreferences>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: transformApiToFormData(typedPreferences),
  });

  const digestEnabled = watch("digest_enabled");
  const digestFrequency = watch("digest_frequency");

  const onSubmit = async (data: NotificationPreferences) => {
    setIsLoading(true);
    try {
      await apiClient.notifications.updatePreferences(data);
      toast.success("Notification preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
      log.error("[NotificationPreferences] Update failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Workspace Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Workspace Notifications</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="workspace_invitation">
                Workspace Invitations
              </Label>
              <p className="text-sm text-muted-foreground">
                When you're invited to join a workspace
              </p>
            </div>
            <Switch
              id="workspace_invitation"
              checked={watch("ws_invite_received")}
              onCheckedChange={(checked) =>
                setValue("ws_invite_received", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="invitation_accepted">Invitation Accepted</Label>
              <p className="text-sm text-muted-foreground">
                When someone accepts your workspace invitation
              </p>
            </div>
            <Switch
              id="invitation_accepted"
              checked={watch("ws_invite_accepted")}
              onCheckedChange={(checked) =>
                setValue("ws_invite_accepted", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="role_changed">Role Changes</Label>
              <p className="text-sm text-muted-foreground">
                When your role in a workspace changes
              </p>
            </div>
            <Switch
              id="role_changed"
              checked={watch("ws_role_changed")}
              onCheckedChange={(checked) =>
                setValue("ws_role_changed", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="member_removed">Member Removal</Label>
              <p className="text-sm text-muted-foreground">
                When a member is removed from your workspace
              </p>
            </div>
            <Switch
              id="member_removed"
              checked={watch("ws_member_removed")}
              onCheckedChange={(checked) =>
                setValue("ws_member_removed", checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Content Generation Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText
            className="h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold">Content Generation</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="content_generation_started">
                Generation Started
              </Label>
              <p className="text-sm text-muted-foreground">
                When content generation begins
              </p>
            </div>
            <Switch
              id="content_generation_started"
              checked={watch("gen_started")}
              onCheckedChange={(checked) =>
                setValue("gen_started", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="content_generation_completed">
                Generation Completed
              </Label>
              <p className="text-sm text-muted-foreground">
                When your content is ready
              </p>
            </div>
            <Switch
              id="content_generation_completed"
              checked={watch("gen_completed")}
              onCheckedChange={(checked) =>
                setValue("gen_completed", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="content_generation_failed">
                Generation Failed
              </Label>
              <p className="text-sm text-muted-foreground">
                When content generation encounters an error
              </p>
            </div>
            <Switch
              id="content_generation_failed"
              checked={watch("gen_failed")}
              onCheckedChange={(checked) =>
                setValue("gen_failed", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="content_published">Content Published</Label>
              <p className="text-sm text-muted-foreground">
                When your content is successfully published
              </p>
            </div>
            <Switch
              id="content_published"
              checked={watch("gen_published")}
              onCheckedChange={(checked) =>
                setValue("gen_published", checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Billing Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard
            className="h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold">Billing & Payments</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="payment_succeeded">Payment Successful</Label>
              <p className="text-sm text-muted-foreground">
                When a payment is processed successfully
              </p>
            </div>
            <Switch
              id="payment_succeeded"
              checked={watch("billing_payment_success")}
              onCheckedChange={(checked) =>
                setValue("billing_payment_success", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="payment_failed">Payment Failed</Label>
              <p className="text-sm text-muted-foreground">
                When a payment attempt fails
              </p>
            </div>
            <Switch
              id="payment_failed"
              checked={watch("billing_payment_failed")}
              onCheckedChange={(checked) =>
                setValue("billing_payment_failed", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="subscription_cancelled">
                Subscription Cancelled
              </Label>
              <p className="text-sm text-muted-foreground">
                When your subscription is cancelled
              </p>
            </div>
            <Switch
              id="subscription_cancelled"
              checked={watch("billing_subscription_cancelled")}
              onCheckedChange={(checked) =>
                setValue("billing_subscription_cancelled", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="subscription_expiring_soon">
                Subscription Expiring
              </Label>
              <p className="text-sm text-muted-foreground">
                When your subscription is about to expire
              </p>
            </div>
            <Switch
              id="subscription_expiring_soon"
              checked={watch("billing_subscription_expiring")}
              onCheckedChange={(checked) =>
                setValue("billing_subscription_expiring", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="trial_ending_soon">Trial Ending</Label>
              <p className="text-sm text-muted-foreground">
                When your trial period is ending
              </p>
            </div>
            <Switch
              id="trial_ending_soon"
              checked={watch("billing_trial_ending")}
              onCheckedChange={(checked) =>
                setValue("billing_trial_ending", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="usage_limit_warning">Usage Limit Warning</Label>
              <p className="text-sm text-muted-foreground">
                When approaching your usage limits
              </p>
            </div>
            <Switch
              id="usage_limit_warning"
              checked={watch("billing_usage_limit_warning")}
              onCheckedChange={(checked) =>
                setValue("billing_usage_limit_warning", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="usage_limit_exceeded">Usage Limit Exceeded</Label>
              <p className="text-sm text-muted-foreground">
                When you've exceeded your usage limits
              </p>
            </div>
            <Switch
              id="usage_limit_exceeded"
              checked={watch("billing_usage_limit_exceeded")}
              onCheckedChange={(checked) =>
                setValue("billing_usage_limit_exceeded", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Knowledge Base Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen
            className="h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold">Knowledge Base</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="kb_processing_completed">
                Processing Completed
              </Label>
              <p className="text-sm text-muted-foreground">
                When knowledge base processing is complete
              </p>
            </div>
            <Switch
              id="kb_processing_completed"
              checked={watch("kb_processing_completed")}
              onCheckedChange={(checked) =>
                setValue("kb_processing_completed", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="kb_processing_failed">Processing Failed</Label>
              <p className="text-sm text-muted-foreground">
                When knowledge base processing fails
              </p>
            </div>
            <Switch
              id="kb_processing_failed"
              checked={watch("kb_processing_failed")}
              onCheckedChange={(checked) =>
                setValue("kb_processing_failed", checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Digest Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Email Digest</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digest_enabled">Enable Email Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary of activity in your account
              </p>
            </div>
            <Switch
              id="digest_enabled"
              checked={digestEnabled}
              onCheckedChange={(checked) =>
                setValue("digest_enabled", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="digest_frequency">Digest Frequency</Label>
              <p className="text-sm text-muted-foreground">
                How often to send digest emails
              </p>
            </div>
            <Select
              disabled={!digestEnabled}
              value={digestFrequency}
              onValueChange={(value) =>
                setValue(
                  "digest_frequency",
                  value as "daily" | "weekly" | "monthly",
                  { shouldDirty: true },
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Marketing */}
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">
                Receive product updates, tips, and special offers
              </p>
            </div>
            <Switch
              id="marketing"
              checked={watch("marketing_updates")}
              onCheckedChange={(checked) =>
                setValue("marketing_updates", checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </form>
  );
}
