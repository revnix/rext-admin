"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Loader2, Mail } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  type NotificationPreferences,
  notificationPreferencesSchema,
} from "@/schemas/notification-schemas";
import { updateNotificationPreferences } from "@/services/notification-api";

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

  const emailEnabled = watch("emailNotifications");
  const inAppEnabled = watch("inAppNotifications");
  const emailFrequency = watch("emailDigestFrequency");

  const onSubmit = async (data: NotificationPreferences) => {
    setIsLoading(true);
    try {
      await updateNotificationPreferences(data);
      toast.success("Notification preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
      console.error("[NotificationPreferences] Update failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Email Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Email Notifications</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">
                Enable Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={emailEnabled}
              onCheckedChange={(checked) =>
                setValue("emailNotifications", checked, { shouldDirty: true })
              }
            />
          </div>

          {/* Email digest frequency */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="emailDigestFrequency">Email Frequency</Label>
              <p className="text-sm text-muted-foreground">
                How often to send email notifications
              </p>
            </div>
            <Select
              disabled={!emailEnabled}
              value={emailFrequency}
              onValueChange={(value) =>
                setValue(
                  "emailDigestFrequency",
                  value as "instant" | "daily" | "weekly" | "never",
                  { shouldDirty: true },
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Individual email preferences */}
          <div className="flex items-center justify-between">
            <Label htmlFor="emailWorkspaceInvites">Workspace Invitations</Label>
            <Switch
              id="emailWorkspaceInvites"
              disabled={!emailEnabled}
              checked={watch("emailWorkspaceInvites")}
              onCheckedChange={(checked) =>
                setValue("emailWorkspaceInvites", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="emailMentions">When someone mentions me</Label>
            <Switch
              id="emailMentions"
              disabled={!emailEnabled}
              checked={watch("emailMentions")}
              onCheckedChange={(checked) =>
                setValue("emailMentions", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="emailComments">Comments on my content</Label>
            <Switch
              id="emailComments"
              disabled={!emailEnabled}
              checked={watch("emailComments")}
              onCheckedChange={(checked) =>
                setValue("emailComments", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="emailUpdates">
              Product updates & announcements
            </Label>
            <Switch
              id="emailUpdates"
              disabled={!emailEnabled}
              checked={watch("emailUpdates")}
              onCheckedChange={(checked) =>
                setValue("emailUpdates", checked, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </div>

      {/* In-App Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">In-App Notifications</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inAppNotifications">
                Enable In-App Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the application
              </p>
            </div>
            <Switch
              id="inAppNotifications"
              checked={inAppEnabled}
              onCheckedChange={(checked) =>
                setValue("inAppNotifications", checked, { shouldDirty: true })
              }
            />
          </div>

          {/* Individual in-app preferences */}
          <div className="flex items-center justify-between">
            <Label htmlFor="inAppWorkspaceInvites">Workspace Invitations</Label>
            <Switch
              id="inAppWorkspaceInvites"
              disabled={!inAppEnabled}
              checked={watch("inAppWorkspaceInvites")}
              onCheckedChange={(checked) =>
                setValue("inAppWorkspaceInvites", checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="inAppMentions">When someone mentions me</Label>
            <Switch
              id="inAppMentions"
              disabled={!inAppEnabled}
              checked={watch("inAppMentions")}
              onCheckedChange={(checked) =>
                setValue("inAppMentions", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="inAppComments">Comments on my content</Label>
            <Switch
              id="inAppComments"
              disabled={!inAppEnabled}
              checked={watch("inAppComments")}
              onCheckedChange={(checked) =>
                setValue("inAppComments", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="inAppUpdates">
              Product updates & announcements
            </Label>
            <Switch
              id="inAppUpdates"
              disabled={!inAppEnabled}
              checked={watch("inAppUpdates")}
              onCheckedChange={(checked) =>
                setValue("inAppUpdates", checked, { shouldDirty: true })
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
