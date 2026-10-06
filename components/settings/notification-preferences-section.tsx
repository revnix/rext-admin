"use client";

import { NotificationPreferencesForm } from "@/components/notification-settings/notification-preferences";
import { NotificationPreferencesLoadError } from "@/components/notification-settings/notification-preferences-load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { SettingsGroup } from "./settings-group";

/**
 * Account settings, Notifications: the preferences by channel and kind. The table itself is D7's to
 * restyle; this section only holds it.
 */
export function NotificationPreferencesSection() {
  const { data: preferences, isLoading, error } = useNotificationPreferences();

  return (
    <SettingsGroup
      title="Notifications"
      description="What you hear about, and where: by email, in the app, or in a digest."
    >
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : error ? (
        <NotificationPreferencesLoadError
          message={
            error instanceof Error
              ? error.message
              : "Your notification preferences didn't load. Refresh the page to try again."
          }
        />
      ) : (
        preferences && (
          <NotificationPreferencesForm initialPreferences={preferences} />
        )
      )}
    </SettingsGroup>
  );
}
