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
  notificationPreferencesSchema,
} from "@/schemas/notification-schemas";

interface NotificationPreferencesFormProps {
  initialPreferences: NotificationPreferences;
}

export function NotificationPreferencesForm({
  initialPreferences,
}: NotificationPreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<NotificationPreferences>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: initialPreferences,
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
              checked={watch("workspace_invitation")}
              onCheckedChange={(checked) =>
                setValue("workspace_invitation", checked, { shouldDirty: true })
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
              checked={watch("invitation_accepted")}
              onCheckedChange={(checked) =>
                setValue("invitation_accepted", checked, { shouldDirty: true })
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
              checked={watch("role_changed")}
              onCheckedChange={(checked) =>
                setValue("role_changed", checked, { shouldDirty: true })
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
              checked={watch("member_removed")}
              onCheckedChange={(checked) =>
                setValue("member_removed", checked, { shouldDirty: true })
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
              checked={watch("content_generation_started")}
              onCheckedChange={(checked) =>
                setValue("content_generation_started", checked, {
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
              checked={watch("content_generation_completed")}
              onCheckedChange={(checked) =>
                setValue("content_generation_completed", checked, {
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
              checked={watch("content_generation_failed")}
              onCheckedChange={(checked) =>
                setValue("content_generation_failed", checked, {
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
              checked={watch("content_published")}
              onCheckedChange={(checked) =>
                setValue("content_published", checked, { shouldDirty: true })
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
              checked={watch("payment_succeeded")}
              onCheckedChange={(checked) =>
                setValue("payment_succeeded", checked, { shouldDirty: true })
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
              checked={watch("payment_failed")}
              onCheckedChange={(checked) =>
                setValue("payment_failed", checked, { shouldDirty: true })
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
              checked={watch("subscription_cancelled")}
              onCheckedChange={(checked) =>
                setValue("subscription_cancelled", checked, {
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
              checked={watch("subscription_expiring_soon")}
              onCheckedChange={(checked) =>
                setValue("subscription_expiring_soon", checked, {
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
              checked={watch("trial_ending_soon")}
              onCheckedChange={(checked) =>
                setValue("trial_ending_soon", checked, { shouldDirty: true })
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
              checked={watch("usage_limit_warning")}
              onCheckedChange={(checked) =>
                setValue("usage_limit_warning", checked, { shouldDirty: true })
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
              checked={watch("usage_limit_exceeded")}
              onCheckedChange={(checked) =>
                setValue("usage_limit_exceeded", checked, { shouldDirty: true })
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
              checked={watch("marketing")}
              onCheckedChange={(checked) =>
                setValue("marketing", checked, { shouldDirty: true })
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
