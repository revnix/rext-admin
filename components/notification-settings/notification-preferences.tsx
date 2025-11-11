"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Shield,
  CreditCard,
  Users,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const emailEnabled = watch("email_enabled");
  const inAppEnabled = watch("in_app_enabled");
  const digestEnabled = watch("digest_enabled");
  const digestFrequency = watch("digest_frequency");

  // Watch all categories
  const categories = watch("categories");

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
      {/* Master Toggles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Notification Channels</h3>
        </div>

        <Alert>
          <BellOff className="h-4 w-4" />
          <AlertDescription>
            <strong>Master Controls:</strong> Disable a channel to stop all
            notifications through that method. Individual categories can be
            fine-tuned below.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_enabled" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email_enabled"
              checked={emailEnabled}
              onCheckedChange={(checked) =>
                setValue("email_enabled", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in_app_enabled" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                In-App Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications within the application
              </p>
            </div>
            <Switch
              id="in_app_enabled"
              checked={inAppEnabled}
              onCheckedChange={(checked) =>
                setValue("in_app_enabled", checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Notification Categories */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Notification Categories</h3>
          <p className="text-sm text-muted-foreground">
            Choose which types of notifications you want to receive
          </p>
        </div>

        {/* Mentions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <h4 className="text-base font-medium">Mentions & Comments</h4>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mentions">Mentions</Label>
                <p className="text-sm text-muted-foreground">
                  When someone mentions you in a comment or discussion
                </p>
              </div>
              <Switch
                id="mentions"
                checked={categories.mentions}
                onCheckedChange={(checked) =>
                  setValue("categories.mentions", checked, { shouldDirty: true })
                }
                disabled={!emailEnabled && !inAppEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="comments">Comments</Label>
                <p className="text-sm text-muted-foreground">
                  When someone comments on your content
                </p>
              </div>
              <Switch
                id="comments"
                checked={categories.comments}
                onCheckedChange={(checked) =>
                  setValue("categories.comments", checked, { shouldDirty: true })
                }
                disabled={!emailEnabled && !inAppEnabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Workspace Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <h4 className="text-base font-medium">Workspace Activity</h4>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workspace_invites">Workspace Invitations</Label>
                <p className="text-sm text-muted-foreground">
                  When you're invited to join a workspace
                </p>
              </div>
              <Switch
                id="workspace_invites"
                checked={categories.workspace_invites}
                onCheckedChange={(checked) =>
                  setValue("categories.workspace_invites", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={!emailEnabled && !inAppEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="team_activity">Team Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about team members and workspace changes
                </p>
              </div>
              <Switch
                id="team_activity"
                checked={categories.team_activity}
                onCheckedChange={(checked) =>
                  setValue("categories.team_activity", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={!emailEnabled && !inAppEnabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Content Updates */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <h4 className="text-base font-medium">Content Updates</h4>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="content_updates">Content Updates</Label>
                <p className="text-sm text-muted-foreground">
                  When content is created, updated, or published
                </p>
              </div>
              <Switch
                id="content_updates"
                checked={categories.content_updates}
                onCheckedChange={(checked) =>
                  setValue("categories.content_updates", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={!emailEnabled && !inAppEnabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Security Alerts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <h4 className="text-base font-medium">Security & Account</h4>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security_alerts">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications and login alerts
                </p>
              </div>
              <Switch
                id="security_alerts"
                checked={categories.security_alerts}
                onCheckedChange={(checked) =>
                  setValue("categories.security_alerts", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={!emailEnabled && !inAppEnabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Billing */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <h4 className="text-base font-medium">Billing & Payments</h4>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="billing_updates">Billing Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Payment receipts, subscription changes, and billing issues
                </p>
              </div>
              <Switch
                id="billing_updates"
                checked={categories.billing_updates}
                onCheckedChange={(checked) =>
                  setValue("categories.billing_updates", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={!emailEnabled && !inAppEnabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Product Updates */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <h4 className="text-base font-medium">Product Updates</h4>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="product_updates">Product Updates</Label>
                <p className="text-sm text-muted-foreground">
                  New features, tips, and special offers
                </p>
              </div>
              <Switch
                id="product_updates"
                checked={categories.product_updates}
                onCheckedChange={(checked) =>
                  setValue("categories.product_updates", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={!emailEnabled && !inAppEnabled}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Digest Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Email Digest</h3>
        </div>

        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digest_enabled">Enable Email Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a periodic summary of activity
              </p>
            </div>
            <Switch
              id="digest_enabled"
              checked={digestEnabled}
              onCheckedChange={(checked) =>
                setValue("digest_enabled", checked, { shouldDirty: true })
              }
              disabled={!emailEnabled}
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
              key={`digest-frequency-${digestFrequency}`}
              disabled={!digestEnabled || !emailEnabled}
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

      {/* Data Loss Warning */}
      {(emailEnabled || inAppEnabled) && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Category toggles apply to both email and
            in-app notifications. Disabling a category will stop notifications
            through both channels.
          </AlertDescription>
        </Alert>
      )}

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
